/**
 * P2P WebRTC service
 *
 * Manages RTCPeerConnections for PTT and calls.
 * Audio flows directly between devices — the server only relays
 * SDP offer/answer and ICE candidates via Socket.io.
 *
 * For 1-on-1: one RTCPeerConnection
 * For groups: mesh — one RTCPeerConnection per peer
 */

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { getSocket } from './socket';
import { createLogger } from '../utils/logger';

const log = createLogger('webrtc');

// Local type aliases — react-native-webrtc does not re-export these from its main index
interface SdpInit { sdp: string; type: string | null }
interface IceCandidateInfo { candidate?: string; sdpMLineIndex?: number | null; sdpMid?: string | null }

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Map of peerId → RTCPeerConnection
const connections = new Map<string, RTCPeerConnection>();
let localStream: MediaStream | null = null;

// Callbacks set by the consumer (hooks / screens)
let onRemoteStream: ((peerId: string, stream: MediaStream) => void) | null = null;
let onPeerDisconnected: ((peerId: string) => void) | null = null;

export function setCallbacks(callbacks: {
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onPeerDisconnected?: (peerId: string) => void;
}) {
  if (callbacks.onRemoteStream) onRemoteStream = callbacks.onRemoteStream;
  if (callbacks.onPeerDisconnected) onPeerDisconnected = callbacks.onPeerDisconnected;
}

// Initialise local audio stream (video added separately via addVideoTrack)
export async function initLocalStream(withVideo = false): Promise<MediaStream> {
  if (localStream) {
    log.debug('initLocalStream: reusing existing stream');
    return localStream;
  }

  log.info('initLocalStream', { withVideo });
  localStream = await mediaDevices.getUserMedia({
    audio: true,
    video: withVideo
      ? { facingMode: 'user', width: 640, height: 480 }
      : false,
  });

  // Start muted — PTT unmutes when floor is granted
  localStream.getAudioTracks().forEach((t) => { t.enabled = false; });
  log.info('local stream ready', {
    audioTracks: localStream.getAudioTracks().length,
    videoTracks: localStream.getVideoTracks().length,
  });

  return localStream;
}

export function getLocalStream(): MediaStream | null {
  return localStream;
}

// Mute / unmute the local mic across all connections (for PTT)
export function setMicEnabled(enabled: boolean): void {
  const tracks = localStream?.getAudioTracks() ?? [];
  tracks.forEach((t) => { t.enabled = enabled; });
  log.debug('mic', { enabled, trackCount: tracks.length });
}

// Add video track to all existing connections (call upgrade to video)
export async function addVideoTrack(): Promise<void> {
  if (!localStream) {
    log.warn('addVideoTrack called before localStream initialised');
    return;
  }
  if (localStream.getVideoTracks().length > 0) {
    log.debug('addVideoTrack: video track already present, skipping');
    return;
  }

  log.info('addVideoTrack: capturing camera');
  const videoStream = await mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user' } });
  const videoTrack = videoStream.getVideoTracks()[0];
  if (!videoTrack) {
    log.warn('addVideoTrack: no video track returned by getUserMedia');
    return;
  }

  localStream.addTrack(videoTrack);
  log.info('addVideoTrack: track added to localStream');

  for (const [peerId, pc] of connections.entries()) {
    pc.addTrack(videoTrack, localStream);
    log.debug('addVideoTrack: renegotiating with peer', { peerId });
    await _sendOffer(peerId, pc);
  }
}

// Remove video (downgrade back to audio-only)
export function removeVideoTrack(): void {
  const videoTracks = localStream?.getVideoTracks() ?? [];
  videoTracks.forEach((t) => {
    t.stop();
    localStream?.removeTrack(t);
  });
  log.info('removeVideoTrack', { removed: videoTracks.length });
}

// Create a new peer connection to `peerId` and initiate the offer
export async function startConnection(peerId: string): Promise<void> {
  if (connections.has(peerId)) {
    log.debug('startConnection: already have connection', { peerId });
    return;
  }

  log.info('startConnection: creating peer connection', { peerId });
  const pc = _createPeerConnection(peerId);
  connections.set(peerId, pc);

  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream!));
    log.debug('startConnection: local tracks added', { peerId, trackCount: localStream.getTracks().length });
  }

  await _sendOffer(peerId, pc);
}

// Called when we receive an offer from a peer (we are the answerer)
export async function handleOffer(peerId: string, offer: SdpInit): Promise<void> {
  log.info('handleOffer: received', { peerId });
  let pc = connections.get(peerId);
  if (!pc) {
    pc = _createPeerConnection(peerId);
    connections.set(peerId, pc);
    if (localStream) {
      localStream.getTracks().forEach((t) => pc!.addTrack(t, localStream!));
    }
  }

  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  log.debug('handleOffer: answer sent', { peerId });

  getSocket().emit('signal:answer', { to: peerId, answer });
}

export async function handleAnswer(peerId: string, answer: SdpInit): Promise<void> {
  const pc = connections.get(peerId);
  if (!pc) {
    log.warn('handleAnswer: no connection found', { peerId });
    return;
  }
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  log.debug('handleAnswer: remote description set', { peerId });
}

export async function handleIceCandidate(peerId: string, candidate: IceCandidateInfo): Promise<void> {
  const pc = connections.get(peerId);
  if (!pc) return; // peer may have already disconnected
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err: any) {
    log.warn('handleIceCandidate: failed to add candidate', { peerId, err: err.message });
  }
}

// Tear down connection to one peer
export function closeConnection(peerId: string): void {
  const pc = connections.get(peerId);
  if (!pc) return;
  pc.close();
  connections.delete(peerId);
  log.info('connection closed', { peerId, remaining: connections.size });
  onPeerDisconnected?.(peerId);
}

// Tear down all connections and release media
export function cleanup(): void {
  log.info('cleanup: closing all connections', { count: connections.size });
  for (const [peerId, pc] of connections.entries()) {
    pc.close();
    onPeerDisconnected?.(peerId);
  }
  connections.clear();
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
}

// Register socket listeners for incoming WebRTC signaling events.
// Call once after connecting to the socket.
export function registerSignalingListeners(): void {
  const socket = getSocket();

  // Remove any previous listeners to prevent duplicates on re-register
  socket.off('signal:offer');
  socket.off('signal:answer');
  socket.off('signal:ice');

  socket.on('signal:offer', ({ from, offer }: { from: string; offer: SdpInit }) => {
    log.debug('signal:offer received', { from });
    handleOffer(from, offer);
  });

  socket.on('signal:answer', ({ from, answer }: { from: string; answer: SdpInit }) => {
    log.debug('signal:answer received', { from });
    handleAnswer(from, answer);
  });

  socket.on('signal:ice', ({ from, candidate }: { from: string; candidate: IceCandidateInfo }) => {
    handleIceCandidate(from, candidate);
  });

  log.info('signaling listeners registered');
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _createPeerConnection(peerId: string): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  // Cast to any for event wiring — event-target-shim types don't resolve cleanly
  // under moduleResolution:"bundler". The addEventListener API is correct at runtime.
  const pcAny = pc as any;

  pcAny.addEventListener('icecandidate', (event: any) => {
    if (event.candidate) {
      getSocket().emit('signal:ice', { to: peerId, candidate: event.candidate });
    }
  });

  pcAny.addEventListener('icegatheringstatechange', () => {
    log.debug('ICE gathering state', { peerId, state: pcAny.iceGatheringState });
  });

  // iceconnectionstatechange is more reliably fired in react-native-webrtc than connectionstatechange
  pcAny.addEventListener('iceconnectionstatechange', () => {
    const state = pcAny.iceConnectionState as string;
    log.info('ICE connection state', { peerId, state });
    if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      log.warn('peer connection lost', { peerId, state });
      closeConnection(peerId);
    }
  });

  pcAny.addEventListener('track', (event: any) => {
    const remoteStream: MediaStream = event.streams?.[0];
    if (remoteStream) {
      log.info('remote track received', { peerId, kind: event.track?.kind });
      onRemoteStream?.(peerId, remoteStream);
    }
  });

  pcAny.addEventListener('negotiationneeded', () => {
    log.debug('negotiation needed', { peerId });
  });

  log.debug('peer connection created', { peerId });
  return pc;
}

async function _sendOffer(peerId: string, pc: RTCPeerConnection): Promise<void> {
  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  log.debug('offer sent', { peerId });
  getSocket().emit('signal:offer', { to: peerId, offer });
}

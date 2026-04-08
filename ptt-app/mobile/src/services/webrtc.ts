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
  MediaStreamTrack,
} from 'react-native-webrtc';
import { getSocket } from './socket';

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

// Initialise local audio (and optionally video) stream
export async function initLocalStream(withVideo = false): Promise<MediaStream> {
  if (localStream) return localStream;

  localStream = await mediaDevices.getUserMedia({
    audio: true,
    video: withVideo
      ? { facingMode: 'user', width: 640, height: 480 }
      : false,
  });

  // Start muted — PTT unmutes when floor is granted
  localStream.getAudioTracks().forEach((t) => { t.enabled = false; });

  return localStream;
}

export function getLocalStream(): MediaStream | null {
  return localStream;
}

// Mute / unmute the local mic across all connections (for PTT)
export function setMicEnabled(enabled: boolean): void {
  localStream?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
}

// Add video track to all existing connections (call upgrade)
export async function addVideoTrack(): Promise<void> {
  if (!localStream) return;

  const videoStream = await mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user' } });
  const videoTrack = videoStream.getVideoTracks()[0];
  if (!videoTrack) return;

  localStream.addTrack(videoTrack);

  for (const [peerId, pc] of connections.entries()) {
    pc.addTrack(videoTrack, localStream);
    // Renegotiate
    await _sendOffer(peerId, pc);
  }
}

// Remove video (downgrade back to audio)
export function removeVideoTrack(): void {
  localStream?.getVideoTracks().forEach((t) => {
    t.stop();
    localStream?.removeTrack(t);
  });
}

// Create a new peer connection to `peerId` and initiate the offer
export async function startConnection(peerId: string): Promise<void> {
  if (connections.has(peerId)) return; // already connected

  const pc = _createPeerConnection(peerId);
  connections.set(peerId, pc);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream!));
  }

  await _sendOffer(peerId, pc);
}

// Called when we receive an offer from a peer (we are the answerer)
export async function handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
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

  getSocket().emit('signal:answer', { to: peerId, answer });
}

export async function handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
  const pc = connections.get(peerId);
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
  const pc = connections.get(peerId);
  if (!pc) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch {
    // Ignore stale candidates
  }
}

// Tear down connection to one peer
export function closeConnection(peerId: string): void {
  const pc = connections.get(peerId);
  if (!pc) return;
  pc.close();
  connections.delete(peerId);
  onPeerDisconnected?.(peerId);
}

// Tear down all connections and release media
export function cleanup(): void {
  for (const [peerId, pc] of connections.entries()) {
    pc.close();
    onPeerDisconnected?.(peerId);
  }
  connections.clear();
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
}

// Register socket listeners for incoming signaling events
export function registerSignalingListeners(): void {
  const socket = getSocket();

  socket.on('signal:offer', ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
    handleOffer(from, offer);
  });

  socket.on('signal:answer', ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
    handleAnswer(from, answer);
  });

  socket.on('signal:ice', ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
    handleIceCandidate(from, candidate);
  });
}

// ─── Private helpers ───────────────────────────────────────────────────────

function _createPeerConnection(peerId: string): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.addEventListener('icecandidate', (event: any) => {
    if (event.candidate) {
      getSocket().emit('signal:ice', { to: peerId, candidate: event.candidate });
    }
  });

  pc.addEventListener('track', (event: any) => {
    const remoteStream: MediaStream = event.streams?.[0];
    if (remoteStream) onRemoteStream?.(peerId, remoteStream);
  });

  pc.addEventListener('connectionstatechange', () => {
    if ((pc as any).connectionState === 'disconnected' || (pc as any).connectionState === 'failed') {
      closeConnection(peerId);
    }
  });

  return pc;
}

async function _sendOffer(peerId: string, pc: RTCPeerConnection): Promise<void> {
  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  getSocket().emit('signal:offer', { to: peerId, offer });
}

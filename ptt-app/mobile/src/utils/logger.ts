/**
 * Mobile structured logger
 *
 * Usage:
 *   const log = createLogger('webrtc');
 *   log.info('peer connected', { peerId });
 *   log.warn('ICE failed', { peerId, state });
 *   log.error('getUserMedia failed', { err: e.message });
 *
 * In production builds, DEBUG logs are stripped automatically via
 * the __DEV__ flag so they don't appear in release bundles.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m', // grey
  info:  '\x1b[36m', // cyan
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function emit(level: Level, tag: string, msg: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && !__DEV__) return; // strip debug logs from release builds

  const prefix = `${COLORS[level]}[${level.toUpperCase()}][${tag}]${RESET}`;
  const metaStr = meta ? ' ' + JSON.stringify(meta) : '';

  switch (level) {
    case 'error': console.error(`${prefix} ${msg}${metaStr}`); break;
    case 'warn':  console.warn(`${prefix} ${msg}${metaStr}`);  break;
    default:      console.log(`${prefix} ${msg}${metaStr}`);   break;
  }
}

export function createLogger(tag: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', tag, msg, meta),
    info:  (msg: string, meta?: Record<string, unknown>) => emit('info',  tag, msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => emit('warn',  tag, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => emit('error', tag, msg, meta),
  };
}

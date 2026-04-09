/**
 * Backend structured logger
 *
 * Usage:
 *   import { logger } from './logger';
 *   const log = logger('pttHandler');
 *   log.info('floor granted', { userId, conversationId });
 *   log.warn('floor already held', { holder });
 *   log.error('db write failed', { err });
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const MIN_LEVEL: Level = (process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function emit(level: Level, tag: string, msg: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    tag,
    msg,
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export function logger(tag: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', tag, msg, meta),
    info:  (msg: string, meta?: Record<string, unknown>) => emit('info',  tag, msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => emit('warn',  tag, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => emit('error', tag, msg, meta),
  };
}

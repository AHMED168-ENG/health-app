import env from './env.js';

const LEVELS = { error: 0, warn: 1, info: 2 };
const activeLevel = LEVELS[env.logLevel] ?? LEVELS.info;

function write(level, message, extra) {
  if (LEVELS[level] > activeLevel) return;
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const detail = extra ? ` ${JSON.stringify(extra)}` : '';
  const line = `${stamp} [${level.toUpperCase()}] ${message}${detail}`;

  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  error: (message, extra) => write('error', message, extra),
  warn: (message, extra) => write('warn', message, extra),
  info: (message, extra) => write('info', message, extra),
};

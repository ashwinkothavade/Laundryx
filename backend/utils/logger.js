const winston = require('winston');

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

// Human-friendly, colorized output for local development.
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
    const metaStr = metaKeys.length
      ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
      : '';
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  })
);

// Structured JSON in production so logs are queryable by whatever aggregates
// them (Vercel log drains, CloudWatch, Datadog, ...).
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  // LOG_LEVEL wins; otherwise be quieter in prod, chattier in dev.
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: 'laundrix-api' },
  format: isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  // Stay silent during tests so suite output isn't polluted by expected errors.
  silent: process.env.NODE_ENV === 'test',
  // Never let a logging failure crash a request/serverless invocation.
  exitOnError: false,
});

// A writable stream so morgan's HTTP request lines flow through winston
// (logged at the `http` level) instead of straight to stdout.
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;

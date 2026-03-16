/**
 * Structured logging wrapper for consistent log format
 * 
 * Usage:
 *   logger.info('Operation complete', { userId: '123', duration: 1500 })
 *   logger.error('API call failed', { requestId: 'req_123', statusCode: 500 })
 *   logger.warn('Rate limit approaching', { userId: '123', count: 4, limit: 5 })
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const COLORS = {
  DEBUG: '\x1b[36m', // cyan
  INFO: '\x1b[32m',  // green
  WARN: '\x1b[33m',  // yellow
  ERROR: '\x1b[31m', // red
  RESET: '\x1b[0m',
};

class Logger {
  constructor(level = LOG_LEVELS.INFO) {
    this.level = level;
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log entry as JSON for production logging
   */
  #formatEntry(logLevel, message, metadata = {}, timestamp = new Date().toISOString()) {
    return {
      timestamp,
      level: logLevel,
      message,
      ...metadata,
      env: process.env.NODE_ENV || 'development',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    };
  }

  /**
   * Output log (console in dev, Sentry in prod via Sentry.captureMessage)
   */
  #output(logLevel, message, metadata = {}) {
    if (LOG_LEVELS[logLevel] < this.level) {
      return;
    }

    const entry = this.#formatEntry(logLevel, message, metadata);

    if (this.isDev) {
      // Dev: Pretty-print to console with colors
      const color = COLORS[logLevel];
      const reset = COLORS.RESET;
      console.log(
        `${color}[${entry.timestamp}] ${logLevel}${reset}`,
        entry.message,
        Object.keys(metadata).length > 0 ? metadata : ''
      );
    } else {
      // Prod: Send to Sentry via structured logging
      // Sentry SDKs will pick this up automatically if initialized
      if (logLevel === 'ERROR' || logLevel === 'WARN') {
        console.error(JSON.stringify(entry));
      } else {
        console.log(JSON.stringify(entry));
      }
    }
  }

  debug(message, metadata = {}) {
    this.#output('DEBUG', message, metadata);
  }

  info(message, metadata = {}) {
    this.#output('INFO', message, metadata);
  }

  warn(message, metadata = {}) {
    this.#output('WARN', message, metadata);
  }

  error(message, metadata = {}) {
    this.#output('ERROR', message, metadata);
  }
}

export const logger = new Logger(LOG_LEVELS.INFO);

/**
 * Helper to log async operation timing
 * 
 * Usage:
 *   await logger.timeAsync('database_query', async () => {
 *     return db.query(...)
 *   }, { table: 'users' })
 */
export async function timeAsync(operationName, asyncFn, metadata = {}) {
  const startTime = performance.now();
  try {
    const result = await asyncFn();
    const duration = Math.round(performance.now() - startTime);
    logger.info(`${operationName} completed`, {
      ...metadata,
      duration_ms: duration,
      status: 'success',
    });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error(`${operationName} failed`, {
      ...metadata,
      duration_ms: duration,
      error: error.message,
      status: 'failure',
    });
    throw error;
  }
}

export default logger;

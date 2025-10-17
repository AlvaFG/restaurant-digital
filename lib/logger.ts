/**
 * Application Logger
 * 
 * Sistema de logging estructurado para toda la aplicación.
 * Proporciona niveles de log, contexto y formateo consistente.
 * Integración opcional con Logtail para producción.
 * 
 * @module logger
 * @version 2.0.0
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to include timestamps */
  timestamps: boolean;
  /** Whether to pretty print in development */
  pretty: boolean;
  /** Module name for namespacing logs */
  moduleName?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamps: true,
  pretty: process.env.NODE_ENV !== 'production',
};

// ✅ Logtail integration (optional - only if installed)
let logtailClient: any = null;
try {
  if (process.env.LOGTAIL_SOURCE_TOKEN && typeof window === 'undefined') {
    // Only load on server-side if token is present
    const { Logtail } = require('@logtail/node');
    logtailClient = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  }
} catch (e) {
  // Logtail not installed - that's okay, will use console only
}

/**
 * Logger class
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a child logger with a module namespace
   */
  module(moduleName: string): Logger {
    return new Logger({
      ...this.config,
      moduleName: moduleName,
    });
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    if (this.config.pretty) {
      return this.formatPretty(entry);
    }
    return this.formatJSON(entry);
  }

  /**
   * Format log entry as pretty string for development
   */
  private formatPretty(entry: LogEntry): string {
    const timestamp = this.config.timestamps ? `[${entry.timestamp}]` : '';
    const moduleName = this.config.moduleName ? `[${this.config.moduleName}]` : '';
    const level = `[${entry.level.toUpperCase()}]`;
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? `\n${entry.error.stack || entry.error.message}` : '';

    return `${timestamp}${moduleName}${level} ${entry.message}${context}${error}`;
  }

  /**
   * Format log entry as JSON for production
   */
  private formatJSON(entry: LogEntry): string {
    const output: Record<string, unknown> = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
    };

    if (this.config.moduleName) {
      output.module = this.config.moduleName;
    }

    if (entry.context) {
      output.context = entry.context;
    }

    if (entry.error) {
      output.error = {
        message: entry.error.message,
        stack: entry.error.stack,
        name: entry.error.name,
      };
    }

    return JSON.stringify(output);
  }

  /**
   * Write log entry
   */
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // ✅ Console output (always in development, selective in production)
    if (process.env.NODE_ENV !== 'production' || entry.level === 'error') {
      const output = this.format(entry);
      switch (entry.level) {
        case 'debug':
          console.debug(output);
          break;
        case 'info':
          console.info(output);
          break;
        case 'warn':
          console.warn(output);
          break;
        case 'error':
          console.error(output);
          break;
      }
    }

    // ✅ Logtail output (only in production if configured)
    if (logtailClient && process.env.NODE_ENV === 'production') {
      const logData: Record<string, unknown> = {
        message: entry.message,
        level: entry.level,
        timestamp: entry.timestamp,
      };

      if (this.config.moduleName) {
        logData.module = this.config.moduleName;
      }

      if (entry.context) {
        Object.assign(logData, entry.context);
      }

      if (entry.error) {
        logData.error = {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        };
      }

      try {
        logtailClient[entry.level](logData);
      } catch (e) {
        // Fallback to console if Logtail fails
        console.error('[Logger] Failed to send to Logtail:', e);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.write({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.write({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.write({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.write({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    });
  }
}

/**
 * Default application logger
 */
export const logger = new Logger();

/**
 * Create a logger for a specific module
 */
export function createLogger(moduleName: string): Logger {
  return logger.module(moduleName);
}

/**
 * Flush logs to remote service (Logtail)
 * Call this before app shutdown to ensure all logs are sent
 */
export async function flushLogs(): Promise<void> {
  if (logtailClient && typeof logtailClient.flush === 'function') {
    try {
      await logtailClient.flush();
    } catch (e) {
      console.error('[Logger] Failed to flush logs:', e);
    }
  }
}

// ✅ Auto-flush on process exit (server-side only)
if (typeof process !== 'undefined' && logtailClient) {
  process.on('beforeExit', async () => {
    await flushLogs();
  });
}

/**
 * Export Logger class for custom instances
 */
export { Logger };

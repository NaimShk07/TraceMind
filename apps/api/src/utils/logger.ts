type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  info(message: string, meta?: Record<string, unknown>) {
    process.stdout.write(this.format('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    process.stdout.write(this.format('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>) {
    process.stderr.write(this.format('error', message, meta));
  }
}

export const logger = new Logger();
export default logger;

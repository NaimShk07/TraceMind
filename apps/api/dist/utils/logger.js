class Logger {
    format(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | meta: ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
    }
    info(message, meta) {
        process.stdout.write(this.format('info', message, meta));
    }
    warn(message, meta) {
        process.stdout.write(this.format('warn', message, meta));
    }
    error(message, meta) {
        process.stderr.write(this.format('error', message, meta));
    }
}
export const logger = new Logger();
export default logger;

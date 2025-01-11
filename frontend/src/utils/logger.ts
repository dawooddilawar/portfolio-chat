// src/utils/logger.ts

import { env } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private shouldLog(level: LogLevel): boolean {
        if (level === 'debug' && !env.ENABLE_DEBUG_LOGS) {
            return false;
        }
        return true;
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
    }

    debug(message: string, meta?: any): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }

    info(message: string, meta?: any): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, meta));
        }
    }

    warn(message: string, meta?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    error(message: string, error?: Error, meta?: any): void {
        if (this.shouldLog('error')) {
            console.error(
                this.formatMessage('error', message, {
                    ...meta,
                    errorMessage: error?.message,
                    stack: error?.stack,
                })
            );
        }
    }
}

export const logger = new Logger();
// src/shared/logger/app.logger.ts
import { Logger, LoggerService } from '@nestjs/common';

export class AppLogger implements LoggerService {
  private readonly logger: Logger;
  private context?: string;

  constructor(context?: string) {
    this.logger = new Logger();
    this.context = context;
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(`❌ ${message}`, trace, context || this.context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(`⚠️ ${message}`, context || this.context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(`🔍 ${message}`, context || this.context);
  }

  log(message: string, context?: string) {
    this.logger.log(`ℹ️ ${message}`, context || this.context);
  }

  logServiceCall(method: string, args?: any) {
    this.debug(`Calling ${method} with args: ${JSON.stringify(args)}`);
  }

  logNotification(type: string, details: any) {
    this.log(`Notification type ${type}: ${JSON.stringify(details)}`);
  }
}

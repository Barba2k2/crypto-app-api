import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly coinsService: CoinsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkForNotifications() {
    this.logger.log('Starting notification checks...');
    const users = await this.usersService.getActiveUsers();

    for (const user of users) {
      try {
        await this.checkUserAlerts(user);
      } catch (error) {
        this.logger.error(
          `Error checking alerts for user ${user.id}: ${error.message}`,
        );
      }
    }
  }

  private async checkUserAlerts(user: any) {
    // Implementar lógica de verificação de alertas
    // - Verificar mudanças significativas no portfólio
    // - Verificar alertas de preço
    // - Verificar moedas favoritas
  }
}

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceAlertsService } from './price-alerts.service';

@Injectable()
export class PriceAlertsScheduler {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPriceAlerts() {
    await this.priceAlertsService.checkPriceAlerts();
  }
}

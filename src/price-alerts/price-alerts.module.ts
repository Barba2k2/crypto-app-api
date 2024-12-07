import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlertsController } from './price-alerts.controller';
import { CoinsModule } from '../coins/coins.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PriceAlert } from 'src/entities/price-alert.entity';
import { PriceAlertsScheduler } from './price-alerts.scheduler';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceAlert]),
    CoinsModule,
    NotificationsModule,
    AuthModule,
  ],
  providers: [PriceAlertsService, PriceAlertsScheduler],
  controllers: [PriceAlertsController],
  exports: [PriceAlertsService],
})
export class PriceAlertsModule {}

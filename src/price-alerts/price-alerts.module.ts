import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlertsController } from './price-alerts.controller';
import { CoinsModule } from '../coins/coins.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PriceAlert } from '../entities/price-alert.entity';
import { PriceAlertsScheduler } from './price-alerts.scheduler';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceAlert]),
    CoinsModule,
    NotificationsModule,
    AuthModule,
    FirebaseModule,
    UsersModule,
  ],
  providers: [PriceAlertsService, PriceAlertsScheduler],
  controllers: [PriceAlertsController],
  exports: [PriceAlertsService],
})
export class PriceAlertsModule {}

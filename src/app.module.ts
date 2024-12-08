import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { FavoriteCoin } from './entities/favorite-coin.entity';
import { PriceAlert } from './entities/price-alert.entity';
import { CoinHolding } from './entities/coin-holding.entity';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './notifications/entities/notification.entity';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HttpModule } from '@nestjs/axios';
import { CoinsModule } from './coins/coins.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'crypto_portfolio'),
        entities: [
          User,
          Wallet,
          FavoriteCoin,
          PriceAlert,
          CoinHolding,
          Notification,
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CoinsModule,
    PriceAlertsModule,
    FirebaseModule,
    NotificationsModule,
    FavoritesModule,
  ],
})
export class AppModule {}

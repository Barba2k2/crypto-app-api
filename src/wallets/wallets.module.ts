import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet } from '../entities/wallet.entity';
import { CoinHolding } from '../entities/coin-holding.entity';
import { CoinsModule } from '../coins/coins.module';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';
import { CurrencyModule } from '../shared/modules/currency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, CoinHolding]),
    CoinsModule,
    AuthModule,
    FirebaseModule,
    UsersModule,
    CurrencyModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}

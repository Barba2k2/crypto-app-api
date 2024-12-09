import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet } from '../entities/wallet.entity';
import { CoinHolding } from '../entities/coin-holding.entity';
import { CoinsModule } from '../coins/coins.module';
import { UsersModule } from 'src/users/users.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, CoinHolding]),
    CoinsModule,
    AuthModule,
    FirebaseModule,
    UsersModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}

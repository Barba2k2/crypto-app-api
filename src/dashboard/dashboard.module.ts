import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WalletsModule } from '../wallets/wallets.module';
import { CoinsModule } from '../coins/coins.module';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    WalletsModule,
    CoinsModule,
    AuthModule,
    FirebaseModule,
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
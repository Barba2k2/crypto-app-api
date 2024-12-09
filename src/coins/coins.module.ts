import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';

@Module({
  imports: [HttpModule],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}

import { Module } from '@nestjs/common';
import { CurrencyService } from './services/currency.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class SharedModule {}

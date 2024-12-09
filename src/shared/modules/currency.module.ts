import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CurrencyService } from '../services/currency.service';

@Module({
  imports: [HttpModule], // Importa o HttpModule para poder usar o HttpService no CurrencyService
  providers: [CurrencyService],
  exports: [CurrencyService], // Exporta o serviço para que outros módulos possam usá-lo
})
export class CurrencyModule {}

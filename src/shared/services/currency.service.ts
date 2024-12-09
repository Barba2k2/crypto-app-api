import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppLogger } from '../logger/app.logger';

@Injectable()
export class CurrencyService {
  private readonly logger = new AppLogger(CurrencyService.name);
  private rateCache: Map<string, { rate: number; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hora

  constructor(private readonly httpService: HttpService) {}

  async convertCurrency(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    try {
      if (from === to) return amount;

      const rate = await this.getExchangeRate(from, to);
      return amount * rate;
    } catch (error) {
      this.logger.error(`Failed to convert currency: ${error.message}`);
      throw error;
    }
  }

  private async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}-${to}`;
    const cached = this.rateCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.rate;
    }

    // Usar uma API de câmbio (exemplo com ExchangeRate-API)
    const { data } = await firstValueFrom(
      this.httpService.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
      ),
    );

    const rate = data.rates[to];
    this.rateCache.set(cacheKey, { rate, timestamp: now });

    return rate;
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppLogger } from '../shared/logger/app.logger';

@Injectable()
export class CoinsService {
  private readonly logger = new AppLogger(CoinsService.name);
  private readonly apiUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<
    string,
    {
      data: {
        currentPrice: number;
        priceChanges: {
          '1h': number;
          '24h': number;
          '7d': number;
        };
      };
      timestamp: number;
    }
  > = new Map();
  private priceHistoryCache: Map<string, { data: any; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 1000;
  private readonly API_DELAY = 1100;

  private lastApiCall: number = 0;

  constructor(private readonly httpService: HttpService) {}

  private async delayIfNeeded() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.API_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.API_DELAY - timeSinceLastCall),
      );
    }
    this.lastApiCall = Date.now();
  }

  async getCoins(page = 1, perPage = 100) {
    try {
      const response = await this.httpService.axiosRef.get(
        `${this.apiUrl}/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: perPage,
            page: page,
            sparkline: false,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch coins: ${error.message}`);
    }
  }

  async getCoinById(id: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `${this.apiUrl}/coins/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch coin: ${error.message}`);
    }
  }

  async getCoinPrice(coinId: string): Promise<{
    currentPrice: number;
    priceChanges: {
      '1h': number;
      '24h': number;
      '7d': number;
    };
  }> {
    try {
      const cached = this.priceCache.get(coinId);
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids: coinId,
            price_change_percentage: '1h,24h,7d',
          },
        }),
      );

      const result = {
        currentPrice: data[0]?.current_price || 0,
        priceChanges: {
          '1h': data[0]?.price_change_percentage_1h_in_currency || 0,
          '24h': data[0]?.price_change_percentage_24h || 0,
          '7d': data[0]?.price_change_percentage_7d || 0,
        },
      };

      this.priceCache.set(coinId, {
        data: result,
        timestamp: now,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch coin price: ${error.message}`);
      throw error;
    }
  }

  async getCoinPriceHistory(coinId: string) {
    const cacheKey = `history-${coinId}`;
    const cached = this.priceHistoryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      await this.delayIfNeeded();

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: '30',
            interval: 'daily',
          },
        }),
      );

      const result = {
        currentPrice: data.prices[data.prices.length - 1][1],
        price24h: data.prices[data.prices.length - 2][1],
        price7d: data.prices[data.prices.length - 8][1],
        price30d: data.prices[0][1],
      };

      this.priceHistoryCache.set(cacheKey, {
        data: result,
        timestamp: now,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch price history: ${error.message}`);

      // Retornar dados do cache mesmo expirado se disponível
      if (cached) {
        return cached.data;
      }

      throw error;
    }
  }

  async getBatchPrices(coinIds: string[]): Promise<Record<string, any>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids: coinIds.join(','),
            price_change_percentage: '1h,24h,7d',
          },
        }),
      );

      return data.reduce((acc, coin) => {
        acc[coin.id] = {
          currentPrice: coin.current_price,
          priceChanges: {
            '1h': coin.price_change_percentage_1h_in_currency,
            '24h': coin.price_change_percentage_24h,
            '7d': coin.price_change_percentage_7d,
          },
        };
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`Failed to fetch batch prices: ${error.message}`);
      throw error;
    }
  }

  async getSimplePriceHistory(coinId: string, days: number): Promise<number> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/${coinId}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
          },
        }),
      );

      return data.market_data.current_price.usd || 0;
    } catch (error) {
      const cached = this.priceCache.get(coinId);
      if (cached) {
        return cached.data.currentPrice;
      }
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }
  }

  async getBatchPriceHistory(coinIds: string[]) {
    const results = {};
    for (const coinId of coinIds) {
      try {
        results[coinId] = await this.getCoinPriceHistory(coinId);
        // Pequeno delay entre chamadas para respeitar rate limit
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Failed to fetch history for ${coinId}: ${error.message}`,
        );
      }
    }
    return results;
  }
}

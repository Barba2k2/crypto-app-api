import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppLogger } from '../shared/logger/app.logger';

@Injectable()
export class CoinsService {
  private readonly logger = new AppLogger(CoinsService.name);
  private readonly apiUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<string, { price: number; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 1000;

  constructor(private readonly httpService: HttpService) {}

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

  async getCoinPrice(coinId: string): Promise<number> {
    try {
      const cached = this.priceCache.get(coinId);
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        return cached.price;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
          },
        }),
      );

      const price = data[coinId]?.usd || 0;
      this.priceCache.set(coinId, { price, timestamp: now });

      return price;
    } catch (error) {
      this.logger.error(`Failed to fetch coin price: ${error.message}`);
      throw error;
    }
  }

  async getCoinPriceHistory(coinId: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: '30',
            interval: 'daily',
          },
        }),
      );

      return {
        currentPrice: data.prices[data.prices.length - 1][1],
        price24h: data.prices[data.prices.length - 2][1],
        price7d: data.prices[data.prices.length - 8][1],
        price30d: data.prices[0][1],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch price history: ${error.message}`);
      throw error;
    }
  }

  async getBatchPrices(coinIds: string[]): Promise<Record<string, number>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids: coinIds.join(','),
            vs_currencies: 'usd',
          },
        }),
      );

      return Object.entries(data).reduce(
        (acc, [id, priceData]: [string, any]) => {
          acc[id] = priceData.usd;
          return acc;
        },
        {},
      );
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
        return cached.price;
      }
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }
  }
}

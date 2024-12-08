import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CoinsService {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3';
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000;

  constructor(private readonly httpService: HttpService) { }

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
      // Verificar cache
      const cached = this.priceCache.get(coinId);
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        return cached.price;
      }

      // Se não está em cache ou expirou, busca da API
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
          },
        })
      );

      const price = data[coinId]?.usd || 0;

      // Atualiza o cache
      this.priceCache.set(coinId, {
        price,
        timestamp: now,
      });

      return price;
    } catch (error) {
      // Retorna do cache mesmo expirado em caso de erro
      const cached = this.priceCache.get(coinId);
      if (cached) {
        return cached.price;
      }
      throw new Error(`Failed to fetch coin price: ${error.message}`);
    }
  }

  async getCoinPriceHistory(coinId: string, period: '24h' | '7d' | '30d') {
    try {
      const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: days,
            interval: period === '24h' ? 'hourly' : 'daily',
          },
        })
      );

      return {
        current: data.prices[data.prices.length - 1][1],
        history: data.prices,
      };
    } catch (error) {
      throw new Error(`Failed to fetch price history: ${error.message}`);
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
        })
      );

      const now = Date.now();
      const prices: Record<string, number> = {};

      for (const coinId of coinIds) {
        const price = data[coinId]?.usd || 0;
        prices[coinId] = price;

        // Atualiza o cache
        this.priceCache.set(coinId, {
          price,
          timestamp: now,
        });
      }

      return prices;
    } catch (error) {
      // Tenta retornar do cache
      const prices: Record<string, number> = {};
      for (const coinId of coinIds) {
        const cached = this.priceCache.get(coinId);
        if (cached) {
          prices[coinId] = cached.price;
        }
      }

      if (Object.keys(prices).length > 0) {
        return prices;
      }

      throw new Error(`Failed to fetch prices: ${error.message}`);
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
        })
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

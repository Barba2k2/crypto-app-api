import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoinsService {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

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
}

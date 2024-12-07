import { Controller, Get, Param, Query } from '@nestjs/common';
import { CoinsService } from './coins.service';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  getCoins(@Query('page') page: number, @Query('perPage') perPage: number) {
    return this.coinsService.getCoins(page, perPage);
  }

  @Get(':id')
  getCoin(@Param('id') id: string) {
    return this.coinsService.getCoinById(id);
  }
}

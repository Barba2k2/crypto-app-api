import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PriceAlertsService } from './price-alerts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { User } from 'src/entities/user.entity';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('price-alerts')
@UseGuards(AuthGuard)
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() createAlertDto: CreatePriceAlertDto,
  ) {
    return this.priceAlertsService.create(user, createAlertDto);
  }

  @Get()
  getUserAlerts(@CurrentUser() user: User) {
    return this.priceAlertsService.getUserAlerts(user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.priceAlertsService.delete(id, user);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  addFavorite(
    @CurrentUser() user: User,
    @Body() addFavoriteDto: AddFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(user, addFavoriteDto);
  }

  @Get()
  getFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getFavorites(user);
  }

  @Delete(':coinId')
  removeFavorite(@CurrentUser() user: User, @Param('coinId') coinId: string) {
    return this.favoritesService.removeFavorite(user, coinId);
  }

  @Put(':coinId/alerts')
  updateAlerts(
    @CurrentUser() user: User,
    @Param('coinId') coinId: string,
    @Body()
    alerts: { alertOnPriceIncrease?: number; alertOnPriceDecrease?: number },
  ) {
    return this.favoritesService.updateAlerts(user, coinId, alerts);
  }
}

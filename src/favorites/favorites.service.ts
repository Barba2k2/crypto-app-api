import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { CoinsService } from '../coins/coins.service';
import { FavoriteCoin } from 'src/entities/favorite-coin.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteCoin)
    private favoritesRepository: Repository<FavoriteCoin>,
    private coinsService: CoinsService,
  ) {}

  async addFavorite(user: User, addFavoriteDto: AddFavoriteDto) {
    // Verifica se a moeda já é favorita
    const existing = await this.favoritesRepository.findOne({
      where: {
        user: { id: user.id },
        coinId: addFavoriteDto.coinId,
      },
    });

    if (existing) {
      throw new ConflictException('Coin is already in favorites');
    }

    // Verifica se a moeda existe na CoinGecko
    await this.coinsService.getCoinPrice(addFavoriteDto.coinId);

    const favorite = this.favoritesRepository.create({
      ...addFavoriteDto,
      user,
    });

    return this.favoritesRepository.save(favorite);
  }

  async removeFavorite(user: User, coinId: string) {
    const result = await this.favoritesRepository.delete({
      user: { id: user.id },
      coinId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Favorite coin not found');
    }
  }

  async getFavorites(user: User) {
    const favorites = await this.favoritesRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    // Obter preços atuais
    const favoriteWithPrices = await Promise.all(
      favorites.map(async (favorite) => {
        const price = await this.coinsService.getCoinPrice(favorite.coinId);
        return {
          ...favorite,
          currentPrice: price,
        };
      }),
    );

    return favoriteWithPrices;
  }

  async updateAlerts(
    user: User,
    coinId: string,
    alerts: {
      alertOnPriceIncrease?: number;
      alertOnPriceDecrease?: number;
    },
  ) {
    const favorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: user.id },
        coinId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite coin not found');
    }

    Object.assign(favorite, alerts);
    return this.favoritesRepository.save(favorite);
  }
}

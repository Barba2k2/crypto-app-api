import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { CoinsService } from '../coins/coins.service';
import { PriceAlert } from 'src/entities/price-alert.entity';
import { User } from 'src/entities/user.entity';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';

@Injectable()
export class PriceAlertsService {
  constructor(
    @InjectRepository(PriceAlert)
    private priceAlertsRepository: Repository<PriceAlert>,
    private notificationsService: NotificationsService,
    private coinsService: CoinsService,
  ) {}

  async checkPriceAlerts() {
    const alerts = await this.priceAlertsRepository.find({
      where: { triggered: false },
      relations: ['user'],
    });

    for (const alert of alerts) {
      const currentPrice = await this.coinsService.getCoinPrice(alert.coinId);

      const shouldTrigger =
        (alert.type === 'ABOVE' && currentPrice >= alert.targetPrice) ||
        (alert.type === 'BELOW' && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        await this.notificationsService.sendPriceAlert(
          alert.user,
          alert.coinId,
          currentPrice,
          alert.targetPrice,
        );

        // Atualizar o status do alerta
        await this.priceAlertsRepository.update(
          { id: alert.id },
          { triggered: true },
        );
      }
    }
  }

  async create(
    user: User,
    createAlertDto: CreatePriceAlertDto,
  ): Promise<PriceAlert> {
    const alert = this.priceAlertsRepository.create({
      ...createAlertDto,
      user,
      triggered: false,
    });
    return this.priceAlertsRepository.save(alert);
  }

  async getUserAlerts(user: User): Promise<PriceAlert[]> {
    return this.priceAlertsRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string, user: User) {
    return this.priceAlertsRepository.delete({
      id,
      user: { id: user.id },
    });
  }
}

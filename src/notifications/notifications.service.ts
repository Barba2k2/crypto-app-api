import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { Notification } from './entities/notification.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendPriceAlert(
    user: User,
    coinId: string,
    price: number,
    targetPrice: number,
  ) {
    const title = 'Price Alert';
    const body = `${coinId.toUpperCase()} has reached ${price} (Target: ${targetPrice})`;

    // Salvar notificação no banco
    const notification = this.notificationsRepository.create({
      title,
      body,
      type: 'PRICE_ALERT',
      user,
    });
    await this.notificationsRepository.save(notification);

    // Enviar push notification se o usuário tiver FCM token
    if (user.fcmToken) {
      await this.firebaseService.sendNotification(user.fcmToken, {
        title,
        body,
      });
    }

    return notification;
  }

  async getUserNotifications(user: User) {
    return this.notificationsRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, user: User) {
    await this.notificationsRepository.update(
      { id: notificationId, user: { id: user.id } },
      { read: true },
    );
  }
}

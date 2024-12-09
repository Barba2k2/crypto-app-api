import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';
import { Notification } from './entities/notification.entity';
import { User } from '../entities/user.entity';
import { AppLogger } from '../shared/logger/app.logger';

@Injectable()
export class NotificationsService {
  private readonly logger = new AppLogger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendPriceAlert(
    user: User,
    coinId: string,
    currentPrice: number,
    targetPrice: number,
    priceChange?: number,
  ) {
    this.logger.logServiceCall('sendPriceAlert', {
      user: user.id,
      coinId,
      currentPrice,
      targetPrice,
    });

    const title = 'Price Alert';
    const body = priceChange
      ? `${coinId.toUpperCase()} has changed by ${priceChange}% in the last 24h`
      : `${coinId.toUpperCase()} has reached ${currentPrice} (Target: ${targetPrice})`;

    try {
      const notification = await this.createNotification(user, {
        title,
        body,
        type: 'PRICE_ALERT',
        metadata: {
          coinId,
          currentPrice,
          targetPrice,
          priceChange,
        },
      });

      this.logger.logNotification('PRICE_ALERT', {
        userId: user.id,
        coinId,
        currentPrice,
        targetPrice,
      });

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to send price alert: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendPortfolioAlert(user: User, change: number) {
    this.logger.logServiceCall('sendPortfolioAlert', { user: user.id, change });

    try {
      const direction = change > 0 ? 'increased' : 'decreased';
      const notification = await this.createNotification(user, {
        title: 'Portfolio Update',
        body: `Your portfolio has ${direction} by ${Math.abs(change)}%`,
        type: 'PORTFOLIO_CHANGE',
        metadata: { portfolioChange: change },
      });

      this.logger.logNotification('PORTFOLIO_CHANGE', {
        userId: user.id,
        change,
      });

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to send portfolio alert: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async createNotification(user: User, data: any) {
    this.logger.debug(`Creating notification for user: ${user.id}`);

    try {
      const notification = this.notificationsRepository.create({
        ...data,
        user,
      });
      await this.notificationsRepository.save(notification);

      if (user.fcmToken) {
        try {
          await this.firebaseService.sendNotification(user.fcmToken, {
            title: data.title,
            body: data.body,
          });
          this.logger.log(`Push notification sent to user: ${user.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send push notification: ${error.message}`,
          );
        }
      }

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserNotifications(user: User) {
    this.logger.logServiceCall('getUserNotifications', { userId: user.id });

    try {
      return await this.notificationsRepository.find({
        where: { user: { id: user.id } },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get user notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async markAsRead(notificationId: string, user: User) {
    this.logger.logServiceCall('markAsRead', {
      notificationId,
      userId: user.id,
    });

    try {
      await this.notificationsRepository.update(
        { id: notificationId, user: { id: user.id } },
        { read: true },
      );
      this.logger.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async markAllAsRead(user: User) {
    this.logger.logServiceCall('markAllAsRead', { userId: user.id });

    try {
      await this.notificationsRepository.update(
        { user: { id: user.id }, read: false },
        { read: true },
      );
      this.logger.log(`All notifications marked as read for user: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUnreadCount(user: User): Promise<number> {
    return this.notificationsRepository.count({
      where: { user: { id: user.id }, read: false },
    });
  }

  async getUnreadNotifications(user: User) {
    this.logger.logServiceCall('getUnreadNotifications', { userId: user.id });

    try {
      const [notifications, count] =
        await this.notificationsRepository.findAndCount({
          where: {
            user: { id: user.id },
            read: false,
          },
          order: { createdAt: 'DESC' },
        });

      return {
        notifications,
        count,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get unread notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

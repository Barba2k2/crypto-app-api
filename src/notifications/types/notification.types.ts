export type NotificationType =
  | 'PRICE_ALERT'
  | 'PORTFOLIO_CHANGE'
  | 'FAVORITE_COIN_CHANGE'
  | 'SYSTEM';

export interface NotificationData {
  title: string;
  body: string;
  type: NotificationType;
  metadata?: {
    coinId?: string;
    priceChange?: number;
    portfolioChange?: number;
    currentPrice?: number;
    targetPrice?: number;
  };
}

import { Injectable } from '@nestjs/common';
import { WalletsService } from '../wallets/wallets.service';
import { CoinsService } from '../coins/coins.service';
import { User } from '../entities/user.entity';
import { AppLogger } from 'src/shared/logger/app.logger';

@Injectable()
export class DashboardService {
  private readonly logger = new AppLogger(DashboardService.name);

  constructor(
    private walletsService: WalletsService,
    private coinsService: CoinsService,
  ) {}

  async getPortfolioPerformance(user: User) {
    this.logger.logServiceCall('getPortfolioPerformance', { userId: user.id });

    try {
      const wallets = await this.walletsService.getWallets(user);
      const performance = {
        current: 0,
        '24h': { value: 0, change: 0 },
        '7d': { value: 0, change: 0 },
        '30d': { value: 0, change: 0 },
      };

      for (const wallet of wallets) {
        for (const holding of wallet.holdings) {
          const priceData = await this.coinsService.getCoinPriceHistory(
            holding.coinId,
          );

          // Valor atual
          performance.current += holding.quantity * priceData.currentPrice;

          // 24h
          performance['24h'].value += holding.quantity * priceData.price24h;

          // 7d
          performance['7d'].value += holding.quantity * priceData.price7d;

          // 30d
          performance['30d'].value += holding.quantity * priceData.price30d;
        }
      }

      // Calcular mudanças percentuais
      performance['24h'].change = this.calculatePercentageChange(
        performance.current,
        performance['24h'].value,
      );

      performance['7d'].change = this.calculatePercentageChange(
        performance.current,
        performance['7d'].value,
      );

      performance['30d'].change = this.calculatePercentageChange(
        performance.current,
        performance['30d'].value,
      );

      return performance;
    } catch (error) {
      this.logger.error(
        `Failed to get portfolio performance: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private async calculateWalletValue(wallet: any) {
    const coinIds = wallet.holdings.map((h) => h.coinId);
    const prices = await this.coinsService.getBatchPrices(coinIds);

    return wallet.holdings.reduce((total, holding) => {
      return total + holding.quantity * (prices[holding.coinId] || 0);
    }, 0);
  }

  async getPerformanceHistory(user: User) {
    const wallets = await this.walletsService.getWallets(user);
    let totalValue = 0;

    // Calcular valor total atual
    for (const wallet of wallets) {
      const walletValue = await this.calculateWalletValue(wallet);
      totalValue += walletValue;
    }

    // Retornar uma visão simplificada
    return {
      currentValue: totalValue,
      holdings: await Promise.all(
        wallets.flatMap((wallet) =>
          wallet.holdings.map(async (holding) => ({
            coinId: holding.coinId,
            quantity: holding.quantity,
            currentValue:
              holding.quantity *
              (await this.coinsService.getCoinPrice(holding.coinId)),
            purchaseValue: holding.quantity * holding.purchasePrice,
            wallet: wallet.name,
          })),
        ),
      ),
    };
  }

  async getPortfolioOverview(user: User) {
    this.logger.logServiceCall('getPortfolioOverview', { userId: user.id });

    try {
      const wallets = await this.walletsService.getWallets(user);

      const walletsWithDetails = await Promise.all(
        wallets.map(async (wallet) => {
          const holdingsWithValues = await Promise.all(
            wallet.holdings.map(async (holding) => {
              const currentPrice = await this.coinsService.getCoinPrice(
                holding.coinId,
              );
              const totalInvested = holding.quantity * holding.purchasePrice;
              const currentTotal = holding.quantity * currentPrice;

              return {
                coinId: holding.coinId,
                quantity: holding.quantity,
                purchasePrice: holding.purchasePrice,
                currentPrice,
                totalInvested,
                currentTotal,
                profitLoss: currentTotal - totalInvested,
                profitLossPercentage:
                  ((currentTotal - totalInvested) / totalInvested) * 100,
              };
            }),
          );

          const walletTotal = holdingsWithValues.reduce(
            (sum, h) => sum + h.currentTotal,
            0,
          );
          const walletInvested = holdingsWithValues.reduce(
            (sum, h) => sum + h.totalInvested,
            0,
          );

          return {
            id: wallet.id,
            name: wallet.name,
            icon: wallet.icon,
            iconColor: wallet.iconColor,
            holdings: holdingsWithValues,
            totalValue: walletTotal,
            totalInvested: walletInvested,
            profitLoss: walletTotal - walletInvested,
            profitLossPercentage:
              ((walletTotal - walletInvested) / walletInvested) * 100,
          };
        }),
      );

      // Calcular totais do portfólio
      const portfolioTotal = walletsWithDetails.reduce(
        (sum, w) => sum + w.totalValue,
        0,
      );
      const portfolioInvested = walletsWithDetails.reduce(
        (sum, w) => sum + w.totalInvested,
        0,
      );

      return {
        wallets: walletsWithDetails,
        totalValue: portfolioTotal,
        totalInvested: portfolioInvested,
        profitLoss: portfolioTotal - portfolioInvested,
        profitLossPercentage:
          ((portfolioTotal - portfolioInvested) / portfolioInvested) * 100,
        bestPerforming: this.getBestPerforming(walletsWithDetails),
        worstPerforming: this.getWorstPerforming(walletsWithDetails),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get portfolio overview: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getBestPerforming(wallets: any[]) {
    const allHoldings = wallets.flatMap((w) => w.holdings);
    return allHoldings
      .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
      .slice(0, 3);
  }

  private getWorstPerforming(wallets: any[]) {
    const allHoldings = wallets.flatMap((w) => w.holdings);
    return allHoldings
      .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
      .slice(0, 3);
  }
}

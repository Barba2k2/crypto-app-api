import { Injectable } from '@nestjs/common';
import { WalletsService } from '../wallets/wallets.service';
import { CoinsService } from '../coins/coins.service';
import { User } from '../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    private walletsService: WalletsService,
    private coinsService: CoinsService,
  ) { }

  async getPortfolioOverview(user: User) {
    const wallets = await this.walletsService.getWallets(user);

    let totalValue = 0;
    let totalInvestment = 0;
    let holdings = [];

    for (const wallet of wallets) {
      const walletValue = await this.calculateWalletValue(wallet);
      totalValue += walletValue;

      for (const holding of wallet.holdings) {
        const currentPrice = await this.coinsService.getCoinPrice(holding.coinId);
        const currentValue = holding.quantity * currentPrice;
        const investmentValue = holding.quantity * holding.purchasePrice;

        totalInvestment += investmentValue;

        holdings.push({
          coinId: holding.coinId,
          wallet: wallet.name,
          quantity: holding.quantity,
          purchasePrice: holding.purchasePrice,
          currentPrice: currentPrice,
          currentValue,
          investmentValue,
          profit: currentValue - investmentValue,
          profitPercentage: ((currentValue - investmentValue) / investmentValue) * 100,
        });
      }
    }

    holdings.sort((a, b) => b.profitPercentage - a.profitPercentage);

    return {
      totalValue,
      totalInvestment,
      totalProfit: totalValue - totalInvestment,
      totalProfitPercentage: ((totalValue - totalInvestment) / totalInvestment) * 100,
      bestPerforming: holdings.slice(0, 3),
      worstPerforming: holdings.slice(-3).reverse(),
      wallets: await Promise.all(wallets.map(async wallet => ({
        name: wallet.name,
        value: await this.calculateWalletValue(wallet),
        icon: wallet.icon,
        iconColor: wallet.iconColor,
      }))),
    };
  }

  private async calculateWalletValue(wallet: any) {
    const coinIds = wallet.holdings.map(h => h.coinId);
    const prices = await this.coinsService.getBatchPrices(coinIds);

    return wallet.holdings.reduce((total, holding) => {
      return total + (holding.quantity * (prices[holding.coinId] || 0));
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
        wallets.flatMap(wallet =>
          wallet.holdings.map(async holding => ({
            coinId: holding.coinId,
            quantity: holding.quantity,
            currentValue: holding.quantity * await this.coinsService.getCoinPrice(holding.coinId),
            purchaseValue: holding.quantity * holding.purchasePrice,
            wallet: wallet.name,
          }))
        )
      ),
    };
  }
}
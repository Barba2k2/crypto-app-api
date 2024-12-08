import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { CoinHolding } from '../entities/coin-holding.entity';
import { User } from '../entities/user.entity';
import { CoinsService } from '../coins/coins.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddCoinDto } from './dto/add-coin.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(CoinHolding)
    private holdingsRepository: Repository<CoinHolding>,
    private coinsService: CoinsService,
  ) {}

  async createWallet(user: User, createWalletDto: CreateWalletDto) {
    const wallet = this.walletsRepository.create({
      ...createWalletDto,
      user,
    });
    return this.walletsRepository.save(wallet);
  }

  async getWallets(user: User) {
    const wallets = await this.walletsRepository.find({
      where: { user: { id: user.id } },
      relations: ['holdings'],
    });

    const walletsWithTotals = await Promise.all(
      wallets.map(async (wallet) => {
        const totalValue = await this.calculateWalletValue(wallet);
        return {
          ...wallet,
          totalValue,
        };
      }),
    );

    return walletsWithTotals;
  }

  async getWallet(user: User, walletId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, user: { id: user.id } },
      relations: ['holdings'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const holdings = await Promise.all(
      wallet.holdings.map(async (holding) => {
        const currentPrice = await this.coinsService.getCoinPrice(holding.coinId);
        const value = holding.quantity * currentPrice;
        const purchaseValue = holding.quantity * holding.purchasePrice;
        const profit = value - purchaseValue;
        const profitPercentage = (profit / purchaseValue) * 100;

        return {
          ...holding,
          currentPrice,
          value,
          profit,
          profitPercentage,
        };
      }),
    );

    return {
      ...wallet,
      holdings,
      totalValue: holdings.reduce((acc, holding) => acc + holding.value, 0),
    };
  }

  async addCoin(user: User, walletId: string, addCoinDto: AddCoinDto) {
    const wallet = await this.getWalletById(user, walletId);

    const holding = this.holdingsRepository.create({
      ...addCoinDto,
      wallet,
    });

    return this.holdingsRepository.save(holding);
  }

  async removeCoin(user: User, walletId: string, holdingId: string) {
    const wallet = await this.getWalletById(user, walletId);
    await this.holdingsRepository.delete({
      id: holdingId,
      wallet: { id: wallet.id },
    });
  }

  private async getWalletById(user: User, walletId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, user: { id: user.id } },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private async calculateWalletValue(wallet: Wallet): Promise<number> {
    let total = 0;
    for (const holding of wallet.holdings) {
      const currentPrice = await this.coinsService.getCoinPrice(holding.coinId);
      total += holding.quantity * currentPrice;
    }
    return total;
  }
}
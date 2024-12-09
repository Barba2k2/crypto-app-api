import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { CoinHolding } from '../entities/coin-holding.entity';
import { User } from '../entities/user.entity';
import { CoinsService } from '../coins/coins.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddCoinDto } from './dto/add-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CurrencyService } from 'src/shared/services/currency.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(CoinHolding)
    private readonly holdingsRepository: Repository<CoinHolding>,
    private readonly coinsService: CoinsService,
    private readonly currencyService: CurrencyService,
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

    const walletsWithDetails = await Promise.all(
      wallets.map(async (wallet) => {
        const holdingsWithValues = await Promise.all(
          wallet.holdings.map(async (holding) => {
            const priceData = await this.coinsService.getCoinPrice(
              holding.coinId,
            );
            const totalInvested = holding.quantity * holding.purchasePrice;
            const currentTotal = holding.quantity * priceData.currentPrice;

            return {
              ...holding,
              coinId: holding.coinId,
              quantity: holding.quantity,
              purchasePrice: holding.purchasePrice,
              currentPrice: priceData.currentPrice,
              priceChanges: priceData.priceChanges,
              totalInvested,
              currentTotal,
              profitLoss: currentTotal - totalInvested,
              profitLossPercentage:
                ((currentTotal - totalInvested) / totalInvested) * 100,
            };
          }),
        );

        return {
          ...wallet,
          holdings: holdingsWithValues.map((holding) => ({
            ...holding,
            allocation:
              (holding.currentTotal /
                holdingsWithValues.reduce(
                  (sum, h) => sum + h.currentTotal,
                  0,
                )) *
              100,
          })),
          totalValue: holdingsWithValues.reduce(
            (sum, h) => sum + h.currentTotal,
            0,
          ),
          totalInvested: holdingsWithValues.reduce(
            (sum, h) => sum + h.totalInvested,
            0,
          ),
          priceChanges: {
            '1h': holdingsWithValues.reduce(
              (sum, h) =>
                sum +
                h.priceChanges['1h'] *
                  (h.currentTotal /
                    holdingsWithValues.reduce(
                      (s, ho) => s + ho.currentTotal,
                      0,
                    )),
              0,
            ),
            '24h': holdingsWithValues.reduce(
              (sum, h) =>
                sum +
                h.priceChanges['24h'] *
                  (h.currentTotal /
                    holdingsWithValues.reduce(
                      (s, ho) => s + ho.currentTotal,
                      0,
                    )),
              0,
            ),
            '7d': holdingsWithValues.reduce(
              (sum, h) =>
                sum +
                h.priceChanges['7d'] *
                  (h.currentTotal /
                    holdingsWithValues.reduce(
                      (s, ho) => s + ho.currentTotal,
                      0,
                    )),
              0,
            ),
          },
        };
      }),
    );

    return walletsWithDetails;
  }

  async getWallet(user: User, walletId: string, currency: string = 'USD') {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, user: { id: user.id } },
      relations: ['holdings'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const holdingsWithDetails = await Promise.all(
      wallet.holdings.map(async (holding) => {
        const priceData = await this.coinsService.getCoinPrice(holding.coinId);

        const purchasePrice = await this.currencyService.convertCurrency(
          holding.purchasePriceUSD,
          'USD',
          currency,
        );

        const currentPriceConverted =
          await this.currencyService.convertCurrency(
            priceData.currentPrice, // Aqui mudou
            'USD',
            currency,
          );

        // Cálculos usando os valores convertidos
        const totalInvested = holding.quantity * purchasePrice;
        const currentTotal = holding.quantity * currentPriceConverted;

        return {
          ...holding,
          purchasePrice,
          currentPrice: currentPriceConverted,
          priceChanges: priceData.priceChanges,
          totalInvested,
          currentTotal,
          profitLoss: currentTotal - totalInvested,
          profitLossPercentage:
            ((currentTotal - totalInvested) / totalInvested) * 100,
          currency,
        };
      }),
    );

    const walletTotal = holdingsWithDetails.reduce(
      (sum, h) => sum + h.currentTotal,
      0,
    );
    const walletInvested = holdingsWithDetails.reduce(
      (sum, h) => sum + h.totalInvested,
      0,
    );

    return {
      ...wallet,
      holdings: holdingsWithDetails,
      totalValue: walletTotal,
      totalInvested: walletInvested,
      profitLoss: walletTotal - walletInvested,
      profitLossPercentage:
        ((walletTotal - walletInvested) / walletInvested) * 100,
      currency,
    };
  }

  async addCoin(user: User, walletId: string, addCoinDto: AddCoinDto) {
    const wallet = await this.getWalletById(user, walletId);

    // Converter o preço de compra para USD para armazenamento
    const purchasePriceUSD = await this.currencyService.convertCurrency(
      addCoinDto.purchasePrice,
      addCoinDto.currency,
      'USD',
    );

    const holding = this.holdingsRepository.create({
      ...addCoinDto,
      purchasePriceUSD,
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

  async updateCoin(
    user: User,
    walletId: string,
    holdingId: string,
    updateCoinDto: UpdateCoinDto,
  ) {
    const wallet = await this.getWalletById(user, walletId);
    const holding = await this.holdingsRepository.findOne({
      where: {
        id: holdingId,
        wallet: { id: wallet.id },
      },
    });

    if (!holding) {
      throw new NotFoundException('Coin holding not found');
    }

    Object.assign(holding, updateCoinDto);
    return this.holdingsRepository.save(holding);
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
}

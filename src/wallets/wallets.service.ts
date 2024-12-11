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
import Moralis from 'moralis';
import { WalletWithDetails } from 'src/types/wallet.types';
import { chainMapping } from 'src/types/chain.types';

interface FormattedWalletBalance {
  nativeBalance: {
    balance: string;
    symbol: string;
  };
  tokens: {
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
  }[];
}

interface PriceCalculation {
  totalInvested: number;
  currentTotal: number;
  profitLoss: number;
  profitLossPercentage: number;
}

interface HoldingWithDetails extends CoinHolding {
  currentPrice: number;
  priceChanges: Record<string, number>;
  totalInvested: number;
  currentTotal: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation?: number;
  currency: string;
}

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

  private calculateFinancials(
    total: number,
    invested: number,
  ): PriceCalculation {
    const profitLoss = total - invested;
    return {
      totalInvested: invested,
      currentTotal: total,
      profitLoss,
      profitLossPercentage: invested > 0 ? (profitLoss / invested) * 100 : 0,
    };
  }

  private calculateAllocation(amount: number, total: number): number {
    return total > 0 ? (amount / total) * 100 : 0;
  }

  private calculateWeightedPriceChanges(
    holdings: HoldingWithDetails[],
  ): Record<string, number> {
    const totalValue = holdings.reduce((sum, h) => sum + h.currentTotal, 0);
    const periods = ['1h', '24h', '7d'];

    return periods.reduce((changes, period) => {
      changes[period] = holdings.reduce(
        (sum, holding) =>
          sum +
          holding.priceChanges[period] *
            this.calculateAllocation(holding.currentTotal, totalValue),
        0,
      );
      return changes;
    }, {});
  }

  private async getWalletBalances(
    address: string,
    chain: string,
  ): Promise<FormattedWalletBalance> {
    try {
      const chainId = chainMapping[chain.toLowerCase()];
      if (!chainId) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const [nativeBalance, tokenBalances] = await Promise.all([
        Moralis.EvmApi.balance.getNativeBalance({
          address,
          chain: chainId,
        }),
        Moralis.EvmApi.token
          .getWalletTokenBalances({
            address,
            chain: chainId,
          })
          .catch((error) => {
            console.warn(`Error fetching token balances: ${error.message}`);
            return { result: [] };
          }),
      ]);

      // Log detalhado dos tokens
      tokenBalances.result.forEach((token, index) => {
        console.log(`Token ${index}:`, {
          raw_balance: token.amount,
          decimals: token.token.decimals,
          symbol: token.token.symbol,
          name: token.token.name,
        });
      });

      return {
        nativeBalance: {
          balance: nativeBalance.result.balance.toString(),
          symbol: chain === 'eth' ? 'ETH' : chain.toUpperCase(),
        },
        tokens: tokenBalances.result.map((token) => {
          // Convertendo o balance considerando os decimais
          const balance = token.amount?.toString() || '0';
          const decimals = token.token.decimals || 18;

          // Se o balance for 0, log para debug
          if (balance === '0') {
            console.log(`Zero balance found for token:`, {
              symbol: token.token.symbol,
              raw_balance: token.amount,
              decimals: decimals,
            });
          }

          return {
            address: token.token.contractAddress,
            symbol: token.token.symbol || 'Unknown',
            name: token.token.name || 'Unknown',
            balance: balance,
            decimals: decimals,
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      throw error;
    }
  }

  private async getWalletTransactions(address: string, chain: string) {
    try {
      const chainId = chainMapping[chain.toLowerCase()];
      if (!chainId) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const transactions =
        await Moralis.EvmApi.transaction.getWalletTransactions({
          address,
          chain: chainId,
          limit: 100,
        });

      return transactions.result.map((tx) => ({
        hash: tx.hash,
        from: tx.from.lowercase,
        to: tx.to?.lowercase,
        value: tx.value.toString(),
        gas: tx.gas.toString(),
        gasPrice: tx.gasPrice.toString(),
        timestamp: tx.blockTimestamp.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  private async getWalletBlockchainData(address: string, chain: string) {
    const [balances, transactions] = await Promise.all([
      this.getWalletBalances(address, chain),
      this.getWalletTransactions(address, chain),
    ]);
    return { balances, transactions };
  }

  private async processHoldings(
    holdings: CoinHolding[],
    currency: string,
  ): Promise<HoldingWithDetails[]> {
    const processedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const priceData = await this.coinsService.getCoinPrice(holding.coinId);
        const [purchasePrice, currentPrice] = await Promise.all([
          this.currencyService.convertCurrency(
            holding.purchasePriceUSD,
            'USD',
            currency,
          ),
          this.currencyService.convertCurrency(
            priceData.currentPrice,
            'USD',
            currency,
          ),
        ]);

        const financials = this.calculateFinancials(
          holding.quantity * currentPrice,
          holding.quantity * purchasePrice,
        );

        return {
          ...holding,
          ...financials,
          purchasePrice,
          currentPrice,
          priceChanges: priceData.priceChanges,
          currency,
        };
      }),
    );

    const totalValue = processedHoldings.reduce(
      (sum, h) => sum + h.currentTotal,
      0,
    );

    return processedHoldings.map((holding) => ({
      ...holding,
      allocation: this.calculateAllocation(holding.currentTotal, totalValue),
    }));
  }

  async createWallet(
    user: User,
    createWalletDto: CreateWalletDto,
  ): Promise<WalletWithDetails> {
    try {
      let wallet: Wallet;

      if (createWalletDto.address) {
        const blockchainData = await this.getWalletBlockchainData(
          createWalletDto.address,
          createWalletDto.chain,
        );

        wallet = await this.walletsRepository.save(
          this.walletsRepository.create({
            ...createWalletDto,
            user,
            balanceData: blockchainData,
          }),
        );
      } else {
        wallet = await this.walletsRepository.save(
          this.walletsRepository.create({
            ...createWalletDto,
            user,
          }),
        );
      }

      const holdings = await this.processHoldings(wallet.holdings || [], 'USD');
      const financials = this.calculateFinancials(
        holdings.reduce((sum, h) => sum + h.currentTotal, 0),
        holdings.reduce((sum, h) => sum + h.totalInvested, 0),
      );

      const response: WalletWithDetails = {
        ...wallet,
        holdings,
        currentTotal: financials.currentTotal,
        totalInvested: financials.totalInvested,
        profitLoss: financials.profitLoss,
        profitLossPercentage: financials.profitLossPercentage,
        priceChanges: this.calculateWeightedPriceChanges(holdings),
        currency: 'USD',
      };

      if (wallet.address && wallet.chain) {
        const blockchainData = await this.getWalletBlockchainData(
          wallet.address,
          wallet.chain,
        );
        return {
          ...response,
          ...blockchainData,
        };
      }

      return response;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getWallets(user: User): Promise<WalletWithDetails[]> {
    const wallets = await this.walletsRepository.find({
      where: { user: { id: user.id } },
      relations: ['holdings'],
    });

    const walletsWithDetails = await Promise.all(
      wallets.map(async (wallet) => {
        const holdings = await this.processHoldings(wallet.holdings, 'USD');
        const financials = this.calculateFinancials(
          holdings.reduce((sum, h) => sum + h.currentTotal, 0),
          holdings.reduce((sum, h) => sum + h.totalInvested, 0),
        );

        return {
          ...wallet,
          ...financials,
          totalValue: financials.currentTotal,
          holdings,
          priceChanges: this.calculateWeightedPriceChanges(holdings),
        };
      }),
    );

    return walletsWithDetails;
  }

  async getWallet(
    user: User,
    walletId: string,
    currency: string = 'USD',
  ): Promise<WalletWithDetails> {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, user: { id: user.id } },
      relations: ['holdings'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const holdings = await this.processHoldings(wallet.holdings, currency);
    const financials = this.calculateFinancials(
      holdings.reduce((sum, h) => sum + h.currentTotal, 0),
      holdings.reduce((sum, h) => sum + h.totalInvested, 0),
    );

    const response = {
      ...wallet,
      ...financials,
      totalValue: financials.currentTotal,
      holdings,
      priceChanges: this.calculateWeightedPriceChanges(holdings),
      currency,
    };

    if (wallet.address) {
      const blockchainData = await this.getWalletBlockchainData(
        wallet.address,
        wallet.chain,
      );
      return { ...response, ...blockchainData };
    }

    return response;
  }

  async addCoin(user: User, walletId: string, addCoinDto: AddCoinDto) {
    const wallet = await this.getWalletById(user, walletId);

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

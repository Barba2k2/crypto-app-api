import { CoinHolding } from '../entities/coin-holding.entity';
import { Wallet } from '../entities/wallet.entity';

export interface HoldingWithDetails extends CoinHolding {
  currentPrice: number;
  priceChanges: Record<string, number>;
  totalInvested: number;
  currentTotal: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation?: number;
  currency: string;
}

export interface WalletWithDetails extends Wallet {
  holdings: HoldingWithDetails[];
  currentTotal: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
  priceChanges: Record<string, number>;
  currency?: string;
  balances?: FormattedWalletBalance;
  transactions?: WalletTransaction[];
}

export interface FormattedWalletBalance {
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

export interface WalletTransaction {
  hash: string;
  from: string;
  to?: string;
  value: string;
  gas: string;
  gasPrice: string;
  timestamp: string;
}

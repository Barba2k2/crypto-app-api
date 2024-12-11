import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddCoinDto } from './dto/add-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { WalletWithDetails } from '../types/wallet.types';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  createWallet(
    @CurrentUser() user: User,
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<WalletWithDetails> {
    return this.walletsService.createWallet(user, createWalletDto);
  }

  @Get()
  getWallets(@CurrentUser() user: User): Promise<WalletWithDetails[]> {
    return this.walletsService.getWallets(user);
  }

  @Get(':id')
  getWallet(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('currency') currency: string = 'USD',
  ): Promise<WalletWithDetails> {
    return this.walletsService.getWallet(user, id, currency);
  }

  @Post(':id/coins')
  addCoin(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() addCoinDto: AddCoinDto,
  ) {
    return this.walletsService.addCoin(user, id, addCoinDto);
  }

  @Delete(':walletId/coins/:holdingId')
  removeCoin(
    @CurrentUser() user: User,
    @Param('walletId') walletId: string,
    @Param('holdingId') holdingId: string,
  ): Promise<void> {
    return this.walletsService.removeCoin(user, walletId, holdingId);
  }

  @Put(':walletId/coins/:holdingId')
  updateCoin(
    @CurrentUser() user: User,
    @Param('walletId') walletId: string,
    @Param('holdingId') holdingId: string,
    @Body() updateCoinDto: UpdateCoinDto,
  ) {
    return this.walletsService.updateCoin(
      user,
      walletId,
      holdingId,
      updateCoinDto,
    );
  }
}

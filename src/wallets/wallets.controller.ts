import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddCoinDto } from './dto/add-coin.dto';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  createWallet(@CurrentUser() user: User, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.createWallet(user, createWalletDto);
  }

  @Get()
  getWallets(@CurrentUser() user: User) {
    return this.walletsService.getWallets(user);
  }

  @Get(':id')
  getWallet(@CurrentUser() user: User, @Param('id') id: string) {
    return this.walletsService.getWallet(user, id);
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
  ) {
    return this.walletsService.removeCoin(user, walletId, holdingId);
  }
}
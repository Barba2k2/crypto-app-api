import { IsString, IsNumber, IsDateString, IsIn } from 'class-validator';

export class AddCoinDto {
  @IsString()
  coinId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  purchasePrice: number;

  @IsString()
  @IsIn(['USD', 'EUR', 'BRL'])
  currency: string;

  @IsDateString()
  purchaseDate: string;
}

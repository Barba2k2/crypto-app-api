import { IsString, IsNumber, IsDateString } from 'class-validator';

export class AddCoinDto {
  @IsString()
  coinId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  purchasePrice: number;

  @IsDateString()
  purchaseDate: string;
}
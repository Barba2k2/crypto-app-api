import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class UpdateCoinDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}
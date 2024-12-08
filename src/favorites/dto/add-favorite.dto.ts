import { IsString, IsOptional, IsNumber } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  coinId: string;

  @IsOptional()
  @IsNumber()
  alertOnPriceIncrease?: number;

  @IsOptional()
  @IsNumber()
  alertOnPriceDecrease?: number;
}

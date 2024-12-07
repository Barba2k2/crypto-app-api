import { IsString, IsNumber, IsEnum } from 'class-validator';

export class CreatePriceAlertDto {
  @IsString()
  coinId: string;

  @IsNumber()
  targetPrice: number;

  @IsEnum(['ABOVE', 'BELOW'])
  type: 'ABOVE' | 'BELOW';
}

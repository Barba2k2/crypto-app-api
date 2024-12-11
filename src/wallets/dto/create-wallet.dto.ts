import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsHexColor()
  iconColor: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  chain?: 'eth' | 'bsc' | 'polygon' | 'avalanche';
}
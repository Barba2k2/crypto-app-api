import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsString()
  icon: string;

  @IsHexColor()
  iconColor: string;
}
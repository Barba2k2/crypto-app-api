import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { AuthProviderData } from '../interfaces/auth-provider.interface';

export class RegisterDto implements AuthProviderData {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  googleId?: string;
}
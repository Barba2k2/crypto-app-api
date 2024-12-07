import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Por enquanto deixaremos apenas um endpoint básico
  @Get('me')
  getProfile(@Request() req) {
    return { message: 'Profile route' };
  }
}

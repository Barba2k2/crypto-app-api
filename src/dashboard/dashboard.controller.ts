import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getPortfolioOverview(@CurrentUser() user: User) {
    return this.dashboardService.getPortfolioOverview(user);
  }

  @Get('performance')
  getPerformanceHistory(@CurrentUser() user: User) {
    return this.dashboardService.getPerformanceHistory(user);
  }
}
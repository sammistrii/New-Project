import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  @Roles('moderator', 'council')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiQuery({ name: 'range', enum: ['7d', '30d', '90d'], required: false })
  async getAnalytics(@Query('range') range: '7d' | '30d' | '90d' = '30d') {
    return this.adminService.getAnalytics(range);
  }

  @Get('analytics/export')
  @Roles('council')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: true })
  @ApiQuery({ name: 'range', enum: ['7d', '30d', '90d'], required: false })
  async exportAnalytics(
    @Query('format') format: 'csv' | 'pdf',
    @Query('range') range: '7d' | '30d' | '90d' = '30d',
    @Res() res: Response,
  ) {
    const data = await this.adminService.exportAnalytics(format, range);
    
    const filename = `eco-points-analytics-${range}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/pdf';
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': data.length,
    });
    
    res.send(data);
  }

  @Get('moderation/queue')
  @Roles('moderator')
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiQuery({ name: 'status', required: false })
  async getModerationQueue(@Query('status') status?: string) {
    return this.adminService.getModerationQueue(status);
  }

  @Get('moderation/stats')
  @Roles('moderator', 'council')
  @ApiOperation({ summary: 'Get moderation statistics' })
  async getModerationStats() {
    return this.adminService.getModerationStats();
  }

  @Get('cashouts/stats')
  @Roles('moderator', 'council')
  @ApiOperation({ summary: 'Get cashout statistics' })
  async getCashoutStats() {
    return this.adminService.getCashoutStats();
  }
}
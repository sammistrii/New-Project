import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CashoutService } from './cashout.service';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashoutRequest } from './entities/cashout-request.entity';

@ApiTags('cashout')
@Controller('cashout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CashoutController {
  constructor(private readonly cashoutService: CashoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cash-out request' })
  @ApiResponse({
    status: 201,
    description: 'Cash-out request created successfully',
    type: CashoutRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient points' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createCashoutDto: CreateCashoutDto, @Request() req) {
    return this.cashoutService.create(createCashoutDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cash-out requests for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Cash-out requests retrieved successfully',
    type: [CashoutRequest],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    return this.cashoutService.findAll(req.user.sub, req.user.role);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get all cash-out requests (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All cash-out requests retrieved successfully',
    type: [CashoutRequest],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAllAdmin(@Request() req) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new ForbiddenException('Admin access required');
    }

    return this.cashoutService.findAll(req.user.sub, req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cash-out statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cash-out statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getStats(@Request() req) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new ForbiddenException('Admin access required');
    }

    return this.cashoutService.getCashoutStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash-out request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Cash-out request retrieved successfully',
    type: CashoutRequest,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cash-out request not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.cashoutService.findOne(id, req.user.sub, req.user.role);
  }

  @Post(':id/initiate')
  @ApiOperation({ summary: 'Initiate cash-out payment (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cash-out payment initiated successfully',
    type: CashoutRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or payment initiation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Cash-out request not found' })
  async initiate(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new ForbiddenException('Admin access required');
    }

    return this.cashoutService.initiate(id, req.user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel cash-out request' })
  @ApiResponse({
    status: 200,
    description: 'Cash-out request cancelled successfully',
    type: CashoutRequest,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel this request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cash-out request not found' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.cashoutService.cancel(id, req.user.sub);
  }
}
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CashoutRequest, CashoutStatus, PayoutMethod } from './entities/cashout-request.entity';
import { PayoutTransaction, TransactionStatus, PaymentGateway } from './entities/payout-transaction.entity';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { UsersService } from '../users/users.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class CashoutService {
  private readonly POINTS_TO_CASH_RATE = 0.01; // 1 point = $0.01
  private readonly MIN_CASHOUT_AMOUNT = 5.00; // Minimum $5.00
  private readonly MAX_CASHOUT_AMOUNT = 1000.00; // Maximum $1000.00

  constructor(
    @InjectRepository(CashoutRequest)
    private readonly cashoutRepository: Repository<CashoutRequest>,
    @InjectRepository(PayoutTransaction)
    private readonly transactionRepository: Repository<PayoutTransaction>,
    private readonly usersService: UsersService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createCashoutDto: CreateCashoutDto, userId: string): Promise<CashoutRequest> {
    const { points, method, destinationRef } = createCashoutDto;

    // Validate minimum and maximum amounts
    const cashAmount = points * this.POINTS_TO_CASH_RATE;
    if (cashAmount < this.MIN_CASHOUT_AMOUNT) {
      throw new BadRequestException(`Minimum cash-out amount is $${this.MIN_CASHOUT_AMOUNT}`);
    }
    if (cashAmount > this.MAX_CASHOUT_AMOUNT) {
      throw new BadRequestException(`Maximum cash-out amount is $${this.MAX_CASHOUT_AMOUNT}`);
    }

    // Check if user has enough points
    const userWallet = await this.usersService.getUserWallet(userId);
    if (userWallet.points_balance < points) {
      throw new BadRequestException('Insufficient points balance');
    }

    // Check if user has any pending cash-out requests
    const pendingRequests = await this.cashoutRepository.count({
      where: {
        user_id: userId,
        status: CashoutStatus.PENDING,
      },
    });

    if (pendingRequests > 0) {
      throw new BadRequestException('You already have a pending cash-out request');
    }

    // Lock the points in user's wallet
    await this.usersService.lockAmount(userId, points);

    // Create cash-out request
    const cashoutRequest = this.cashoutRepository.create({
      user_id: userId,
      points_used: points,
      cash_amount: cashAmount,
      method,
      destination_ref: destinationRef,
      status: CashoutStatus.PENDING,
    });

    const savedRequest = await this.cashoutRepository.save(cashoutRequest);

    // Create initial transaction record
    await this.createTransaction(savedRequest.id, method);

    return savedRequest;
  }

  async findAll(userId: string, userRole: string): Promise<CashoutRequest[]> {
    const queryBuilder = this.cashoutRepository
      .createQueryBuilder('cashout')
      .leftJoinAndSelect('cashout.user', 'user')
      .leftJoinAndSelect('cashout.transactions', 'transactions')
      .orderBy('cashout.created_at', 'DESC');

    // Apply role-based filtering
    if (userRole === 'tourist') {
      queryBuilder.where('cashout.user_id = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<CashoutRequest> {
    const cashoutRequest = await this.cashoutRepository.findOne({
      where: { id },
      relations: ['user', 'transactions'],
    });

    if (!cashoutRequest) {
      throw new NotFoundException(`Cash-out request with ID ${id} not found`);
    }

    // Check access permissions
    if (userRole === 'tourist' && cashoutRequest.user_id !== userId) {
      throw new ForbiddenException('You can only view your own cash-out requests');
    }

    return cashoutRequest;
  }

  async initiate(id: string, adminId: string): Promise<CashoutRequest> {
    const cashoutRequest = await this.cashoutRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!cashoutRequest) {
      throw new NotFoundException(`Cash-out request with ID ${id} not found`);
    }

    if (cashoutRequest.status !== CashoutStatus.PENDING) {
      throw new BadRequestException('Cash-out request is not in pending status');
    }

    try {
      // Initiate payment through payment gateway
      const paymentResult = await this.paymentService.initiatePayout({
        amount: cashoutRequest.cash_amount,
        method: cashoutRequest.method,
        destinationRef: cashoutRequest.destination_ref,
        reference: cashoutRequest.id,
      });

      // Update cash-out request status
      cashoutRequest.status = CashoutStatus.INITIATED;
      await this.cashoutRepository.save(cashoutRequest);

      // Update transaction status
      await this.updateTransactionStatus(
        cashoutRequest.id,
        TransactionStatus.PROCESSING,
        paymentResult.gatewayTransactionId,
      );

      return cashoutRequest;
    } catch (error) {
      // If payment initiation fails, revert the locked points
      await this.usersService.unlockAmount(cashoutRequest.user_id, cashoutRequest.points_used);
      
      cashoutRequest.status = CashoutStatus.FAILED;
      cashoutRequest.failure_reason = `Payment initiation failed: ${error.message}`;
      await this.cashoutRepository.save(cashoutRequest);

      throw new BadRequestException(`Failed to initiate payment: ${error.message}`);
    }
  }

  async cancel(id: string, userId: string): Promise<CashoutRequest> {
    const cashoutRequest = await this.findOne(id, userId, 'tourist');

    if (!cashoutRequest.canBeCancelled()) {
      throw new BadRequestException('Cash-out request cannot be cancelled');
    }

    // Unlock the points
    await this.usersService.unlockAmount(userId, cashoutRequest.points_used);

    // Update status
    cashoutRequest.status = CashoutStatus.CANCELED;
    return this.cashoutRepository.save(cashoutRequest);
  }

  async handleWebhook(webhookData: any, gateway: PaymentGateway): Promise<void> {
    try {
      const { reference, status, transactionId, failureReason } = webhookData;

      // Find the cash-out request
      const cashoutRequest = await this.cashoutRepository.findOne({
        where: { id: reference },
        relations: ['user'],
      });

      if (!cashoutRequest) {
        throw new Error(`Cash-out request not found: ${reference}`);
      }

      // Update transaction
      await this.updateTransactionStatus(
        reference,
        this.mapGatewayStatus(status),
        transactionId,
        webhookData,
        failureReason,
      );

      // Update cash-out request status
      if (status === 'succeeded' || status === 'completed') {
        cashoutRequest.status = CashoutStatus.SUCCEEDED;
        
        // Deduct points from user's wallet
        await this.usersService.deductPoints(cashoutRequest.user_id, cashoutRequest.points_used);
        
        // Add cash to user's wallet
        await this.usersService.updateWallet(cashoutRequest.user_id, {
          cash_balance: cashoutRequest.cash_amount,
        });
      } else if (status === 'failed' || status === 'cancelled') {
        cashoutRequest.status = CashoutStatus.FAILED;
        cashoutRequest.failure_reason = failureReason || 'Payment failed';
        
        // Unlock the points
        await this.usersService.unlockAmount(cashoutRequest.user_id, cashoutRequest.points_used);
      }

      await this.cashoutRepository.save(cashoutRequest);
    } catch (error) {
      // Log error and potentially retry
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  async getCashoutStats(): Promise<any> {
    const total = await this.cashoutRepository.count();
    const pending = await this.cashoutRepository.count({ where: { status: CashoutStatus.PENDING } });
    const succeeded = await this.cashoutRepository.count({ where: { status: CashoutStatus.SUCCEEDED } });
    const failed = await this.cashoutRepository.count({ where: { status: CashoutStatus.FAILED } });

    const totalAmount = await this.cashoutRepository
      .createQueryBuilder('cashout')
      .select('SUM(cashout.cash_amount)', 'total')
      .where('cashout.status = :status', { status: CashoutStatus.SUCCEEDED })
      .getRawOne();

    return {
      total,
      pending,
      succeeded,
      failed,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      successRate: total > 0 ? (succeeded / total) * 100 : 0,
    };
  }

  private async createTransaction(cashoutRequestId: string, method: PayoutMethod): Promise<PayoutTransaction> {
    const gateway = this.mapMethodToGateway(method);
    
    const transaction = this.transactionRepository.create({
      cashout_request_id: cashoutRequestId,
      gateway,
      status: TransactionStatus.INITIATED,
    });

    return this.transactionRepository.save(transaction);
  }

  private async updateTransactionStatus(
    cashoutRequestId: string,
    status: TransactionStatus,
    gatewayTransactionId?: string,
    webhookData?: any,
    failureReason?: string,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { cashout_request_id: cashoutRequestId },
    });

    if (transaction) {
      transaction.status = status;
      if (gatewayTransactionId) {
        transaction.gateway_txn_id = gatewayTransactionId;
      }
      if (webhookData) {
        transaction.raw_webhook_json = webhookData;
      }
      if (failureReason) {
        transaction.failure_reason = failureReason;
      }
      if (status === TransactionStatus.SUCCEEDED || status === TransactionStatus.FAILED) {
        transaction.processed_at = new Date();
      }

      await this.transactionRepository.save(transaction);
    }
  }

  private mapMethodToGateway(method: PayoutMethod): PaymentGateway {
    switch (method) {
      case PayoutMethod.STRIPE:
        return PaymentGateway.STRIPE;
      case PayoutMethod.PAYPAL:
        return PaymentGateway.PAYPAL;
      case PayoutMethod.BANK_TRANSFER:
        return PaymentGateway.BANK_TRANSFER;
      case PayoutMethod.CRYPTO:
        return PaymentGateway.CRYPTO;
      default:
        return PaymentGateway.STRIPE;
    }
  }

  private mapGatewayStatus(gatewayStatus: string): TransactionStatus {
    switch (gatewayStatus.toLowerCase()) {
      case 'succeeded':
      case 'completed':
      case 'success':
        return TransactionStatus.SUCCEEDED;
      case 'failed':
      case 'failure':
      case 'error':
        return TransactionStatus.FAILED;
      case 'cancelled':
      case 'canceled':
        return TransactionStatus.CANCELLED;
      case 'processing':
      case 'pending':
        return TransactionStatus.PROCESSING;
      default:
        return TransactionStatus.INITIATED;
    }
  }
}
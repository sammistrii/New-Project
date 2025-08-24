import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CashoutRequest } from './cashout-request.entity';

export enum TransactionStatus {
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto',
}

@Entity('payout_transactions')
@Index(['cashout_request_id'])
@Index(['gateway'])
@Index(['status'])
@Index(['created_at'])
export class PayoutTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cashout_request_id: string;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_txn_id?: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.INITIATED,
  })
  status: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  raw_webhook_json?: any;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gateway_fee?: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => CashoutRequest, (cashoutRequest) => cashoutRequest.transactions)
  @JoinColumn({ name: 'cashout_request_id' })
  cashoutRequest: CashoutRequest;

  // Helper methods
  isCompleted(): boolean {
    return this.status === TransactionStatus.SUCCEEDED || this.status === TransactionStatus.FAILED;
  }

  isSuccessful(): boolean {
    return this.status === TransactionStatus.SUCCEEDED;
  }

  getStatusColor(): string {
    switch (this.status) {
      case TransactionStatus.INITIATED:
        return 'info';
      case TransactionStatus.PROCESSING:
        return 'warning';
      case TransactionStatus.SUCCEEDED:
        return 'success';
      case TransactionStatus.FAILED:
        return 'error';
      case TransactionStatus.CANCELLED:
        return 'secondary';
      default:
        return 'default';
    }
  }

  getWebhookData(): any {
    try {
      return this.raw_webhook_json ? JSON.parse(this.raw_webhook_json) : null;
    } catch {
      return this.raw_webhook_json;
    }
  }
}
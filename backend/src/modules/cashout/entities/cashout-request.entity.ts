import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PayoutTransaction } from './payout-transaction.entity';

export enum CashoutStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum PayoutMethod {
  // Indian Payment Methods
  GOOGLE_PAY = 'google_pay',
  PHONEPE = 'phonepe',
  PAYTM = 'paytm',
  BHIM_UPI = 'bhim_upi',
  AMAZON_PAY = 'amazon_pay',
  WHATSAPP_PAY = 'whatsapp_pay',
  NET_BANKING = 'net_banking',
  CARD = 'card',
  // International Payment Methods
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CRYPTO = 'crypto',
}

@Entity('cashout_requests')
@Index(['user_id'])
@Index(['status'])
@Index(['created_at'])
export class CashoutRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'int' })
  points_used: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cash_amount: number;

  @Column({
    type: 'enum',
    enum: PayoutMethod,
  })
  method: PayoutMethod;

  @Column({ type: 'varchar', length: 500 })
  destination_ref: string; // Bank account, PayPal email, etc.

  @Column({
    type: 'enum',
    enum: CashoutStatus,
    default: CashoutStatus.PENDING,
  })
  status: CashoutStatus;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.cashoutRequests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PayoutTransaction, (transaction) => transaction.cashoutRequest)
  transactions: PayoutTransaction[];

  // Helper methods
  canBeCancelled(): boolean {
    return this.status === CashoutStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === CashoutStatus.SUCCEEDED || this.status === CashoutStatus.FAILED;
  }

  getStatusColor(): string {
    switch (this.status) {
      case CashoutStatus.PENDING:
        return 'warning';
      case CashoutStatus.INITIATED:
        return 'info';
      case CashoutStatus.SUCCEEDED:
        return 'success';
      case CashoutStatus.FAILED:
        return 'error';
      case CashoutStatus.CANCELED:
        return 'secondary';
      default:
        return 'default';
    }
  }
}
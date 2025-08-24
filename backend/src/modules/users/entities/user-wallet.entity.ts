import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_wallets')
export class UserWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'int', default: 0 })
  points_balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  cash_balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  locked_amount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper methods
  getAvailablePoints(): number {
    return this.points_balance;
  }

  getAvailableCash(): number {
    return this.cash_balance - this.locked_amount;
  }

  canAffordPoints(points: number): boolean {
    return this.points_balance >= points;
  }

  canAffordCash(amount: number): boolean {
    return this.getAvailableCash() >= amount;
  }

  addPoints(points: number): void {
    this.points_balance += points;
  }

  deductPoints(points: number): void {
    if (this.points_balance < points) {
      throw new Error('Insufficient points');
    }
    this.points_balance -= points;
  }

  addCash(amount: number): void {
    this.cash_balance += amount;
  }

  lockAmount(amount: number): void {
    if (this.getAvailableCash() < amount) {
      throw new Error('Insufficient available cash');
    }
    this.locked_amount += amount;
  }

  unlockAmount(amount: number): void {
    if (this.locked_amount < amount) {
      throw new Error('Cannot unlock more than locked amount');
    }
    this.locked_amount -= amount;
  }

  deductLockedAmount(amount: number): void {
    if (this.locked_amount < amount) {
      throw new Error('Cannot deduct more than locked amount');
    }
    this.locked_amount -= amount;
    this.cash_balance -= amount;
  }
}
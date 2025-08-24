import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserWallet } from './user-wallet.entity';
import { VideoSubmission } from '../../submissions/entities/video-submission.entity';
import { CashoutRequest } from '../../cashouts/entities/cashout-request.entity';

export enum UserRole {
  TOURIST = 'tourist',
  MODERATOR = 'moderator',
  COUNCIL = 'council',
}

export enum KYCStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TOURIST,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 50,
    default: KYCStatus.PENDING,
  })
  kyc_status: KYCStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  password_hash?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Exclude()
  refresh_token?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @OneToOne(() => UserWallet, (wallet) => wallet.user, { cascade: true })
  wallet: UserWallet;

  @OneToMany(() => VideoSubmission, (submission) => submission.user)
  submissions: VideoSubmission[];

  @OneToMany(() => CashoutRequest, (cashout) => cashout.user)
  cashout_requests: CashoutRequest[];

  // Helper methods
  isTourist(): boolean {
    return this.role === UserRole.TOURIST;
  }

  isModerator(): boolean {
    return this.role === UserRole.MODERATOR;
  }

  isCouncil(): boolean {
    return this.role === UserRole.COUNCIL;
  }

  canModerate(): boolean {
    return this.role === UserRole.MODERATOR || this.role === UserRole.COUNCIL;
  }

  canViewReports(): boolean {
    return this.role === UserRole.COUNCIL;
  }
}
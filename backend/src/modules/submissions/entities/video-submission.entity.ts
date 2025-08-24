import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BinLocation } from './bin-location.entity';
import { SubmissionEvent } from './submission-event.entity';

export enum SubmissionStatus {
  QUEUED = 'queued',
  AUTO_VERIFIED = 'auto_verified',
  NEEDS_REVIEW = 'needs_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('video_submissions')
@Index(['user_id'])
@Index(['status'])
@Index(['created_at'])
@Index(['gps_lat', 'gps_lng'])
export class VideoSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumb_key?: string;

  @Column({ type: 'int', nullable: true })
  duration_s?: number;

  @Column({ type: 'bigint', nullable: true })
  size_bytes?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_hash?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  gps_lat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  gps_lng: number;

  @Column({ type: 'timestamp with time zone' })
  recorded_at: Date;

  @Column({ type: 'uuid', nullable: true })
  bin_id_guess?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  auto_score?: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.QUEUED,
  })
  status: SubmissionStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BinLocation, { nullable: true })
  @JoinColumn({ name: 'bin_id_guess' })
  bin_location?: BinLocation;

  @OneToMany(() => SubmissionEvent, (event) => event.submission)
  events: SubmissionEvent[];

  // Helper methods
  isPending(): boolean {
    return this.status === SubmissionStatus.QUEUED;
  }

  isAutoVerified(): boolean {
    return this.status === SubmissionStatus.AUTO_VERIFIED;
  }

  needsHumanReview(): boolean {
    return this.status === SubmissionStatus.NEEDS_REVIEW;
  }

  isApproved(): boolean {
    return this.status === SubmissionStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === SubmissionStatus.REJECTED;
  }

  canTransitionTo(newStatus: SubmissionStatus): boolean {
    const validTransitions = {
      [SubmissionStatus.QUEUED]: [SubmissionStatus.AUTO_VERIFIED, SubmissionStatus.NEEDS_REVIEW, SubmissionStatus.REJECTED],
      [SubmissionStatus.AUTO_VERIFIED]: [SubmissionStatus.APPROVED, SubmissionStatus.REJECTED],
      [SubmissionStatus.NEEDS_REVIEW]: [SubmissionStatus.APPROVED, SubmissionStatus.REJECTED],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  getVideoUrl(): string {
    // This would be constructed based on your S3 configuration
    return `${process.env.S3_BASE_URL}/${this.s3_key}`;
  }

  getThumbnailUrl(): string | null {
    if (!this.thumb_key) return null;
    return `${process.env.S3_BASE_URL}/${this.thumb_key}`;
  }

  getFormattedDuration(): string {
    if (!this.duration_s) return 'Unknown';
    const minutes = Math.floor(this.duration_s / 60);
    const seconds = this.duration_s % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getFormattedSize(): string {
    if (!this.size_bytes) return 'Unknown';
    const mb = this.size_bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
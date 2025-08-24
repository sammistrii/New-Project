import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VideoSubmission } from './video-submission.entity';
import { User } from '../../users/entities/user.entity';

export enum EventType {
  SUBMISSION_CREATED = 'submission_created',
  SUBMISSION_UPDATED = 'submission_updated',
  SUBMISSION_APPROVED = 'submission_approved',
  SUBMISSION_REJECTED = 'submission_rejected',
  POINTS_CREDITED = 'points_credited',
  CASHOUT_REQUESTED = 'cashout_requested',
  PAYOUT_INITIATED = 'payout_initiated',
  PAYOUT_COMPLETED = 'payout_completed',
}

@Entity('submission_events')
@Index(['submission_id'])
@Index(['created_at'])
@Index(['event_type'])
export class SubmissionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  submission_id: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id?: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  event_type: EventType;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => VideoSubmission, (submission) => submission.events)
  @JoinColumn({ name: 'submission_id' })
  submission: VideoSubmission;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  // Helper methods
  getFormattedMeta(): string {
    if (!this.meta) return '';
    
    try {
      return JSON.stringify(this.meta, null, 2);
    } catch {
      return 'Invalid metadata';
    }
  }

  getEventDescription(): string {
    switch (this.event_type) {
      case EventType.SUBMISSION_CREATED:
        return 'Video submission created';
      case EventType.SUBMISSION_UPDATED:
        return 'Submission details updated';
      case EventType.SUBMISSION_APPROVED:
        return `Submission approved${this.meta?.reason ? `: ${this.meta.reason}` : ''}`;
      case EventType.SUBMISSION_REJECTED:
        return `Submission rejected: ${this.meta?.reason || 'No reason provided'}`;
      case EventType.POINTS_CREDITED:
        return `Points credited: ${this.meta?.points_awarded || 0}`;
      case EventType.CASHOUT_REQUESTED:
        return 'Cash-out requested';
      case EventType.PAYOUT_INITIATED:
        return 'Payout initiated';
      case EventType.PAYOUT_COMPLETED:
        return 'Payout completed';
      default:
        return 'Unknown event';
    }
  }
}
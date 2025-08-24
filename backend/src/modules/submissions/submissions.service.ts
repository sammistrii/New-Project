import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { VideoSubmission, SubmissionStatus } from './entities/video-submission.entity';
import { SubmissionEvent } from './entities/submission-event.entity';
import { BinLocation } from './entities/bin-location.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(VideoSubmission)
    private readonly submissionRepository: Repository<VideoSubmission>,
    @InjectRepository(SubmissionEvent)
    private readonly eventRepository: Repository<SubmissionEvent>,
    @InjectRepository(BinLocation)
    private readonly binLocationRepository: Repository<BinLocation>,
    @InjectQueue('video-processing')
    private readonly videoProcessingQueue: Queue,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto, userId: string): Promise<VideoSubmission> {
    const { video, title, description, location, recordedAt, gpsLat, gpsLng } = createSubmissionDto;

    // Validate GPS coordinates
    if (!gpsLat || !gpsLng) {
      throw new BadRequestException('GPS coordinates are required');
    }

    // Check if location is within a registered bin area
    const nearestBin = await this.findNearestBin(gpsLat, gpsLng);
    if (!nearestBin) {
      throw new BadRequestException('Location must be within a registered bin area');
    }

    // Validate recording time (must be within last 24 hours)
    const recordingTime = new Date(recordedAt);
    const now = new Date();
    const timeDiff = now.getTime() - recordingTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      throw new BadRequestException('Video must be recorded within the last 24 hours');
    }

    // Upload video to storage
    const s3Key = await this.storageService.uploadVideo(video);

    // Create submission record
    const submission = this.submissionRepository.create({
      user_id: userId,
      s3_key: s3Key,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      recorded_at: recordingTime,
      bin_id_guess: nearestBin.id,
      status: SubmissionStatus.QUEUED,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // Log submission event
    await this.logEvent(savedSubmission.id, userId, 'submission_created', {
      title,
      description,
      location,
      bin_location: nearestBin.name,
    });

    // Add to video processing queue
    await this.videoProcessingQueue.add('process-video', {
      submissionId: savedSubmission.id,
      s3Key,
    });

    return savedSubmission;
  }

  async findAll(userId: string, userRole: string, filters?: any): Promise<VideoSubmission[]> {
    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoinAndSelect('submission.bin_location', 'bin_location')
      .leftJoinAndSelect('submission.events', 'events');

    // Apply role-based filtering
    if (userRole === 'tourist') {
      queryBuilder.where('submission.user_id = :userId', { userId });
    } else if (userRole === 'moderator') {
      // Moderators can see all submissions but prioritize those needing review
      if (filters?.status === 'needs_review') {
        queryBuilder.where('submission.status = :status', { status: SubmissionStatus.NEEDS_REVIEW });
      }
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('submission.status = :status', { status: filters.status });
    }

    // Apply date range filter
    if (filters?.fromDate) {
      queryBuilder.andWhere('submission.created_at >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters?.toDate) {
      queryBuilder.andWhere('submission.created_at <= :toDate', { toDate: filters.toDate });
    }

    // Apply location filter
    if (filters?.binId) {
      queryBuilder.andWhere('submission.bin_id_guess = :binId', { binId: filters.binId });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('submission.created_at', 'DESC');

    // Apply pagination
    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<VideoSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['user', 'bin_location', 'events'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    // Check access permissions
    if (userRole === 'tourist' && submission.user_id !== userId) {
      throw new ForbiddenException('You can only view your own submissions');
    }

    return submission;
  }

  async update(id: string, updateSubmissionDto: UpdateSubmissionDto, userId: string, userRole: string): Promise<VideoSubmission> {
    const submission = await this.findOne(id, userId, userRole);

    // Only allow updates for certain fields and roles
    if (userRole === 'tourist') {
      // Tourists can only update certain fields before submission is processed
      if (submission.status !== SubmissionStatus.QUEUED) {
        throw new BadRequestException('Cannot update submission after processing has begun');
      }

      // Only allow updating description and title
      if (updateSubmissionDto.description !== undefined) {
        submission.description = updateSubmissionDto.description;
      }
      if (updateSubmissionDto.title !== undefined) {
        submission.title = updateSubmissionDto.title;
      }
    } else if (userRole === 'moderator' || userRole === 'council') {
      // Moderators and council can update status and add rejection reasons
      if (updateSubmissionDto.status !== undefined) {
        submission.status = updateSubmissionDto.status;
      }
      if (updateSubmissionDto.rejection_reason !== undefined) {
        submission.rejection_reason = updateSubmissionDto.rejection_reason;
      }
      if (updateSubmissionDto.auto_score !== undefined) {
        submission.auto_score = updateSubmissionDto.auto_score;
      }
    }

    const updatedSubmission = await this.submissionRepository.save(submission);

    // Log the update event
    await this.logEvent(id, userId, 'submission_updated', updateSubmissionDto);

    return updatedSubmission;
  }

  async approve(id: string, moderatorId: string, reason?: string): Promise<VideoSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    if (submission.status === SubmissionStatus.APPROVED) {
      throw new BadRequestException('Submission is already approved');
    }

    if (submission.status === SubmissionStatus.REJECTED) {
      throw new BadRequestException('Cannot approve a rejected submission');
    }

    // Update submission status
    submission.status = SubmissionStatus.APPROVED;
    const updatedSubmission = await this.submissionRepository.save(submission);

    // Award points to user (configurable amount)
    const pointsAwarded = this.calculatePointsAwarded(submission);
    await this.usersService.addPoints(submission.user_id, pointsAwarded);

    // Log approval event
    await this.logEvent(id, moderatorId, 'submission_approved', {
      reason,
      points_awarded: pointsAwarded,
    });

    return updatedSubmission;
  }

  async reject(id: string, moderatorId: string, reason: string): Promise<VideoSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    if (submission.status === SubmissionStatus.REJECTED) {
      throw new BadRequestException('Submission is already rejected');
    }

    if (submission.status === SubmissionStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an approved submission');
    }

    // Update submission status
    submission.status = SubmissionStatus.REJECTED;
    submission.rejection_reason = reason;
    const updatedSubmission = await this.submissionRepository.save(submission);

    // Log rejection event
    await this.logEvent(id, moderatorId, 'submission_rejected', { reason });

    return updatedSubmission;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const submission = await this.findOne(id, userId, userRole);

    // Only allow deletion for certain conditions
    if (userRole === 'tourist') {
      if (submission.status !== SubmissionStatus.QUEUED) {
        throw new BadRequestException('Cannot delete submission after processing has begun');
      }
      if (submission.user_id !== userId) {
        throw new ForbiddenException('You can only delete your own submissions');
      }
    }

    // Delete from storage
    await this.storageService.deleteVideo(submission.s3_key);

    // Delete submission and related events
    await this.eventRepository.delete({ submission_id: id });
    await this.submissionRepository.remove(submission);
  }

  async getModerationQueue(): Promise<VideoSubmission[]> {
    return this.submissionRepository.find({
      where: [
        { status: SubmissionStatus.NEEDS_REVIEW },
        { status: SubmissionStatus.QUEUED },
      ],
      relations: ['user', 'bin_location'],
      order: {
        created_at: 'ASC', // Oldest first
      },
    });
  }

  async getSubmissionStats(): Promise<any> {
    const total = await this.submissionRepository.count();
    const approved = await this.submissionRepository.count({ where: { status: SubmissionStatus.APPROVED } });
    const rejected = await this.submissionRepository.count({ where: { status: SubmissionStatus.REJECTED } });
    const pending = await this.submissionRepository.count({ 
      where: [
        { status: SubmissionStatus.QUEUED },
        { status: SubmissionStatus.NEEDS_REVIEW },
      ] 
    });

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
    };
  }

  private async findNearestBin(lat: number, lng: number): Promise<BinLocation | null> {
    // Find the nearest bin within radius
    const bins = await this.binLocationRepository
      .createQueryBuilder('bin')
      .where('bin.active = :active', { active: true })
      .getMany();

    let nearestBin: BinLocation | null = null;
    let minDistance = Infinity;

    for (const bin of bins) {
      const distance = this.calculateDistance(lat, lng, bin.lat, bin.lng);
      if (distance <= bin.radius_m && distance < minDistance) {
        minDistance = distance;
        nearestBin = bin;
      }
    }

    return nearestBin;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculatePointsAwarded(submission: VideoSubmission): number {
    // Base points for approved submission
    let points = 100;

    // Bonus points for high auto-score
    if (submission.auto_score && submission.auto_score > 0.8) {
      points += 50;
    }

    // Bonus points for being in a high-traffic area
    // This could be enhanced with more sophisticated logic

    return points;
  }

  private async logEvent(submissionId: string, actorId: string, eventType: string, meta?: any): Promise<void> {
    const event = this.eventRepository.create({
      submission_id: submissionId,
      actor_id: actorId,
      event_type: eventType,
      meta,
    });

    await this.eventRepository.save(event);
  }
}
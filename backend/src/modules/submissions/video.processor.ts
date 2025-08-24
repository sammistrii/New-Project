import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ffmpeg from 'fluent-ffmpeg';
import * as imageHash from 'image-hash';
import { promisify } from 'util';

import { VideoSubmission, SubmissionStatus } from './entities/video-submission.entity';
import { StorageService } from '../storage/storage.service';

const hashImage = promisify(imageHash);

interface VideoProcessingJob {
  submissionId: string;
  s3Key: string;
}

@Processor('video-processing')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    @InjectRepository(VideoSubmission)
    private readonly submissionRepository: Repository<VideoSubmission>,
    private readonly storageService: StorageService,
  ) {}

  @Process('process-video')
  async processVideo(job: Job<VideoProcessingJob>) {
    const { submissionId, s3Key } = job.data;
    
    this.logger.log(`Processing video for submission ${submissionId}`);

    try {
      // Get submission details
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Download video from storage for processing
      const videoBuffer = await this.storageService.downloadVideo(s3Key);
      
      // Process video metadata
      const metadata = await this.extractVideoMetadata(videoBuffer);
      
      // Generate thumbnail
      const thumbnailBuffer = await this.generateThumbnail(videoBuffer);
      const thumbnailKey = await this.storageService.uploadThumbnail(thumbnailBuffer, submissionId);
      
      // Generate perceptual hash for duplicate detection
      const perceptualHash = await this.generatePerceptualHash(thumbnailBuffer);
      
      // Run AI analysis (simplified for now)
      const aiScore = await this.runAIAnalysis(videoBuffer, metadata);
      
      // Update submission with processed data
      await this.submissionRepository.update(submissionId, {
        thumb_key: thumbnailKey,
        duration_s: metadata.duration,
        size_bytes: metadata.size,
        auto_score: aiScore,
        status: aiScore > 0.7 ? SubmissionStatus.AUTO_VERIFIED : SubmissionStatus.NEEDS_REVIEW,
      });

      this.logger.log(`Video processing completed for submission ${submissionId}`);
      
    } catch (error) {
      this.logger.error(`Error processing video for submission ${submissionId}:`, error);
      
      // Update submission status to indicate processing failed
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.NEEDS_REVIEW,
        rejection_reason: 'Video processing failed - manual review required',
      });
      
      throw error;
    }
  }

  private async extractVideoMetadata(videoBuffer: Buffer): Promise<{
    duration: number;
    size: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoBuffer, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: Math.round(metadata.format.duration || 0),
          size: metadata.format.size || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFPS(videoStream.r_frame_rate || '0/1'),
          codec: videoStream.codec_name || 'unknown',
        });
      });
    });
  }

  private async generateThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      ffmpeg(videoBuffer)
        .seekInput('00:00:05') // Seek to 5 seconds
        .frames(1)
        .size('320x240')
        .format('image2')
        .on('end', () => {
          resolve(Buffer.concat(chunks));
        })
        .on('error', reject)
        .on('data', (chunk) => {
          chunks.push(chunk);
        })
        .save('pipe:1');
    });
  }

  private async generatePerceptualHash(thumbnailBuffer: Buffer): Promise<string> {
    try {
      return await hashImage(thumbnailBuffer, 8, 'hex');
    } catch (error) {
      this.logger.warn('Failed to generate perceptual hash:', error);
      return '';
    }
  }

  private async runAIAnalysis(videoBuffer: Buffer, metadata: any): Promise<number> {
    // This is a simplified AI analysis - in production, you'd use actual ML models
    let score = 0.5; // Base score

    // Duration check (prefer videos 10-60 seconds)
    if (metadata.duration >= 10 && metadata.duration <= 60) {
      score += 0.2;
    } else if (metadata.duration < 5) {
      score -= 0.3; // Too short
    }

    // Resolution check (prefer HD+)
    if (metadata.width >= 1280 && metadata.height >= 720) {
      score += 0.1;
    }

    // File size check (not too large, not too small)
    const sizeMB = metadata.size / (1024 * 1024);
    if (sizeMB >= 1 && sizeMB <= 50) {
      score += 0.1;
    } else if (sizeMB > 100) {
      score -= 0.2; // Too large
    }

    // Add some randomness to simulate AI uncertainty
    score += (Math.random() - 0.5) * 0.1;

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  private parseFPS(fpsString: string): number {
    try {
      const [numerator, denominator] = fpsString.split('/').map(Number);
      return denominator ? numerator / denominator : 0;
    } catch {
      return 0;
    }
  }

  @Process('generate-thumbnail')
  async generateThumbnailJob(job: Job<{ submissionId: string; s3Key: string }>) {
    const { submissionId, s3Key } = job.data;
    
    this.logger.log(`Generating thumbnail for submission ${submissionId}`);

    try {
      const videoBuffer = await this.storageService.downloadVideo(s3Key);
      const thumbnailBuffer = await this.generateThumbnail(videoBuffer);
      const thumbnailKey = await this.storageService.uploadThumbnail(thumbnailBuffer, submissionId);
      
      await this.submissionRepository.update(submissionId, {
        thumb_key: thumbnailKey,
      });

      this.logger.log(`Thumbnail generated for submission ${submissionId}`);
    } catch (error) {
      this.logger.error(`Error generating thumbnail for submission ${submissionId}:`, error);
      throw error;
    }
  }

  @Process('analyze-video')
  async analyzeVideoJob(job: Job<{ submissionId: string; s3Key: string }>) {
    const { submissionId, s3Key } = job.data;
    
    this.logger.log(`Analyzing video for submission ${submissionId}`);

    try {
      const videoBuffer = await this.storageService.downloadVideo(s3Key);
      const metadata = await this.extractVideoMetadata(videoBuffer);
      const aiScore = await this.runAIAnalysis(videoBuffer, metadata);
      
      await this.submissionRepository.update(submissionId, {
        duration_s: metadata.duration,
        size_bytes: metadata.size,
        auto_score: aiScore,
        status: aiScore > 0.7 ? SubmissionStatus.AUTO_VERIFIED : SubmissionStatus.NEEDS_REVIEW,
      });

      this.logger.log(`Video analysis completed for submission ${submissionId}`);
    } catch (error) {
      this.logger.error(`Error analyzing video for submission ${submissionId}:`, error);
      throw error;
    }
  }
}
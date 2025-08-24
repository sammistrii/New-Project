import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { VideoSubmission } from './entities/video-submission.entity';
import { SubmissionEvent } from './entities/submission-event.entity';
import { BinLocation } from './entities/bin-location.entity';
import { VideoProcessor } from './video.processor';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoSubmission, SubmissionEvent, BinLocation]),
    BullModule.registerQueue({
      name: 'video-processing',
    }),
    UsersModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, VideoProcessor],
  exports: [SubmissionsService, TypeOrmModule],
})
export class SubmissionsModule {}
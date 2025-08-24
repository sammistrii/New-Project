import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../entities/video-submission.entity';

export class UpdateSubmissionDto {
  @ApiProperty({
    description: 'Video title',
    required: false,
    example: 'Recycling plastic bottles at Hyde Park',
    minLength: 5,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Min(5, { message: 'Title must be at least 5 characters long' })
  @Max(100, { message: 'Title cannot exceed 100 characters' })
  title?: string;

  @ApiProperty({
    description: 'Video description',
    required: false,
    example: 'I collected and recycled 10 plastic bottles found around the park, helping to keep our environment clean.',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Min(10, { message: 'Description must be at least 10 characters long' })
  @Max(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Submission status (admin only)',
    enum: SubmissionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiProperty({
    description: 'Rejection reason (admin only)',
    required: false,
    example: 'Video does not clearly show the eco-friendly action',
  })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({
    description: 'Auto-verification score (admin only)',
    required: false,
    minimum: 0,
    maximum: 1,
    example: 0.85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  auto_score?: number;
}
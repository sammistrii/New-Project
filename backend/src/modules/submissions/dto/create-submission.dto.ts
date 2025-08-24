import { IsString, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Video file',
    type: 'string',
    format: 'binary',
  })
  video: Express.Multer.File;

  @ApiProperty({
    description: 'Video title',
    example: 'Recycling plastic bottles at Hyde Park',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @Min(5, { message: 'Title must be at least 5 characters long' })
  @Max(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'Video description',
    example: 'I collected and recycled 10 plastic bottles found around the park, helping to keep our environment clean.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @Min(10, { message: 'Description must be at least 10 characters long' })
  @Max(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @ApiProperty({
    description: 'Human-readable location',
    example: 'Hyde Park, London',
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'When the video was recorded',
    example: '2024-01-15T14:30:00Z',
  })
  @IsDateString()
  recordedAt: string;

  @ApiProperty({
    description: 'GPS latitude coordinate',
    example: 51.5074,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  gpsLat: number;

  @ApiProperty({
    description: 'GPS longitude coordinate',
    example: -0.1657,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  gpsLng: number;

  @ApiProperty({
    description: 'Device hash for fraud detection',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceHash?: string;
}
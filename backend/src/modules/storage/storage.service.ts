import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    // Configure S3 client
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      s3ForcePathStyle: true, // Required for MinIO
      signatureVersion: 'v4',
    });

    this.bucket = this.configService.get<string>('S3_BUCKET') || 'eco-points-videos';
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    try {
      const key = `videos/${Date.now()}-${file.originalname}`;
      
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          size: file.size.toString(),
        },
      };

      await this.s3.upload(uploadParams).promise();
      
      this.logger.log(`Video uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      this.logger.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  async uploadThumbnail(thumbnailBuffer: Buffer, submissionId: string): Promise<string> {
    try {
      const key = `thumbnails/${submissionId}.jpg`;
      
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          submissionId,
          type: 'thumbnail',
        },
      };

      await this.s3.upload(uploadParams).promise();
      
      this.logger.log(`Thumbnail uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      this.logger.error('Error uploading thumbnail:', error);
      throw new Error('Failed to upload thumbnail');
    }
  }

  async downloadVideo(key: string): Promise<Buffer> {
    try {
      const downloadParams: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.getObject(downloadParams).promise();
      
      if (!result.Body) {
        throw new Error('No video content found');
      }

      this.logger.log(`Video downloaded successfully: ${key}`);
      return result.Body as Buffer;
    } catch (error) {
      this.logger.error('Error downloading video:', error);
      throw new Error('Failed to download video');
    }
  }

  async deleteVideo(key: string): Promise<void> {
    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      
      this.logger.log(`Video deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting video:', error);
      throw new Error('Failed to delete video');
    }
  }

  async getVideoUrl(key: string): Promise<string> {
    try {
      const urlParams: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      // Generate presigned URL for secure access
      const url = await this.s3.getSignedUrlPromise('getObject', {
        ...urlParams,
        Expires: 3600, // 1 hour expiration
      });

      return url;
    } catch (error) {
      this.logger.error('Error generating video URL:', error);
      throw new Error('Failed to generate video URL');
    }
  }

  async getThumbnailUrl(key: string): Promise<string> {
    try {
      const urlParams: AWS.S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      // Generate presigned URL for secure access
      const url = await this.s3.getSignedUrlPromise('getObject', {
        ...urlParams,
        Expires: 3600, // 1 hour expiration
      });

      return url;
    } catch (error) {
      this.logger.error('Error generating thumbnail URL:', error);
      throw new Error('Failed to generate thumbnail URL');
    }
  }

  async listVideos(prefix?: string): Promise<AWS.S3.Object[]> {
    try {
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix || 'videos/',
      };

      const result = await this.s3.listObjectsV2(listParams).promise();
      return result.Contents || [];
    } catch (error) {
      this.logger.error('Error listing videos:', error);
      throw new Error('Failed to list videos');
    }
  }

  async getVideoMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const headParams: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.headObject(headParams).promise();
      return result;
    } catch (error) {
      this.logger.error('Error getting video metadata:', error);
      throw new Error('Failed to get video metadata');
    }
  }
}
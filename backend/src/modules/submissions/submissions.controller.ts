import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideoSubmission } from './entities/video-submission.entity';

@ApiTags('submissions')
@Controller('submissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new video submission' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Video submission created successfully',
    type: VideoSubmission,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
          new FileTypeValidator({ fileType: 'video/*' }),
        ],
      }),
    )
    video: Express.Multer.File,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Request() req,
  ) {
    // Extract form data and create DTO
    const submissionData = {
      ...createSubmissionDto,
      video,
      gpsLat: parseFloat(createSubmissionDto.gpsLat as any),
      gpsLng: parseFloat(createSubmissionDto.gpsLng as any),
    };

    return this.submissionsService.create(submissionData, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all submissions for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
    type: [VideoSubmission],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: any, @Request() req) {
    const filters = {
      status: query.status,
      fromDate: query.fromDate,
      toDate: query.toDate,
      binId: query.binId,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    };

    return this.submissionsService.findAll(req.user.sub, req.user.role, filters);
  }

  @Get('moderation')
  @ApiOperation({ summary: 'Get moderation queue (Moderator/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Moderation queue retrieved successfully',
    type: [VideoSubmission],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Moderator access required' })
  async getModerationQueue(@Request() req) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new Error('Moderator access required');
    }

    return this.submissionsService.getModerationQueue();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get submission statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getStats(@Request() req) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new Error('Admin access required');
    }

    return this.submissionsService.getSubmissionStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get submission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Submission retrieved successfully',
    type: VideoSubmission,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.submissionsService.findOne(id, req.user.sub, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update submission' })
  @ApiResponse({
    status: 200,
    description: 'Submission updated successfully',
    type: VideoSubmission,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req,
  ) {
    return this.submissionsService.update(id, updateSubmissionDto, req.user.sub, req.user.role);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve submission (Moderator/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Submission approved successfully',
    type: VideoSubmission,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Moderator access required' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async approve(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new Error('Moderator access required');
    }

    return this.submissionsService.approve(id, req.user.sub, body.reason);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject submission (Moderator/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Submission rejected successfully',
    type: VideoSubmission,
  })
  @ApiResponse({ status: 400, description: 'Rejection reason required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Moderator access required' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    if (req.user.role !== 'moderator' && req.user.role !== 'council') {
      throw new Error('Moderator access required');
    }

    if (!body.reason) {
      throw new Error('Rejection reason is required');
    }

    return this.submissionsService.reject(id, req.user.sub, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete submission' })
  @ApiResponse({
    status: 200,
    description: 'Submission deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.submissionsService.delete(id, req.user.sub, req.user.role);
    return { message: 'Submission deleted successfully' };
  }
}
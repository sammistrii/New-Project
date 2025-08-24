import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserWallet } from '../users/entities/user-wallet.entity';
import { VideoSubmission } from '../submissions/entities/video-submission.entity';
import { CashoutRequest } from '../cashout/entities/cashout-request.entity';
import { PayoutTransaction } from '../cashout/entities/payout-transaction.entity';
import { BinLocation } from '../submissions/entities/bin-location.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserWallet)
    private userWalletRepository: Repository<UserWallet>,
    @InjectRepository(VideoSubmission)
    private videoSubmissionRepository: Repository<VideoSubmission>,
    @InjectRepository(CashoutRequest)
    private cashoutRequestRepository: Repository<CashoutRequest>,
    @InjectRepository(PayoutTransaction)
    private payoutTransactionRepository: Repository<PayoutTransaction>,
    @InjectRepository(BinLocation)
    private binLocationRepository: Repository<BinLocation>,
  ) {}

  async getAnalytics(range: '7d' | '30d' | '90d') {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Overview statistics
    const [totalUsers, totalSubmissions, totalPointsAwarded, totalPayouts] = await Promise.all([
      this.userRepository.count(),
      this.videoSubmissionRepository.count(),
      this.videoSubmissionRepository
        .createQueryBuilder('vs')
        .select('SUM(vs.auto_score)', 'total')
        .where('vs.status = :status', { status: 'approved' })
        .getRawOne()
        .then(result => parseInt(result.total) || 0),
      this.cashoutRequestRepository
        .createQueryBuilder('cr')
        .select('SUM(cr.cash_amount)', 'total')
        .where('cr.status = :status', { status: 'succeeded' })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
    ]);

    // Monthly active users and submissions
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [activeUsersThisMonth, submissionsThisMonth] = await Promise.all([
      this.userRepository
        .createQueryBuilder('u')
        .innerJoin('u.videoSubmissions', 'vs')
        .where('vs.created_at >= :monthStart', { monthStart })
        .distinct()
        .count()
        .then(result => result),
      this.videoSubmissionRepository.count({
        where: {
          created_at: MoreThanOrEqual(monthStart),
        },
      }),
    ]);

    // Submissions by day
    const submissionsByDay = await this.videoSubmissionRepository
      .createQueryBuilder('vs')
      .select([
        'DATE(vs.created_at) as date',
        'COUNT(*) as submissions',
        'SUM(CASE WHEN vs.status = :approved THEN 1 ELSE 0 END) as approved',
        'SUM(CASE WHEN vs.status = :rejected THEN 1 ELSE 0 END) as rejected',
      ])
      .setParameters({ approved: 'approved', rejected: 'rejected' })
      .where('vs.created_at >= :startDate', { startDate })
      .groupBy('DATE(vs.created_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Submissions by location
    const submissionsByLocation = await this.videoSubmissionRepository
      .createQueryBuilder('vs')
      .innerJoin('vs.binLocation', 'bl')
      .select([
        'bl.name as location',
        'COUNT(*) as count',
        'SUM(vs.auto_score) as points',
      ])
      .where('vs.status = :status', { status: 'approved' })
      .groupBy('bl.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Top participating users
    const userParticipation = await this.videoSubmissionRepository
      .createQueryBuilder('vs')
      .innerJoin('vs.user', 'u')
      .select([
        'u.id as userId',
        'u.name as userName',
        'COUNT(*) as submissions',
        'SUM(vs.auto_score) as points',
        'MAX(vs.created_at) as lastActive',
      ])
      .where('vs.status = :status', { status: 'approved' })
      .groupBy('u.id, u.name')
      .orderBy('submissions', 'DESC')
      .limit(10)
      .getRawMany();

    // Payout statistics
    const payoutStats = await this.cashoutRequestRepository
      .createQueryBuilder('cr')
      .select([
        'SUM(cr.cash_amount) as totalAmount',
        'AVG(cr.cash_amount) as averageAmount',
      ])
      .where('cr.status = :status', { status: 'succeeded' })
      .getRawOne();

    const methodBreakdown = await this.cashoutRequestRepository
      .createQueryBuilder('cr')
      .select([
        'cr.method as method',
        'COUNT(*) as count',
        'SUM(cr.cash_amount) as amount',
      ])
      .where('cr.status = :status', { status: 'succeeded' })
      .groupBy('cr.method')
      .getRawMany();

    // Impact metrics (simulated)
    const impactMetrics = {
      totalWasteCollected: totalSubmissions * 0.05, // 0.05 tons per submission
      estimatedCO2Reduced: totalSubmissions * 0.025, // 0.025 kg CO2 per submission
      costPerSubmission: totalPayouts / totalSubmissions || 0,
      roi: totalPayouts > 0 ? (totalSubmissions * 0.05 * 100) / totalPayouts : 0, // Simplified ROI calculation
    };

    return {
      overview: {
        totalUsers,
        totalSubmissions,
        totalPointsAwarded,
        totalPayouts,
        activeUsersThisMonth,
        submissionsThisMonth,
      },
      submissionsByDay,
      submissionsByLocation,
      userParticipation,
      payoutStats: {
        totalAmount: parseFloat(payoutStats.totalAmount) || 0,
        averageAmount: parseFloat(payoutStats.averageAmount) || 0,
        methodBreakdown,
      },
      impactMetrics,
    };
  }

  async getModerationQueue(status?: string) {
    const query = this.videoSubmissionRepository
      .createQueryBuilder('vs')
      .innerJoinAndSelect('vs.user', 'u')
      .innerJoinAndSelect('vs.binLocation', 'bl')
      .orderBy('vs.created_at', 'ASC');

    if (status && status !== 'all') {
      query.where('vs.status = :status', { status });
    }

    return query.getMany();
  }

  async getModerationStats() {
    const [total, queued, needsReview, approved, rejected] = await Promise.all([
      this.videoSubmissionRepository.count(),
      this.videoSubmissionRepository.count({ where: { status: 'queued' } }),
      this.videoSubmissionRepository.count({ where: { status: 'needs_review' } }),
      this.videoSubmissionRepository.count({ where: { status: 'approved' } }),
      this.videoSubmissionRepository.count({ where: { status: 'rejected' } }),
    ]);

    return { total, queued, needs_review: needsReview, approved, rejected };
  }

  async getCashoutStats() {
    const [total, pending, initiated, succeeded, failed] = await Promise.all([
      this.cashoutRequestRepository.count(),
      this.cashoutRequestRepository.count({ where: { status: 'pending' } }),
      this.cashoutRequestRepository.count({ where: { status: 'initiated' } }),
      this.cashoutRequestRepository.count({ where: { status: 'succeeded' } }),
      this.cashoutRequestRepository.count({ where: { status: 'failed' } }),
    ]);

    const [totalAmount, averageAmount] = await Promise.all([
      this.cashoutRequestRepository
        .createQueryBuilder('cr')
        .select('SUM(cr.cash_amount)', 'total')
        .where('cr.status = :status', { status: 'succeeded' })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.cashoutRequestRepository
        .createQueryBuilder('cr')
        .select('AVG(cr.cash_amount)', 'average')
        .where('cr.status = :status', { status: 'succeeded' })
        .getRawOne()
        .then(result => parseFloat(result.average) || 0),
    ]);

    return {
      total,
      pending,
      initiated,
      succeeded,
      failed,
      totalAmount,
      averageAmount,
    };
  }

  async exportAnalytics(format: 'csv' | 'pdf', range: string) {
    // This would implement actual CSV/PDF export logic
    // For now, return a placeholder
    const data = await this.getAnalytics(range as any);
    
    if (format === 'csv') {
      return this.generateCSV(data);
    } else {
      return this.generatePDF(data);
    }
  }

  private generateCSV(data: any): Buffer {
    // Simplified CSV generation
    const csvContent = `Date,Submissions,Approved,Rejected\n${data.submissionsByDay.map(day => `${day.date},${day.submissions},${day.approved},${day.rejected}`).join('\n')}`;
    return Buffer.from(csvContent, 'utf-8');
  }

  private generatePDF(data: any): Buffer {
    // Simplified PDF generation - would use a library like PDFKit
    const pdfContent = `Eco-Points Analytics Report\nGenerated on ${new Date().toISOString()}\nTotal Users: ${data.overview.totalUsers}`;
    return Buffer.from(pdfContent, 'utf-8');
  }
}
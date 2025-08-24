import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// Entity imports
import { User } from '../modules/users/entities/user.entity';
import { UserWallet } from '../modules/users/entities/user-wallet.entity';
import { BinLocation } from '../modules/submissions/entities/bin-location.entity';
import { VideoSubmission } from '../modules/submissions/entities/video-submission.entity';
import { SubmissionEvent } from '../modules/submissions/entities/submission-event.entity';
import { CashoutRequest } from '../modules/cashouts/entities/cashout-request.entity';
import { PayoutTransaction } from '../modules/payments/entities/payout-transaction.entity';
import { ReportCache } from '../modules/reports/entities/report-cache.entity';

export const dataSourceOptions: DataSource = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'eco_user',
  password: process.env.DB_PASSWORD || 'eco_password',
  database: process.env.DB_NAME || 'eco_points',
  entities: [
    User,
    UserWallet,
    BinLocation,
    VideoSubmission,
    SubmissionEvent,
    CashoutRequest,
    PayoutTransaction,
    ReportCache,
  ],
  migrations: ['src/database/migrations/*.ts'],
  seeds: ['src/database/seeds/*.ts'],
  synchronize: process.env.NODE_ENV === 'development', // Only in development
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export default dataSourceOptions;
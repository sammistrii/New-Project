import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { UserWallet } from '../users/entities/user-wallet.entity';
import { VideoSubmission } from '../submissions/entities/video-submission.entity';
import { CashoutRequest } from '../cashout/entities/cashout-request.entity';
import { PayoutTransaction } from '../cashout/entities/payout-transaction.entity';
import { BinLocation } from '../submissions/entities/bin-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserWallet,
      VideoSubmission,
      CashoutRequest,
      PayoutTransaction,
      BinLocation,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
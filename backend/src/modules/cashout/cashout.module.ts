import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CashoutController } from './cashout.controller';
import { CashoutService } from './cashout.service';
import { CashoutRequest } from './entities/cashout-request.entity';
import { PayoutTransaction } from './entities/payout-transaction.entity';
import { UsersModule } from '../users/users.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashoutRequest, PayoutTransaction]),
    UsersModule,
    PaymentModule,
  ],
  controllers: [CashoutController],
  providers: [CashoutService],
  exports: [CashoutService, TypeOrmModule],
})
export class CashoutModule {}
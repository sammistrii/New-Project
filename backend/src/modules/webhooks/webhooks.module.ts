import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { CashoutModule } from '../cashout/cashout.module';

@Module({
  imports: [ConfigModule, CashoutModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
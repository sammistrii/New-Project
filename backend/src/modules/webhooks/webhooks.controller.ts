import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayPal webhooks' })
  async handlePayPalWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log('Received PayPal webhook');
    
    try {
      const isValid = await this.webhooksService.verifyPayPalWebhook(body, headers);
      if (!isValid) {
        this.logger.warn('Invalid PayPal webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      await this.webhooksService.processPayPalWebhook(body);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing PayPal webhook:', error);
      return { status: 'error', message: 'Processing failed' };
    }
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  async handleStripeWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log('Received Stripe webhook');
    
    try {
      const isValid = await this.webhooksService.verifyStripeWebhook(body, headers);
      if (!isValid) {
        this.logger.warn('Invalid Stripe webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      await this.webhooksService.processStripeWebhook(body);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error);
      return { status: 'error', message: 'Processing failed' };
    }
  }

  @Post('bank-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle bank transfer webhooks' })
  async handleBankTransferWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log('Received bank transfer webhook');
    
    try {
      const isValid = await this.webhooksService.verifyBankTransferWebhook(body, headers);
      if (!isValid) {
        this.logger.warn('Invalid bank transfer webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      await this.webhooksService.processBankTransferWebhook(body);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing bank transfer webhook:', error);
      return { status: 'error', message: 'Processing failed' };
    }
  }

  @Post('crypto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle crypto payment webhooks' })
  async handleCryptoWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log('Received crypto webhook');
    
    try {
      const isValid = await this.webhooksService.verifyCryptoWebhook(body, headers);
      if (!isValid) {
        this.logger.warn('Invalid crypto webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      await this.webhooksService.processCryptoWebhook(body);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing crypto webhook:', error);
      return { status: 'error', message: 'Processing failed' };
    }
  }
}
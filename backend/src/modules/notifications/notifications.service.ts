import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;

  constructor(private configService: ConfigService) {
    this.initializeEmailTransporter();
    this.initializeTwilioClient();
  }

  private initializeEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private initializeTwilioClient() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      };

      await this.emailTransporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio client not initialized, SMS not sent');
        return false;
      }

      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to,
      });

      this.logger.log(`SMS sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendSubmissionApprovedNotification(userEmail: string, userName: string, points: number): Promise<void> {
    const subject = 'Your Video Submission Has Been Approved! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Congratulations, ${userName}!</h2>
        <p>Your video submission has been approved and you've earned <strong>${points} points</strong>!</p>
        <p>These points have been added to your wallet and can be used for cash-outs.</p>
        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">What's Next?</h3>
          <ul>
            <li>Check your wallet balance in the dashboard</li>
            <li>Submit more videos to earn more points</li>
            <li>Request a cash-out when you're ready</li>
          </ul>
        </div>
        <p>Thank you for helping make our community more environmentally friendly!</p>
        <p>Best regards,<br>The Eco-Points Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendSubmissionRejectedNotification(userEmail: string, userName: string, reason: string): Promise<void> {
    const subject = 'Video Submission Update';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Hello ${userName}</h2>
        <p>We've reviewed your video submission and unfortunately, it couldn't be approved at this time.</p>
        <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #DC2626; margin-top: 0;">Reason for Rejection:</h3>
          <p>${reason}</p>
        </div>
        <p>Don't worry! You can always submit a new video. Here are some tips:</p>
        <ul>
          <li>Ensure the video clearly shows the recycling action</li>
          <li>Make sure you're within the designated bin location radius</li>
          <li>Record the video in good lighting conditions</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Eco-Points Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendCashoutInitiatedNotification(userEmail: string, userName: string, amount: number, method: string): Promise<void> {
    const subject = 'Cash-out Request Initiated';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Hello ${userName}</h2>
        <p>Your cash-out request for <strong>$${amount.toFixed(2)}</strong> has been initiated!</p>
        <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563EB; margin-top: 0;">Payment Details:</h3>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Method:</strong> ${method}</p>
          <p><strong>Status:</strong> Processing</p>
        </div>
        <p>You'll receive another notification once the payment is completed. This usually takes 1-3 business days.</p>
        <p>Thank you for your patience!</p>
        <p>Best regards,<br>The Eco-Points Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendCashoutCompletedNotification(userEmail: string, userName: string, amount: number, method: string): Promise<void> {
    const subject = 'Cash-out Completed Successfully! 💰';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Congratulations, ${userName}!</h2>
        <p>Your cash-out request has been completed successfully!</p>
        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Payment Details:</h3>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Method:</strong> ${method}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
        <p>The funds should appear in your account shortly. Keep up the great work with your environmental contributions!</p>
        <p>Best regards,<br>The Eco-Points Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  async sendCashoutFailedNotification(userEmail: string, userName: string, amount: number, reason: string): Promise<void> {
    const subject = 'Cash-out Request Failed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Hello ${userName}</h2>
        <p>Unfortunately, your cash-out request for <strong>$${amount.toFixed(2)}</strong> could not be completed.</p>
        <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #DC2626; margin-top: 0;">Reason for Failure:</h3>
          <p>${reason}</p>
        </div>
        <p>Your points have been refunded to your wallet. You can try requesting a cash-out again or contact our support team for assistance.</p>
        <p>Best regards,<br>The Eco-Points Team</p>
      </div>
    `;

    await this.sendEmail(userEmail, subject, html);
  }
}
import { IsInt, IsEnum, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PayoutMethod } from '../entities/cashout-request.entity';

export class CreateCashoutDto {
  @ApiProperty({
    description: 'Number of eco-points to convert to cash',
    example: 500,
    minimum: 500,
    maximum: 100000,
  })
  @IsInt({ message: 'Points must be a whole number' })
  @Min(500, { message: 'Minimum cash-out is 500 points ($5.00)' })
  @Max(100000, { message: 'Maximum cash-out is 100,000 points ($1,000.00)' })
  points: number;

  @ApiProperty({
    description: 'Payment method for the cash-out',
    enum: PayoutMethod,
    example: PayoutMethod.PAYPAL,
  })
  @IsEnum(PayoutMethod, { message: 'Invalid payment method' })
  method: PayoutMethod;

  @ApiProperty({
    description: 'Payment destination (PayPal email, bank account, etc.)',
    example: 'user@example.com',
    maxLength: 500,
  })
  @IsString({ message: 'Destination reference must be a string' })
  @Max(500, { message: 'Destination reference cannot exceed 500 characters' })
  destinationRef: string;
}
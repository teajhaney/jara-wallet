import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import Paystack from 'paystack';

@Injectable()
export class PaystackService {
  private paystack: Paystack;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('paystack.secretKey');
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
    this.paystack = Paystack(secretKey);
  }

  //Generate a unique transaction reference
  generateReference(): string {
    // Generate unique reference: prefix + timestamp + random string
    const prefix = 'JARA';
    const timestamp = Date.now().toString();
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    return `${prefix}_${timestamp}_${randomPart}`;
  }

  //Initialize a Paystack transaction
  //amount - Amount in kobo (e.g., 50000 = ₦500)
  //email - Customer email
  //reference - Unique transaction reference
  //metadata - Optional metadata to attach to transaction
  async initializeTransaction(
    amount: number,
    email: string,
    reference: string,
    metadata?: Record<string, any>,
  ): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    try {
      const response = await this.paystack.transaction.initialize({
        amount: amount, // Amount in kobo
        email: email,
        reference: reference,
        metadata: metadata || {},
      });

      if (!response.status || !response.data) {
        throw new BadRequestException(
          'Failed to initialize Paystack transaction',
        );
      }

      return {
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to initialize Paystack transaction',
      );
    }
  }

  //Verify a Paystack transaction
  //reference - Transaction reference to verify
  async verifyTransaction(reference: string): Promise<{
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, any>;
  }> {
    try {
      const response = await this.paystack.transaction.verify(reference);

      if (!response.status || !response.data) {
        throw new BadRequestException('Failed to verify Paystack transaction');
      }

      return {
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        customer: {
          email: response.data.customer.email,
        },
        metadata: response.data.metadata,
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to verify Paystack transaction',
      );
    }
  }

  //Verify Paystack webhook signature
  //According to Paystack docs: Use your SECRET KEY (not a separate webhook secret)
  //payload - Raw request body as string (must be JSON.stringify of the body)
  //signature - Signature from x-paystack-signature header
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretKey = this.configService.get<string>('paystack.secretKey');
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    // Create HMAC SHA512 hash using secret key (as per Paystack documentation)
    const hash = createHmac('sha512', secretKey).update(payload).digest('hex');

    // Compare signatures
    return hash === signature;
  }
}

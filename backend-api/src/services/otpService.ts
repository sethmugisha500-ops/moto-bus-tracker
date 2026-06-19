import { PrismaClient } from '@prisma/client';
import redis from '../config/redis';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class OTPService {
  private twilioClient: any;
  private emailTransporter: any;
  private readonly OTP_EXPIRY = 300;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 60;
  private readonly MAX_OTP_PER_WINDOW = 3;

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    setInterval(() => this.cleanupExpiredOTPs(), 10 * 60 * 1000);
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateOTPWithPattern(pattern: 'numeric' | 'alphanumeric' | 'secure' = 'numeric'): string {
    switch (pattern) {
      case 'alphanumeric':
        return crypto.randomBytes(4).toString('hex').toUpperCase();
      case 'secure':
        return crypto.randomInt(100000, 999999).toString();
      default:
        return this.generateOTP();
    }
  }

  async sendOTP(phone: string, email?: string, userId?: string, type: string = 'VERIFICATION') {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY * 1000);

    const rateLimitKey = `otp:ratelimit:${phone}`;
    const currentCount = await redis.get(rateLimitKey);
    if (currentCount && parseInt(currentCount) >= this.MAX_OTP_PER_WINDOW) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new Error(`Rate limit exceeded. Please wait ${ttl} seconds.`);
    }

    const redisKey = `otp:${phone}`;
    await redis.setex(redisKey, this.OTP_EXPIRY, JSON.stringify({
      otp,
      phone,
      email,
      userId,
      type,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
    }));

    try {
      await prisma.otp.create({
        data: {
          phone,
          email: email || null,
          otp,
          expiresAt,
          userId: userId || null,
        },
      });
    } catch (error) {
      console.error('Failed to store OTP in database:', error);
    }

    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);

    const results = { sms: false, email: false, fallback: false };

    if (this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          body: `Your Moto-Bus verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
        results.sms = true;
      } catch (error: any) {
        console.error('SMS delivery failed:', error.message);
      }
    }

    if (this.emailTransporter && email) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL || 'noreply@motobustracker.com',
          to: email,
          subject: 'Moto-Bus Verification Code',
          html: this.getEmailTemplate(otp, type),
          text: `Your Moto-Bus verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
        });
        results.email = true;
      } catch (error: any) {
        console.error('Email delivery failed:', error.message);
      }
    }

    if (!results.sms && !results.email) {
      results.fallback = true;
      console.log(`Fallback OTP for ${phone}: ${otp}`);
    }

    return {
      success: true,
      otp,
      results,
      method: this.getDeliveryMethod(results),
      expiresAt: expiresAt.toISOString(),
      expiresIn: this.OTP_EXPIRY,
    };
  }

  getEmailTemplate(otp: string, type: string): string {
    const messages = {
      VERIFICATION: 'Verify your Moto-Bus account',
      LOGIN: 'Login to Moto-Bus',
      RESET_PASSWORD: 'Reset your Moto-Bus password',
      TWO_FACTOR: 'Two-factor authentication',
    };
    const title = messages[type as keyof typeof messages] || messages.VERIFICATION;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0;">Moto-Bus</h2>
            <p style="color: #6b7280; margin: 5px 0;">Safe & Reliable Transport</p>
          </div>
          <h3 style="color: #1a1a1a; text-align: center;">${title}</h3>
          <p style="color: #4b5563; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 42px; letter-spacing: 10px; color: #1a1a1a; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>5 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you didn't request this code, please ignore this email.<br>
            For security, never share this code with anyone.
          </p>
        </div>
      </div>
    `;
  }

  getDeliveryMethod(results: any): string {
    if (results.sms) return 'sms';
    if (results.email) return 'email';
    return 'fallback';
  }

  async verifyOTP(identifier: string, otp: string): Promise<{ valid: boolean; message: string; userId?: string }> {
    const redisKey = `otp:${identifier}`;
    const cachedData = await redis.get(redisKey);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      if (data.otp === otp) {
        await redis.del(redisKey);
        const user = await this.markOTPAsUsed(identifier, otp);
        return { valid: true, message: 'OTP verified successfully', userId: user?.id || data.userId };
      }
      data.attempts = (data.attempts || 0) + 1;
      if (data.attempts >= this.MAX_ATTEMPTS) {
        await redis.del(redisKey);
        return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
      }
      await redis.setex(redisKey, this.OTP_EXPIRY, JSON.stringify(data));
    }

    try {
      const otpRecord = await prisma.otp.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
          otp,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });

      if (otpRecord) {
        let user = otpRecord.user;
        if (!user) {
          user = await prisma.user.findFirst({
            where: { OR: [{ phone: identifier }, { email: identifier }] },
          });
        }
        await prisma.otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 }, isUsed: true, userId: user?.id || null },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }
        await redis.del(`otp:${identifier}`);
        return { valid: true, message: 'OTP verified successfully', userId: user?.id || otpRecord.userId || undefined };
      }

      const expiredOTP = await prisma.otp.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
          otp,
          isUsed: false,
        },
      });
      if (expiredOTP) {
        await prisma.otp.update({
          where: { id: expiredOTP.id },
          data: { attempts: { increment: 1 } },
        });
        if (expiredOTP.expiresAt < new Date()) {
          return { valid: false, message: 'OTP has expired' };
        }
        if (expiredOTP.attempts >= this.MAX_ATTEMPTS) {
          return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
        }
        return { valid: false, message: 'Invalid OTP' };
      }
      return { valid: false, message: 'OTP not found. Please request a new code.' };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { valid: false, message: 'Verification failed. Please try again.' };
    }
  }

  async markOTPAsUsed(identifier: string, otp: string) {
    try {
      const updated = await prisma.otp.updateMany({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
          otp,
          isUsed: false,
        },
        data: { isUsed: true },
      });
      if (updated.count > 0) {
        return prisma.user.findFirst({
          where: { OR: [{ phone: identifier }, { email: identifier }] },
        });
      }
      return null;
    } catch (error) {
      console.error('Failed to mark OTP as used:', error);
      return null;
    }
  }

  async cleanupExpiredOTPs() {
    try {
      const dbResult = await prisma.otp.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      const keys = await redis.keys('otp:*');
      let redisCount = 0;
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (new Date(parsed.expiresAt) < new Date()) {
            await redis.del(key);
            redisCount++;
          }
        }
      }
      if (dbResult.count > 0 || redisCount > 0) {
        console.log(`Cleaned up ${dbResult.count} DB and ${redisCount} Redis OTPs`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired OTPs:', error);
    }
  }

  async getDevOTP(phone: string): Promise<string | null> {
    const redisKey = `otp:${phone}`;
    const data = await redis.get(redisKey);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.otp;
    }
    const record = await prisma.otp.findFirst({
      where: { phone, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    return record?.otp || null;
  }

  async getActiveOTPs(phone: string) {
    const redisKey = `otp:${phone}`;
    const data = await redis.get(redisKey);
    if (data) {
      const parsed = JSON.parse(data);
      return [{
        phone: parsed.phone,
        otp: parsed.otp,
        expiresAt: parsed.expiresAt,
        isUsed: false,
        attempts: parsed.attempts || 0,
        source: 'redis',
      }];
    }
    return prisma.otp.findMany({
      where: { phone, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async checkOTP(identifier: string, otp: string): Promise<{ valid: boolean; remainingSeconds?: number }> {
    const redisKey = `otp:${identifier}`;
    const data = await redis.get(redisKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.otp === otp) {
        const remaining = Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000);
        return { valid: true, remainingSeconds: Math.max(0, remaining) };
      }
      return { valid: false };
    }
    try {
      const record = await prisma.otp.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
          otp,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (record) {
        const remaining = Math.floor((record.expiresAt.getTime() - Date.now()) / 1000);
        return { valid: true, remainingSeconds: Math.max(0, remaining) };
      }
      return { valid: false };
    } catch (error) {
      console.error('Check OTP error:', error);
      return { valid: false };
    }
  }

  async generateOperationOTP(phone: string, operation: string, email?: string) {
    const otp = this.generateOTPWithPattern('secure');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const redisKey = `otp:operation:${operation}:${phone}`;
    await redis.setex(redisKey, 600, JSON.stringify({ otp, phone, email, operation, expiresAt: expiresAt.toISOString() }));
    await prisma.otp.create({
      data: { phone, email: email || null, otp, expiresAt },
    });
    return { otp, expiresAt };
  }
}

export const otpService = new OTPService();
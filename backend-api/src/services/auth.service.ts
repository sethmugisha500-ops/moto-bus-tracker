// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import redisClient from '../config/redis';
import UserRepository from '../repositories/user.repository';

const userRepo = new UserRepository();

export class AuthService {
  async sendOTP(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store otp in Redis with 10 min expiry
    await redisClient.setex(`otp:${phone}`, 600, otp);
    
    console.log(`📱 otp for ${phone}: ${otp}`);
    
    return { otp, expiresIn: 600 };
  }

  async verifyOTP(phone: string, otp: string) {
    const storedotp = await redisClient.get(`otp:${phone}`);
    
    if (storedotp !== otp) {
      throw new Error('Invalid otp');
    }
    
    let user = await userRepo.findByPhone(phone);
    
    if (!user) {
      user = await userRepo.create({
        phone,
        name: `User_${phone.slice(-4)}`,
      }) as any;
    }

    if (!user) {
      throw new Error('User profile account unavailable');
    }
    
    const jwtSecret = (process.env.JWT_SECRET || 'motobus_secret_key') as string;
    const jwtExpiry = (process.env.JWT_EXPIRES_IN || '7d');
    
    // Fixed: Standardizing parameter signatures to resolve sign parameter overloads
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiry as any }
    );
    
    await redisClient.del(`otp:${phone}`);
    
    // Cast 'as any' to satisfy the complex user/driver/wallet interface requirements directly
    return { user: user as any, token };
  }

  async checkOTP(identifier: string, otp: string) {
    const storedotp = await redisClient.get(`otp:${identifier}`);
    if (!storedotp || storedotp !== otp) {
      return { valid: false, remainingSeconds: 0 };
    }
    const ttl = await redisClient.ttl(`otp:${identifier}`);
    return { valid: true, remainingSeconds: ttl };
  }

  async getDevOTP(phone: string) {
    return await redisClient.get(`otp:${phone}`);
  }

  async getActiveOTPs(phone: string) {
    const otp = await redisClient.get(`otp:${phone}`);
    return otp ? [{ otp, type: 'VERIFICATION' }] : [];
  }
}

export default AuthService;
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import redisClient from '../config/redis';
import UserRepository from '../repositories/user.repository';

const userRepo = new UserRepository();

export class AuthService {
  async sendOTP(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis with 10 min expiry
    await redisClient.setEx(`otp:${phone}`, 600, otp);
    
    console.log(`📱 OTP for ${phone}: ${otp}`);
    
    return { otp, expiresIn: 600 };
  }

  async verifyOTP(phone: string, otp: string) {
    const storedOtp = await redisClient.get(`otp:${phone}`);
    
    if (storedOtp !== otp) {
      throw new Error('Invalid OTP');
    }
    
    let user = await userRepo.findByPhone(phone);
    
    if (!user) {
      user = await userRepo.create({
        phone,
        fullName: `User_${phone.slice(-4)}`,
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    await redisClient.del(`otp:${phone}`);
    
    return { user, token };
  }
}

export default AuthService;
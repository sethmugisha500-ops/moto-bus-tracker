import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import redisClient from '../config/redis';
import UserRepository from '../repositories/user.repository';

const userRepo = new UserRepository();

export class AuthService {
  async sendotp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store otp in Redis with 10 min expiry
    await redisClient.setex(`otp:${phone}`, 600, otp);
    
    console.log(`📱 otp for ${phone}: ${otp}`);
    
    return { otp, expiresIn: 600 };
  }

  async verifyotp(phone: string, otp: string) {
    const storedotp = await redisClient.get(`otp:${phone}`);
    
    if (storedotp !== otp) {
      throw new Error('Invalid otp');
    }
    
    let user = await userRepo.findByPhone(phone);
    
    if (!user) {
      user = await userRepo.create({
        phone,
        name: `User_${phone.slice(-4)}`,
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string as string as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    await redisClient.del(`otp:${phone}`);
    
    return { user, token };
  }
}

export default AuthService;
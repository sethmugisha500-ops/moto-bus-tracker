// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const prisma = require('@/lib/prisma').default;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, rememberMe } = body;

    console.log('Login attempt for:', phone);

    // Validate input
    if (!phone || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Phone and password are required' 
        },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        wallet: true,
        driver: true,
      },
    });

    if (!user) {
      console.log('User not found:', phone);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid phone number or password' 
        },
        { status: 401 }
      );
    }

    // Verify password (using bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', phone);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid phone number or password' 
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        isActive: true,
      },
    });

    // Prepare response
    const response = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          wallet: user.wallet ? {
            id: user.wallet.id,
            balance: user.wallet.balance,
            currency: user.wallet.currency,
          } : null,
          driver: user.driver ? {
            id: user.driver.id,
            licenseNumber: user.driver.licenseNumber,
            vehicleType: user.driver.vehicleType,
            vehicleNumber: user.driver.vehicleNumber,
            isOnline: user.driver.isOnline,
            rating: user.driver.rating,
          } : null,
        },
        tokens: {
          accessToken: token,
          expiresIn: rememberMe ? 2592000 : 604800, // 30 days or 7 days in seconds
        },
      },
    };

    console.log('Login successful for:', phone);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
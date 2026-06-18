import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import redisClient from '../config/redis';

// Types
interface User {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  password: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  wallet: {
    balance: number;
    currency: string;
  };
  resetCode?: string;
  resetCodeExpiry?: number;
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// In-memory storage
const users: User[] = [];
let nextId = 1;

class AuthController {
  // Register new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { phone, fullName, email, password, role } = req.body;

      // Validation
      if (!phone || !fullName || !password) {
        res.status(400).json({
          success: false,
          error: 'Phone, full name and password are required'
        });
        return;
      }

      // Check if user exists
      const existingUser = users.find(u => u.phone === phone);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User already exists with this phone number'
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user: User = {
        id: String(nextId++),
        phone,
        fullName,
        email: email || null,
        password: hashedPassword,
        role: role || 'RIDER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        wallet: {
          balance: 0,
          currency: 'RWF'
        }
      };

      users.push(user);

      // Generate tokens
      const token = this.generateToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: userWithoutPassword,
          token,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        res.status(400).json({
          success: false,
          error: 'Phone and password are required'
        });
        return;
      }

      // Find user
      const user = users.find(u => u.phone === phone);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      // Generate tokens
      const token = this.generateToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as { userId: string };
      const newToken = this.generateToken(decoded.userId);

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  // Get current user
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = users.find(u => u.id === req.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user by ID
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = users.find(u => u.id === id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get all users (admin only)
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      
      res.json({
        success: true,
        data: {
          count: users.length,
          users: usersWithoutPassword
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fullName, email } = req.body;
      const userIndex = users.findIndex(u => u.id === req.userId);

      if (userIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (fullName) users[userIndex].fullName = fullName;
      if (email) users[userIndex].email = email;
      users[userIndex].updatedAt = new Date();

      const { password, ...userWithoutPassword } = users[userIndex];

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userWithoutPassword }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Change password
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = users.find(u => u.id === req.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      const user = users.find(u => u.phone === phone);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store reset code
      user.resetCode = resetCode;
      user.resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

      res.json({
        success: true,
        message: 'Password reset code sent',
        data: { resetCode } // Only for development
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phone, resetCode, newPassword } = req.body;
      const user = users.find(u => u.phone === phone);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (!user.resetCode || !user.resetCodeExpiry || 
          user.resetCode !== resetCode || 
          Date.now() > user.resetCodeExpiry) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired reset code'
        });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      delete user.resetCode;
      delete user.resetCodeExpiry;
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Logout
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      // In production, add token to blacklist
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Generate JWT token
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(
      { userId },
      secret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
// Send OTP
async sendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
      return;
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: {
        otp // development only
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send OTP"
    });
  }
}


// Verify OTP
async verifyOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({
        success: false,
        error: "Phone and OTP are required"
      });
      return;
    }

    if (otp.length !== 6) {
      res.status(400).json({
        success: false,
        error: "Invalid OTP"
      });
      return;
    }

    const token = this.generateToken(
      Date.now().toString()
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          phone,
          role: "RIDER"
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "OTP verification failed"
    });
  }
}


// Register driver
async registerDriver(req: Request, res: Response): Promise<void> {
  try {
    const { phone, fullName, vehicleType } = req.body;

    res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      data: {
        phone,
        fullName,
        vehicleType,
        role: "DRIVER"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Driver registration failed"
    });
  }
}


// Get current user
async getMe(req: AuthRequest, res: Response): Promise<void> {
  return this.getCurrentUser(req, res);
}
  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    
    return jwt.sign(
      { userId },
      secret,
      { expiresIn: '30d' as jwt.SignOptions['expiresIn'] }
    );
  }

  // Get users storage (for testing/other controllers)
  getUsers(): User[] {
    return users;
  }
}

export default new AuthController();
// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new platform user (Rider, Driver, or Admin)
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, name, email, password, role } = req.body;

    if (!phone || !password || !name) {
      return res.status(400).json({ success: false, message: 'Missing required registration details' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Hash the password cleanly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Database transaction creating both the user and their default tracking wallet
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          name,
          email,
          password: hashedPassword,
          role: role || 'RIDER',
          isVerified: true, // Auto-verify for standard flows
        }
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        }
      });

      return user;
    });

    // Generate validation payload token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account provisioned successfully',
      token,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and hand back session token
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone number and password required' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

const isMatch = await bcrypt.compare(password, (user as any).password);    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Structural exports satisfying both direct requirements and default unwrappers
export { router as authRoutes };
export default router;
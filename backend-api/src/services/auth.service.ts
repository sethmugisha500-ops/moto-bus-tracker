import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';

export class AuthService {
    async register(data: { phone: string; name: string; email?: string; password: string; role?: string }) {
        const existingUser = await prisma.user.findUnique({
            where: { phone: data.phone }
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                phone: data.phone,
                name: data.name,
                email: data.email || null,
                password: hashedPassword,
                role: (data.role as any) || 'RIDER',
                wallet: { create: { balance: 0 } }
            }
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    async login(identifier: string, password: string) {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ phone: identifier }, { email: identifier }]
            }
        });

        if (!user) throw new Error('Invalid credentials');

        const isValidPassword = await bcrypt.compare(password, user.password!);
        if (!isValidPassword) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    async getCurrentUser(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true, driver: true }
        });
    }
}

export const authService = new AuthService();
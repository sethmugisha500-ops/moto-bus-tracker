import { Request, Response } from 'express';

class AuthController {
  async getCurrentUser(req: Request, res: Response) {
    return res.json({
      success: true,
      user: (req as any).user || null
    });
  }

  async login(req: Request, res: Response) {
    return res.json({
      success: true,
      message: 'Login successful'
    });
  }

  async register(req: Request, res: Response) {
    return res.json({
      success: true,
      message: 'Registration successful'
    });
  }
}

export default new AuthController();
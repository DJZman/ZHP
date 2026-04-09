import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register / upsert user by phone number
router.post('/register', async (req: Request, res: Response) => {
  const { phone, displayName } = req.body as { phone: string; displayName: string };
  if (!phone || !displayName) {
    return res.status(400).json({ error: 'phone and displayName required' });
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({ data: { phone, displayName } });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  return res.json({ token, user: { id: user.id, phone: user.phone, displayName: user.displayName } });
});

// Login by phone (no OTP in this minimal version — add Twilio for production)
router.post('/login', async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  return res.json({ token, user: { id: user.id, phone: user.phone, displayName: user.displayName } });
});

// Update push tokens
router.put('/tokens', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { fcmToken, apnsToken } = req.body as { fcmToken?: string; apnsToken?: string };

    await prisma.user.update({
      where: { id: payload.userId },
      data: { fcmToken, apnsToken },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

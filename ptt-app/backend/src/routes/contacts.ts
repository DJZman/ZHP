import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

// Match a list of phone numbers against registered users
// Returns only the phones that have accounts (for privacy, no full list exposed)
router.post('/match', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { phones } = req.body as { phones: string[] };
  if (!Array.isArray(phones) || phones.length === 0) {
    return res.status(400).json({ error: 'phones array required' });
  }

  // Normalize phone numbers (strip spaces and dashes for comparison)
  const normalized = phones.map((p) => p.replace(/\D/g, ''));

  const users = await prisma.user.findMany({
    where: {
      phone: { in: normalized },
      id: { not: userId }, // exclude self
    },
    select: { id: true, phone: true, displayName: true, avatarUrl: true },
  });

  return res.json(users);
});

export default router;

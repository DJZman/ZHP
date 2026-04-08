import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

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

// List conversations for the current user
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const convos = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return res.json(convos);
});

// Find or create a DIRECT conversation between two users
router.post('/direct', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });

  // Check if a DIRECT conversation already exists between these two users
  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
    },
  });

  if (existing) return res.json(existing);

  const conversation = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
    },
  });

  return res.status(201).json(conversation);
});

// Create a GROUP conversation
router.post('/group', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, memberIds } = req.body as { name: string; memberIds: string[] };
  if (!name || !memberIds?.length) return res.status(400).json({ error: 'name and memberIds required' });

  const allMemberIds = Array.from(new Set([userId, ...memberIds]));

  const conversation = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      name,
      members: { create: allMemberIds.map((uid) => ({ userId: uid })) },
    },
    include: {
      members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
    },
  });

  return res.status(201).json(conversation);
});

// Get messages for a conversation (paginated)
router.get('/:id/messages', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  return res.json(messages.reverse());
});

export default router;

import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  // Socket server moved to separate websocket service per AGENTS.md
  logger.info('Socket endpoint shim hit — websocket moved to dedicated service');
  res.status(204).end();
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/socket:
 *   get:
 *     summary: Socket endpoint shim
 *     description: Legacy HTTP shim for the Socket.io service; no real socket traffic is handled here.
 *     responses:
 *       204:
 *         description: No content. Socket service is handled by the dedicated websocket service.
 */
export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  // Socket server moved to separate websocket service per AGENTS.md
  logger.info('Socket endpoint shim hit — websocket moved to dedicated service');
  res.status(204).end();
}

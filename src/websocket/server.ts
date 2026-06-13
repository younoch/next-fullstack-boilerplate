import http from 'http';
import { Server as IOServer } from 'socket.io';
import { logger } from '@/lib/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer();

const io = new IOServer(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
  },
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, '🔌 Websocket client connected');

  socket.on('task_status_update', (data) => {
    logger.info({ data }, '📥 Received task_status_update from worker');
    io.emit('task_finished', data);
  });
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, `🚀 Websocket server listening on ${PORT}`);
});

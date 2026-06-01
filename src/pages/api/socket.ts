import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiRequest, NextApiResponse } from "next";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/queue";

type TypedServer = IOServer<ClientToServerEvents, ServerToClientEvents>;

interface SocketServer extends HTTPServer {
  io?: TypedServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default function SocketHandler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  // যদি সকেট অলরেডি রানিং থাকে, নতুন করে ইনিশিয়েট করার দরকার নেই
  if (res.socket.server.io) {
    console.log("📡 Socket server is already running");
    res.end();
    return;
  }

  console.log("🚀 Initializing Socket.io server...");
  const io: TypedServer = new IOServer(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*", // ডকার কন্টেইনারগুলোর মধ্যকার যোগাযোগের জন্য সিওআরএস ওপেন রাখছি
    },
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // 👷 ওয়ার্কার থেকে আসা সফলতার মেসেজ রিসিভ করা
    socket.on("task_status_update", (data) => {
      console.log("📥 Broadcast from Worker received:", data);
      // ব্রাউজারে থাকা সব ইউজারকে রিয়েল-টাইমে পুশ করা
      io.emit("task_finished", data);
    });
  });

  res.end();
}

"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const socket = io(wsUrl || undefined, { transports: ['websocket'] });

    // ৩. ওয়ার্কারের পাঠানো 'task_finished' ইভেন্ট শোনা
    socket.on('task_finished', (data) => {
      setMessages((prev) => [...prev, `Task ${data.taskName} successfully processed!`]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>⚡ Real-time Queue Monitor</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index} style={{ color: 'green', fontWeight: 'bold' }}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
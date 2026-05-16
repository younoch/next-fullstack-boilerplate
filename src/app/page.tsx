"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // ১. প্রথমে নেক্সট জেএস-এর সকেট রুটটি হিট করে সার্ভার সচল করা
    fetch('/api/socket');

    // ২. সকেট কানেকশন ইনিশিয়েট করা
    const socket = io({
      path: '/api/socket',
    });

    socket.on('connect', () => {
      console.log('🟢 Connected to Web Socket Server');
    });

    // ৩. ওয়ার্কারের পাঠানো 'task_finished' ইভেন্ট শোনা
    socket.on('task_finished', (data) => {
      console.log('🎉 Live Update:', data);
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
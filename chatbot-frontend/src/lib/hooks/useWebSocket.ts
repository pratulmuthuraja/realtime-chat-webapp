import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Attempting WebSocket connection...');
    
    const socketInstance = io('http://192.168.0.2:1337', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket Connected!');
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('message', (message) => {
      console.log('Received message:', message);
      setLastMessage({
        ...message,
        id: Date.now().toString(),
        isFromUser: false
      });
    });

    setSocket(socketInstance);

    return () => {
      console.log('Cleaning up WebSocket connection...');
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!socket || !isConnected) {
      console.log('Cannot send message: not connected');
      return;
    }

    console.log('Sending message:', content);
    const message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isFromUser: true
    };

    socket.emit('message', message);
    setLastMessage(message);
  }, [socket, isConnected]);

  return { isConnected, sendMessage, lastMessage };
}
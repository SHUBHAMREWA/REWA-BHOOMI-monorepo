import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const DEFAULT_API_HOST = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'http://127.0.0.1:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_HOST;

export const initSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(API_URL, {
    auth: {
      token
    },
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

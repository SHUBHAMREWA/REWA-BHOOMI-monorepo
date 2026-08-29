import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Must match NEXT_PUBLIC_API_URL set in your production environment variables.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

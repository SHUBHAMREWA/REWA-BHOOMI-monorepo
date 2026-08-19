'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSocket, disconnectSocket, getSocket } from './socket';
import { Socket } from 'socket.io-client';


interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

import { useAuth } from '@/features/auth/AuthContext';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      const s = initSocket(accessToken);
      setSocket(s);

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));
    } else {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

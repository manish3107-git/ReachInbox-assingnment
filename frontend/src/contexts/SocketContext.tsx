import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('newEmail', (data) => {
      console.log('New email received:', data);
      toast.success(`New email: ${data.subject}`, {
        duration: 5000,
        position: 'top-right',
      });
    });

    newSocket.on('emailCategorized', (data) => {
      console.log('Email categorized:', data);
      if (data.category === 'Interested') {
        toast.success(`Email marked as Interested: ${data.subject}`, {
          duration: 5000,
          position: 'top-right',
        });
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

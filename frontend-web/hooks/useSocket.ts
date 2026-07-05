'use client';

import { useEffect, useState } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';

export const useSocket = (events?: Record<string, (data: any) => void>) => {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;
    const socket = socketService.connect(socketUrl, token);

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }

    return () => {
      if (events) {
        Object.keys(events).forEach((event) => {
          socket.off(event);
        });
      }
      socketService.disconnect();
    };
  }, [token, isAuthenticated]);

  return { isConnected, socket: socketService.getSocket() };
};
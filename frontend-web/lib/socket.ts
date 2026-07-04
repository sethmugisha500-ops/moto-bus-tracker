// socket.service.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private riderId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string, userId: string, riderId?: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.userId = userId;
    this.riderId = riderId || userId;

    console.log('🔌 Connecting to socket with:', { userId: this.userId, riderId: this.riderId });

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected with ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Join ALL relevant rooms
      this.joinRooms();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🟢 Socket reconnected after', attemptNumber, 'attempts');
      // Rejoin rooms on reconnect
      this.joinRooms();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private joinRooms() {
    if (!this.socket || !this.userId) {
      console.warn('Cannot join rooms: No socket or userId');
      return;
    }

    const rooms = [
      this.userId,
      `user_${this.userId}`,
      `user-${this.userId}`,
    ];

    if (this.riderId && this.riderId !== this.userId) {
      rooms.push(this.riderId);
      rooms.push(`rider_${this.riderId}`);
      rooms.push(`rider-${this.riderId}`);
    }

    console.log('🏠 Joining rooms:', rooms);

    rooms.forEach(room => {
      if (room) {
        this.socket!.emit('join', room);
        console.log(`✅ Joined room: ${room}`);
      }
    });

    // Also emit join-rider event if riderId exists
    if (this.riderId) {
      this.socket.emit('join-rider', this.riderId);
      console.log(`🚕 Joined rider room: ${this.riderId}`);
    }

    // Join all rooms with different prefixes for maximum compatibility
    if (this.userId) {
      this.socket.emit('join', `user-${this.userId}`);
      this.socket.emit('join', `passenger-${this.userId}`);
    }
  }

  // Add method to manually rejoin rooms (useful after certain events)
  rejoinRooms() {
    this.joinRooms();
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.riderId = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`);
      return false;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      console.log(`📡 Listening for ${event}`);
      this.socket.on(event, (data: any) => {
        console.log(`📥 Received ${event}:`, data);
        callback(data);
      });
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove specific event listener with callback
  removeListener(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.removeListener(event, callback);
    }
  }
}

export const socketService = new SocketService();
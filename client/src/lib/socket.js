import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Returns a shared, singleton Socket.IO client instance.
 * Automatically connects to backend port 5000 in development,
 * or the current origin in production.
 */
export function getSocket() {
  if (!socketInstance && typeof window !== 'undefined') {
    const socketUrl =
      window.location.port === '3000'
        ? 'http://localhost:5000'
        : window.location.origin;

    socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

import { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketIo = (socketIo: Server) => {
  io = socketIo;
};

export const getSocketIo = () => {
  if (!io) {
    throw new Error('Socket.io başlatılmadı!');
  }
  return io;
};

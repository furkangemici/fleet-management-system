import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import config from './config';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middlewares/errorMiddleware';

import { setSocketIo } from './services/socketService';
import notificationService from './services/notificationService';
import simulationService from './services/simulationService';

// Express App
const app: Application = express();
const server = http.createServer(app);

// Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setSocketIo(io);
simulationService.setSocketIo(io);
simulationService.startSimulation();

// Middlewares
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: ' Reeder Fleet Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
    },
  });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`Yeni bağlantı: ${socket.id}`);

  // Araç konum güncellemesi
  socket.on('vehicle:location', (data) => {
    // Tüm istemcilere yayınla
    io.emit('vehicle:location:update', data);
  });

  // Bildirim
  socket.on('notification:new', (data) => {
    io.emit('notification:received', data);
  });

  socket.on('disconnect', () => {
    console.log(`Bağlantı koptu: ${socket.id}`);
  });
});

// 404 Handler
app.use(notFoundMiddleware);

// Error Handler
app.use(errorMiddleware);

// Start Server
const startServer = async () => {
  try {
    // Veritabanına bağlan
    await connectDatabase();

    // Sunucuyu başlat
    server.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    Reeder Fleet Management System                       ║
║                                                           ║
║    Server:    http://localhost:${config.port}                   ║
║    Mode:      ${config.nodeEnv.padEnd(24)}           ║
║    Socket.io: Aktif                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu kapatıldı');
    process.exit(0);
  });
});

notificationService.startCronJobs();
startServer();

export { app, io };

// backend-api/src/server.ts
import dotenv from 'dotenv';

// ✅ Load .env FIRST - before any other imports
dotenv.config();

// ✅ Now import everything else
import { app, server, prisma } from './app';

const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';

// Debug - check if JWT_SECRET is loaded
console.log('🔑 JWT_SECRET loaded:', process.env.JWT_SECRET ? '✅ Yes' : '❌ No');
console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET ? '********' : '❌ Missing');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket available on port ${PORT}`);
});

export { app, server };
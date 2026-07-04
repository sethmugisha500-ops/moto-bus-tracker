// backend-api/src/server.ts
import dotenv from 'dotenv';
import { app, server, prisma, io } from './app';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';

// ─── Validate environment ──────────────────────────────────────────
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// ─── Graceful shutdown ──────────────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  const timeout = setTimeout(() => {
    console.error('⏰ Shutdown timeout - forcing exit');
    process.exit(1);
  }, 10000);

  try {
    io.close(() => {
      console.log('✅ Socket.IO closed');
    });
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    server.close(() => {
      console.log('✅ Server closed');
      clearTimeout(timeout);
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    clearTimeout(timeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Server error handling ──────────────────────────────────────────
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
  console.error('❌ Server error:', error);
});

// ─── Start server ────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket available on port ${PORT}`);
  console.log(`${'='.repeat(50)}\n`);
});

export { app, server, io };
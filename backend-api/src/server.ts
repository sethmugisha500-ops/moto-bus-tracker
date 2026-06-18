
import dotenv from 'dotenv';
import { app, server, prisma } from '../';

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Handle shutdown gracefully
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 WebSocket available on port ${PORT}`);
  console.log(`🔗 API URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost'}`);
});

export { app, server };
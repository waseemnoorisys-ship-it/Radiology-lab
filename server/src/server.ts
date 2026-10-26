import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function bootstrap() {
  try {
    console.log('[Server] Initializing Radiology Lab Server...');
    
    // Connect to MongoDB
    await connectDB();

    // Create and start Express server
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Radiology Lab API running on http://localhost:${env.PORT}`);
      console.log(`[Server] Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful Shutdown Handling
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown after 10 seconds if hanging
      setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('[Server] Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();

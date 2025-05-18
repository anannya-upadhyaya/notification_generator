// src/app.ts

import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { queueService } from './services/queueService';

export class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    this.app.use(helmet());

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('dev'));
    }
  }

  private configureRoutes(): void {
    // API routes
    this.app.use('/notifications', notificationRoutes);
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });
  }

  private configureErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  public async connectToDatabase(): Promise<void> {
    try {
      await mongoose.connect(config.mongo.uri);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await this.connectToDatabase();

      // Initialize queue service
      await queueService.initialize();

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      // Close MongoDB connection
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');

      // Close RabbitMQ connection
      await queueService.close();
    } catch (error) {
      console.error('Error during server shutdown:', error);
      process.exit(1);
    }
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  const app = new App();
  app.start();
  
  // Handle graceful shutdown
  const shutdownGracefully = async () => {
    console.log('Shutting down gracefully...');
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdownGracefully);
  process.on('SIGTERM', shutdownGracefully);
}

export default new App();

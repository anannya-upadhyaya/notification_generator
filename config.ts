// src/config/config.ts

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // RabbitMQ configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    queues: {
      notifications: 'notifications',
      failedNotifications: 'failed-notifications',
    },
    exchangeName: 'notification-exchange',
  },
  
  // Notification configuration
  notification: {
    maxRetries: 3,
    retryInterval: 5000, // 5 seconds
  },
  
  // Provider configuration (for real implementation, these would be API keys or credentials)
  providers: {
    email: {
      apiKey: process.env.EMAIL_API_KEY || 'mock-email-api-key',
      from: process.env.EMAIL_FROM || 'notifications@example.com',
    },
    sms: {
      accountSid: process.env.SMS_ACCOUNT_SID || 'mock-sms-account-sid',
      authToken: process.env.SMS_AUTH_TOKEN || 'mock-sms-auth-token',
      from: process.env.SMS_FROM || '+15551234567',
    },
    inApp: {
      enabled: true,
    },
  },
};

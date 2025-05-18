// src/services/queueService.ts

import * as amqp from 'amqplib';
import { config } from '../config/config';
import { INotification } from '../models/notification';

export class QueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async initialize(): Promise<void> {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Create exchange
      await this.channel.assertExchange(config.rabbitmq.exchangeName, 'direct', { durable: true });

      // Create queues
      await this.channel.assertQueue(config.rabbitmq.queues.notifications, { durable: true });
      await this.channel.assertQueue(config.rabbitmq.queues.failedNotifications, { durable: true });

      // Bind queues to exchange
      await this.channel.bindQueue(
        config.rabbitmq.queues.notifications,
        config.rabbitmq.exchangeName,
        'notification'
      );
      await this.channel.bindQueue(
        config.rabbitmq.queues.failedNotifications,
        config.rabbitmq.exchangeName,
        'failed'
      );

      console.log('[QueueService] Successfully connected to RabbitMQ');
    } catch (error) {
      console.error('[QueueService] Failed to initialize RabbitMQ:', error);
      throw error;
    }
  }

  async enqueueNotification(notification: INotification): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.initialize();
      }

      // Publish to the notifications queue
      return this.channel!.publish(
        config.rabbitmq.exchangeName,
        'notification',
        Buffer.from(JSON.stringify(notification)),
        { persistent: true }
      );
    } catch (error) {
      console.error('[QueueService] Failed to enqueue notification:', error);
      return false;
    }
  }

  async enqueueFailedNotification(notification: INotification): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.initialize();
      }

      // Publish to the failed notifications queue for retry
      return this.channel!.publish(
        config.rabbitmq.exchangeName,
        'failed',
        Buffer.from(JSON.stringify(notification)),
        { persistent: true }
      );
    } catch (error) {
      console.error('[QueueService] Failed to enqueue failed notification:', error);
      return false;
    }
  }

  async consumeNotifications(callback: (notification: INotification) => Promise<void>): Promise<void> {
    try {
      if (!this.channel) {
        await this.initialize();
      }

      // Consume messages from the notifications queue
      await this.channel!.consume(
        config.rabbitmq.queues.notifications,
        async (msg) => {
          if (msg) {
            try {
              const notification: INotification = JSON.parse(msg.content.toString());
              await callback(notification);
              this.channel!.ack(msg);
            } catch (error) {
              console.error('[QueueService] Error processing notification:', error);
              // Negative acknowledge the message, sending it back to the queue
              this.channel!.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      console.log('[QueueService] Started consuming notifications');
    } catch (error) {
      console.error('[QueueService] Failed to consume notifications:', error);
      throw error;
    }
  }

  async consumeFailedNotifications(callback: (notification: INotification) => Promise<void>): Promise<void> {
    try {
      if (!this.channel) {
        await this.initialize();
      }

      // Consume messages from the failed notifications queue
      await this.channel!.consume(
        config.rabbitmq.queues.failedNotifications,
        async (msg) => {
          if (msg) {
            try {
              const notification: INotification = JSON.parse(msg.content.toString());
              await callback(notification);
              this.channel!.ack(msg);
            } catch (error) {
              console.error('[QueueService] Error processing failed notification:', error);
              // Negative acknowledge the message, sending it back to the queue
              this.channel!.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      console.log('[QueueService] Started consuming failed notifications');
    } catch (error) {
      console.error('[QueueService] Failed to consume failed notifications:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('[QueueService] Closed RabbitMQ connection');
    } catch (error) {
      console.error('[QueueService] Error closing RabbitMQ connection:', error);
    }
  }
}

// Export a singleton instance
export const queueService = new QueueService();

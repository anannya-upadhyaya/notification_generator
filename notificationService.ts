/ src/services/notificationService.ts

import { 
  Notification, 
  NotificationType, 
  NotificationStatus, 
  INotification, 
  CreateNotificationDto,
  NotificationResponseDto,
  INotificationDocument
} from '../models/notification';
import { queueService } from './queueService';
import { EmailProvider } from './providers/emailProvider';
import { SmsProvider } from './providers/smsProvider';
import { InAppProvider } from './providers/inAppProvider';
import { config } from '../config/config';
import mongoose from 'mongoose';

export class NotificationService {
  private emailProvider: EmailProvider;
  private smsProvider: SmsProvider;
  private inAppProvider: InAppProvider;

  constructor() {
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SmsProvider();
    this.inAppProvider = new InAppProvider();

    // Setup notification processing
    this.setupNotificationProcessing();
  }

  async createNotification(data: CreateNotificationDto): Promise<NotificationResponseDto> {
    try {
      // Create a new notification
      const notification = new Notification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
        status: NotificationStatus.PENDING,
        retryCount: 0
      });

      // Save notification to database
      await notification.save();

      // Enqueue notification for processing
      await queueService.enqueueNotification(notification.toObject());

      // Return response
      return this.mapToResponseDto(notification);
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
    try {
      // Find notifications for the user
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .exec();

      // Map to response DTOs
      return notifications.map(notification => this.mapToResponseDto(notification));
    } catch (error) {
      console.error(`[NotificationService] Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  private async setupNotificationProcessing(): Promise<void> {
    try {
      // Initialize queue service
      await queueService.initialize();

      // Start consuming notifications
      await queueService.consumeNotifications(async (notification) => {
        await this.processNotification(notification);
      });

      // Start consuming failed notifications
      await queueService.consumeFailedNotifications(async (notification) => {
        await this.processFailedNotification(notification);
      });
    } catch (error) {
      console.error('[NotificationService] Error setting up notification processing:', error);
      throw error;
    }
  }

  private async processNotification(notification: INotification): Promise<void> {
    try {
      console.log(`[NotificationService] Processing notification ${notification._id} for user ${notification.userId}`);
      
      let success = false;

      // Process based on notification type
      switch (notification.type) {
        case NotificationType.EMAIL:
          success = await this.emailProvider.send(notification);
          break;
        case NotificationType.SMS:
          success = await this.smsProvider.send(notification);
          break;
        case NotificationType.IN_APP:
          success = await this.inAppProvider.send(notification);
          break;
        default:
          console.error(`[NotificationService] Unknown notification type: ${notification.type}`);
          success = false;
      }

      if (success) {
        // Update notification status
        await Notification.findByIdAndUpdate(
          notification._id,
          {
            status: NotificationStatus.SENT,
            sentAt: new Date()
          }
        );
        console.log(`[NotificationService] Successfully sent notification ${notification._id}`);
      } else {
        // Handle failure
        await this.handleFailedNotification(notification);
      }
    } catch (error) {
      console.error(`[NotificationService] Error processing notification ${notification._id}:`, error);
      await this.handleFailedNotification(notification);
    }
  }

  private async processFailedNotification(notification: INotification): Promise<void> {
    try {
      // Increment retry count
      const retryCount = notification.retryCount + 1;
      
      // Check if max retries reached
      if (retryCount > config.notification.maxRetries) {
        await Notification.findByIdAndUpdate(
          notification._id,
          {
            status: NotificationStatus.FAILED,
            retryCount
          }
        );
        console.log(`[NotificationService] Max retries reached for notification ${notification._id}. Marking as failed.`);
        return;
      }

      // Update notification status and retry count
      await Notification.findByIdAndUpdate(
        notification._id,
        {
          status: NotificationStatus.RETRYING,
          retryCount
        }
      );

      // Wait for retry interval
      await new Promise(resolve => setTimeout(resolve, config.notification.retryInterval));

      // Get updated notification from database
      const updatedNotification = await Notification.findById(notification._id);
      if (!updatedNotification) {
        console.error(`[NotificationService] Notification ${notification._id} not found during retry.`);
        return;
      }

      // Retry sending the notification
      await this.processNotification(updatedNotification.toObject());
    } catch (error) {
      console.error(`[NotificationService] Error processing failed notification ${notification._id}:`, error);
      // In case of error during retry handling, mark as failed
      await Notification.findByIdAndUpdate(
        notification._id,
        {
          status: NotificationStatus.FAILED
        }
      );
    }
  }

  private async handleFailedNotification(notification: INotification): Promise<void> {
    try {
      // Update notification status
      await Notification.findByIdAndUpdate(
        notification._id,
        {
          status: NotificationStatus.RETRYING
        }
      );

      // Enqueue for retry
      await queueService.enqueueFailedNotification(notification);
      console.log(`[NotificationService] Enqueued notification ${notification._id} for retry.`);
    } catch (error) {
      console.error(`[NotificationService] Error handling failed notification ${notification._id}:`, error);
      throw error;
    }
  }

  private mapToResponseDto(notification: INotificationDocument): NotificationResponseDto {
    return {
      id: notification._id.toString(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      status: notification.status,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt
    };
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();

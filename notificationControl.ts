// src/controllers/notificationController.ts

import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { CreateNotificationDto, NotificationType } from '../models/notification';

export class NotificationController {
  /**
   * Send a notification
   * POST /notifications
   */
  async sendNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, type, title, content, metadata } = req.body;

      // Validate required fields
      if (!userId || !type || !title || !content) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: userId, type, title, and content are required'
        });
      }

      // Validate notification type
      if (!Object.values(NotificationType).includes(type)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid notification type. Must be one of: ${Object.values(NotificationType).join(', ')}`
        });
      }

      // Create notification DTO
      const notificationDto: CreateNotificationDto = {
        userId,
        type,
        title,
        content,
        metadata
      };

      // Create and send notification
      const notification = await notificationService.createNotification(notificationDto);

      // Return success response
      return res.status(201).json({
        status: 'success',
        data: notification
      });
    } catch (error) {
      console.error('[NotificationController] Error sending notification:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send notification'
      });
    }
  }

  /**
   * Get user notifications
   * GET /users/:id/notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { id: userId } = req.params;

      // Validate user ID
      if (!userId) {
        return res.status(400).json({
          status: 'error',
          message: 'User ID is required'
        });
      }

      // Get notifications for user
      const notifications = await notificationService.getUserNotifications(userId);

      // Return success response
      return res.status(200).json({
        status: 'success',
        data: notifications
      });
    } catch (error) {
      console.error('[NotificationController] Error getting user notifications:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to get user notifications'
      });
    }
  }
}

// Export a singleton instance
export const notificationController = new NotificationController();

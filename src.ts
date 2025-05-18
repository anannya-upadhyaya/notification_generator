// src/models/notification.ts

import mongoose, { Document, Schema } from 'mongoose';

// Notification types
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app'
}

// Notification status
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// Notification interface
export interface INotification {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

// Notification document interface (for MongoDB)
export interface INotificationDocument extends INotification, Document {}

// Create notification schema
const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    retryCount: {
      type: Number,
      default: 0
    },
    sentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Create notification model
export const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  NotificationSchema
);

// DTO for creating a notification
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

// DTO for notification response
export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
}

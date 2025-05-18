// src/routes/notificationRoutes.ts

import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';

const router = Router();

/**
 * @route   POST /notifications
 * @desc    Send a notification
 * @access  Public (In a real app, this would be protected)
 */
router.post('/', notificationController.sendNotification.bind(notificationController));

/**
 * @route   GET /users/:id/notifications
 * @desc    Get user notifications
 * @access  Public (In a real app, this would be protected)
 */
router.get('/users/:id/notifications', notificationController.getUserNotifications.bind(notificationController));

export default router;

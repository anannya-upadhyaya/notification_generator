// src/services/providers/emailProvider.ts

import { config } from '../../config/config';
import { INotification } from '../../models/notification';

export class EmailProvider {
  async send(notification: INotification): Promise<boolean> {
    try {
      // In a real implementation, this would use an actual email service like Nodemailer, SendGrid, etc.
      console.log(`[EmailProvider] Sending email to user ${notification.userId}`);
      console.log(`[EmailProvider] From: ${config.providers.email.from}`);
      console.log(`[EmailProvider] Subject: ${notification.title}`);
      console.log(`[EmailProvider] Content: ${notification.content}`);
      
      // Simulate a successful email sending
      // In production, replace with actual API call to email provider
      await this.mockEmailSending();
      
      return true;
    } catch (error) {
      console.error('[EmailProvider] Error sending email:', error);
      return false;
    }
  }

  private async mockEmailSending(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Randomly fail some notifications to demonstrate retry mechanism
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Mock email sending failed');
    }
  }
}

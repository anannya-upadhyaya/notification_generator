// src/services/providers/smsProvider.ts

import { config } from '../../config/config';
import { INotification } from '../../models/notification';

export class SmsProvider {
  async send(notification: INotification): Promise<boolean> {
    try {
      // In a real implementation, this would use an actual SMS service like Twilio, Nexmo, etc.
      console.log(`[SmsProvider] Sending SMS to user ${notification.userId}`);
      console.log(`[SmsProvider] From: ${config.providers.sms.from}`);
      console.log(`[SmsProvider] Content: ${notification.content}`);
      
      // Extract phone number from metadata or use a default (normally this would be from a user record)
      const phoneNumber = notification.metadata?.phoneNumber || '+15551234567';
      console.log(`[SmsProvider] To: ${phoneNumber}`);
      
      // Simulate a successful SMS sending
      // In production, replace with actual API call to SMS provider
      await this.mockSmsSending();
      
      return true;
    } catch (error) {
      console.error('[SmsProvider] Error sending SMS:', error);
      return false;
    }
  }

  private async mockSmsSending(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Randomly fail some notifications to demonstrate retry mechanism
    if (Math.random() < 0.15) { // 15% failure rate
      throw new Error('Mock SMS sending failed');
    }
  }
}

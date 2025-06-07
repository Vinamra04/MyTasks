import * as Notifications from 'expo-notifications';
import { Task, NotificationData } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    try {
      if (this.initialized) return true;

      // Check if we're in Expo Go (which has limited notification support)
      const isExpoGo = __DEV__ && typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
      
      if (isExpoGo) {
        console.warn('Running in Expo Go - notifications may have limited functionality');
        // Still try to initialize for local notifications
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        this.initialized = true; // Still mark as initialized to prevent repeated attempts
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Notifications not available in this environment:', error.message);
      this.initialized = true; // Mark as initialized to prevent repeated attempts
      return false;
    }
  }

  async scheduleTaskNotification(task: Task, delayMinutes: number = 0): Promise<string | null> {
    try {
      await this.initialize();

      if (!task.reminderTime && delayMinutes === 0) {
        console.warn('No reminder time set for task and no delay provided');
        return null;
      }

      // Calculate trigger time
      let triggerTime: Date;
      if (task.reminderTime) {
        triggerTime = new Date(task.reminderTime);
      } else {
        triggerTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      }

      // Don't schedule notifications for past times
      if (triggerTime <= new Date()) {
        console.warn('Cannot schedule notification for past time');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Reminder',
          body: `Don't forget: ${task.title}`,
          data: {
            taskId: task.id,
            priority: task.priority,
          },
          sound: true,
        },
        trigger: {
          date: triggerTime,
        },
      });

      console.log(`Scheduled notification ${notificationId} for task: ${task.title}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  async cancelTaskNotification(task: Task): Promise<boolean> {
    if (!task.notificationId) return true;
    return await this.cancelNotification(task.notificationId);
  }

  async rescheduleTaskNotification(task: Task, delayMinutes: number = 0): Promise<string | null> {
    // Cancel existing notification if it exists
    if (task.notificationId) {
      await this.cancelNotification(task.notificationId);
    }

    // Schedule new notification
    return await this.scheduleTaskNotification(task, delayMinutes);
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  async scheduleDailyReminder(time: string): Promise<string | null> {
    try {
      await this.initialize();

      // Parse time string (HH:MM format)
      const [hours, minutes] = time.split(':').map(Number);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Daily Task Reminder',
          body: 'Time to check your tasks and plan your day!',
          data: { type: 'daily_reminder' },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log(`Scheduled daily reminder at ${time}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  // Utility method to create notification data
  createNotificationData(task: Task, triggerTime: Date): NotificationData {
    return {
      taskId: task.id,
      title: '📋 Task Reminder',
      body: `Don't forget: ${task.title}`,
      trigger: triggerTime,
    };
  }

  // Method to handle notification responses (when user taps notification)
  setupNotificationListener(onNotificationReceived: (notification: Notifications.Notification) => void) {
    const subscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
    return subscription;
  }

  setupNotificationResponseListener(onNotificationResponse: (response: Notifications.NotificationResponse) => void) {
    const subscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
    return subscription;
  }

  // Format time for display
  formatNotificationTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Check if notification permissions are granted
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Get badge count (if supported)
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<boolean> {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('Error setting badge count:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 
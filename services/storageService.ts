import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, AppSettings, STORAGE_KEYS, TaskStats, TaskStatus, TaskPriority } from '../types';
import { defaultSettings } from '../constants/theme';

class StorageService {
  // Task Management
  async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (!tasksJson) return [];
      
      const tasks = JSON.parse(tasksJson);
      // Convert date strings back to Date objects
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        reminderTime: task.reminderTime ? new Date(task.reminderTime) : undefined,
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<boolean> {
    try {
      const tasksJson = JSON.stringify(tasks);
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, tasksJson);
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  }

  async addTask(task: Task): Promise<boolean> {
    try {
      const tasks = await this.getTasks();
      tasks.push(task);
      return await this.saveTasks(tasks);
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const tasks = await this.getTasks();
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) return false;
      
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updates,
        updatedAt: new Date(),
      };
      
      return await this.saveTasks(tasks);
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const tasks = await this.getTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      return await this.saveTasks(filteredTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const tasks = await this.getTasks();
      return tasks.find(task => task.id === taskId) || null;
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return null;
    }
  }

  // Task Statistics
  async getTaskStats(): Promise<TaskStats> {
    try {
      const tasks = await this.getTasks();
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const stats: TaskStats = {
        total: tasks.length,
        completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
        pending: tasks.filter(task => task.status === TaskStatus.PENDING).length,
        highPriority: tasks.filter(task => 
          task.priority === TaskPriority.HIGH && task.status === TaskStatus.PENDING
        ).length,
        dueSoon: tasks.filter(task => 
          task.dueDate && 
          task.dueDate <= tomorrow && 
          task.status === TaskStatus.PENDING
        ).length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return { total: 0, completed: 0, pending: 0, highPriority: 0, dueSoon: 0 };
    }
  }

  // Settings Management
  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!settingsJson) return defaultSettings;
      
      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, settingsJson);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };
      return await this.saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  // App State Management
  async isFirstLaunch(): Promise<boolean> {
    try {
      const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      return firstLaunch === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true;
    }
  }

  async setFirstLaunchComplete(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
      return true;
    } catch (error) {
      console.error('Error setting first launch complete:', error);
      return false;
    }
  }

  // Utility Methods
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.SETTINGS,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  async getNextReminder(): Promise<Date | null> {
    try {
      const tasks = await this.getTasks();
      const now = new Date();
      
      const upcomingReminders = tasks
        .filter(task => 
          task.reminderTime && 
          task.reminderTime > now && 
          task.status === TaskStatus.PENDING
        )
        .sort((a, b) => {
          if (!a.reminderTime || !b.reminderTime) return 0;
          return a.reminderTime.getTime() - b.reminderTime.getTime();
        });
      
      return upcomingReminders.length > 0 ? upcomingReminders[0].reminderTime! : null;
    } catch (error) {
      console.error('Error getting next reminder:', error);
      return null;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService(); 
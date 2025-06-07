// Task Priority Levels
export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Task Status
export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

// Main Task Interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  reminderTime?: Date;
  notificationId?: string;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    priority: {
      high: string;
      medium: string;
      low: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
    };
    button: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
  };
}

// Settings Interface
export interface AppSettings {
  notificationDelay: number; // in minutes
  themeMode: ThemeMode;
  enableNotifications: boolean;
  dailyReminderTime?: string; // HH:MM format
}

// Storage Keys
export const STORAGE_KEYS = {
  TASKS: '@my_tasks_app:tasks',
  SETTINGS: '@my_tasks_app:settings',
  FIRST_LAUNCH: '@my_tasks_app:first_launch',
} as const;

// Navigation Types (extending the existing ones)
export type RootStackParamList = {
  Welcome: undefined;
  Tasks: undefined;
  TaskDetails: { taskId?: string; isEditing?: boolean };
  Settings: undefined;
};

// API Response Types
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  dueSoon: number;
}

// Form Types
export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: Date;
  reminderTime?: Date;
}

// Notification Types
export interface NotificationData {
  taskId: string;
  title: string;
  body: string;
  trigger: Date;
} 
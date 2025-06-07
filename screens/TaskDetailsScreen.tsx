import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components & Services
import Button from '../components/Button';
import Input from '../components/Input';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { RootStackParamList, Task, TaskPriority, TaskStatus } from '../types';
import { shadows } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

type TaskDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: Date;
  reminderTime?: Date;
  status: TaskStatus;
}

export default function TaskDetailsScreen() {
  const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
  const route = useRoute<TaskDetailsScreenRouteProp>();
  const { theme } = useTheme();

  const { taskId, isEditing } = route.params || {};
  const isNewTask = !taskId;

  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormState>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
  });
  const [errors, setErrors] = useState<Partial<TaskFormState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Date picker state
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);

  // Load task data if editing
  useFocusEffect(
    useCallback(() => {
      if (taskId) {
        loadTask();
      } else {
        // New task - set default reminder time to 1 hour from now
        const defaultReminder = new Date();
        defaultReminder.setHours(defaultReminder.getHours() + 1);
        setFormData(prev => ({ ...prev, reminderTime: defaultReminder }));
      }
    }, [taskId])
  );

  // Update header title
  useEffect(() => {
    navigation.setOptions({
      title: isNewTask ? 'New Task' : 'Edit Task',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.button.primary }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isNewTask, saving, formData]);

  const loadTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const loadedTask = await storageService.getTaskById(taskId);
      
      if (loadedTask) {
        setTask(loadedTask);
        setFormData({
          title: loadedTask.title,
          description: loadedTask.description || '',
          priority: loadedTask.priority,
          dueDate: loadedTask.dueDate,
          reminderTime: loadedTask.reminderTime,
          status: loadedTask.status,
        });
        setEnableReminder(!!loadedTask.reminderTime);
      } else {
        Alert.alert('Error', 'Task not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormState> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
        reminderTime: enableReminder ? formData.reminderTime : undefined,
      };

      let success = false;
      let updatedTask: Task;

      if (isNewTask) {
        // Create new task
        updatedTask = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        success = await storageService.addTask(updatedTask);
      } else {
        // Update existing task
        updatedTask = {
          ...task!,
          ...taskData,
          updatedAt: new Date(),
        };
        success = await storageService.updateTask(task!.id, taskData);
      }

      if (success) {
        // Handle notifications
        try {
          if (enableReminder && formData.reminderTime) {
            // Cancel existing notification if any
            if (task?.notificationId) {
              await notificationService.cancelNotification(task.notificationId);
            }
            
            // Schedule new notification
            const notificationId = await notificationService.scheduleTaskNotification(updatedTask);
            if (notificationId) {
              await storageService.updateTask(updatedTask.id, { notificationId });
            }
          } else if (task?.notificationId) {
            // Remove notification if reminder disabled
            await notificationService.cancelNotification(task.notificationId);
            await storageService.updateTask(updatedTask.id, { notificationId: undefined });
          }
        } catch (notificationError) {
          console.warn('Notification error:', notificationError);
          // Task still saved successfully
        }

        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;

    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel notification if exists
              if (task.notificationId) {
                await notificationService.cancelNotification(task.notificationId);
              }

              const success = await storageService.deleteTask(task.id);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to delete task');
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.HIGH:
        return theme.colors.priority.high;
      case TaskPriority.MEDIUM:
        return theme.colors.priority.medium;
      case TaskPriority.LOW:
        return theme.colors.priority.low;
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    return status === TaskStatus.COMPLETED 
      ? theme.colors.status.success 
      : theme.colors.status.warning;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading task...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Basic Information
            </Text>

            <Input
              label="Task Title"
              value={formData.title}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, title: text }));
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="Enter task title..."
              error={errors.title}
              maxLength={100}
            />

            <Input
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Add task details..."
              variant="textarea"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Priority Level
            </Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor: formData.priority === priority
                        ? getPriorityColor(priority)
                        : theme.colors.surface,
                      borderColor: getPriorityColor(priority),
                      borderWidth: formData.priority === priority ? 0 : 1,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priority }))}
                >
                  <Ionicons
                    name={priority === TaskPriority.HIGH ? 'flame' : priority === TaskPriority.MEDIUM ? 'warning' : 'leaf'}
                    size={20}
                    color={formData.priority === priority ? theme.colors.text.primary : getPriorityColor(priority)}
                  />
                  <Text
                    style={[
                      styles.priorityButtonText,
                      {
                        color: formData.priority === priority ? theme.colors.text.primary : getPriorityColor(priority),
                      },
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status (only for existing tasks) */}
          {!isNewTask && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Status
              </Text>
              <View style={styles.statusContainer}>
                {Object.values(TaskStatus).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: formData.status === status
                          ? getStatusColor(status)
                          : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, status }))}
                  >
                    <Ionicons
                      name={status === TaskStatus.COMPLETED ? 'checkmark-circle' : 'time'}
                      size={20}
                      color={formData.status === status ? theme.colors.text.primary : getStatusColor(status)}
                    />
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color: formData.status === status ? theme.colors.text.primary : getStatusColor(status),
                        },
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Due Date */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Due Date (Optional)
            </Text>
            
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={theme.colors.button.primary} />
              <Text style={[styles.dateButtonText, { color: theme.colors.text.primary }]}>
                {formData.dueDate ? formatDate(formData.dueDate) : 'Set due date'}
              </Text>
              {formData.dueDate && (
                <TouchableOpacity
                  onPress={() => setFormData(prev => ({ ...prev, dueDate: undefined }))}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <View style={styles.reminderHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Reminder
              </Text>
              <Switch
                value={enableReminder}
                onValueChange={setEnableReminder}
                trackColor={{
                  false: theme.colors.surface,
                  true: theme.colors.button.primary + '40',
                }}
                thumbColor={enableReminder ? theme.colors.button.primary : theme.colors.text.secondary}
              />
            </View>

            {enableReminder && (
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => setShowReminderPicker(true)}
              >
                <Ionicons name="notifications" size={20} color={theme.colors.button.primary} />
                <Text style={[styles.dateButtonText, { color: theme.colors.text.primary }]}>
                  {formData.reminderTime ? formatTime(formData.reminderTime) : 'Set reminder time'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              title={isNewTask ? "Create Task" : "Save Changes"}
              onPress={handleSave}
              loading={saving}
              fullWidth
              style={styles.saveButton}
            />

            {!isNewTask && (
              <Button
                title="Delete Task"
                onPress={handleDelete}
                variant="outline"
                style={{
                  ...styles.deleteButton,
                  borderColor: theme.colors.status.error,
                }}
                textStyle={{ color: theme.colors.status.error }}
                fullWidth
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showDueDatePicker && (
        <DateTimePicker
          value={formData.dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDueDatePicker(false);
            if (selectedDate) {
              setFormData(prev => ({ ...prev, dueDate: selectedDate }));
            }
          }}
        />
      )}

      {showReminderPicker && (
        <DateTimePicker
          value={formData.reminderTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowReminderPicker(false);
            if (selectedDate) {
              // Keep today's date but use the selected time
              const today = new Date();
              const selectedTime = new Date(selectedDate);
              const reminderTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                selectedTime.getHours(),
                selectedTime.getMinutes()
              );
              setFormData(prev => ({ ...prev, reminderTime }));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...shadows.small,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    ...shadows.small,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionsSection: {
    marginTop: 32,
    gap: 16,
  },
  saveButton: {
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

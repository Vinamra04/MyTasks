import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus } from '../types';
import { shadows } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggleComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  style?: ViewStyle;
  showActions?: boolean;
}

export default function TaskCard({
  task,
  onPress,
  onToggleComplete,
  onDelete,
  style,
  showActions = true,
}: TaskCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleToggleComplete = () => {
    if (!onToggleComplete) return;

    // Animate the completion toggle
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleComplete(task);
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.HIGH:
        return theme.colors.priority.high;
      case TaskPriority.MEDIUM:
        return theme.colors.priority.medium;
      case TaskPriority.LOW:
        return theme.colors.priority.low;
      default:
        return theme.colors.priority.low;
    }
  };

  const getPriorityIcon = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'flame';
      case TaskPriority.MEDIUM:
        return 'warning';
      case TaskPriority.LOW:
        return 'leaf';
      default:
        return 'leaf';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.dueDate && task.dueDate < new Date() && !isCompleted;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.card,
            borderLeftColor: getPriorityColor(task.priority),
            opacity: isCompleted ? 0.7 : 1,
          },
          isOverdue && {
            borderColor: theme.colors.status.error,
            borderWidth: 1,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Priority Indicator */}
        <View style={styles.priorityIndicator}>
          <Ionicons
            name={getPriorityIcon(task.priority) as any}
            size={16}
            color={getPriorityColor(task.priority)}
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.text.primary },
                isCompleted && styles.completedText,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            
            {showActions && onToggleComplete && (
              <TouchableOpacity
                onPress={handleToggleComplete}
                style={styles.checkButton}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isCompleted ? theme.colors.status.success : theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {task.description && (
            <Text
              style={[
                styles.description,
                { color: theme.colors.text.secondary },
                isCompleted && styles.completedText,
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          {/* Footer with dates and actions */}
          <View style={styles.footer}>
            <View style={styles.dateInfo}>
              {task.dueDate && (
                <Text
                  style={[
                    styles.dateText,
                    { color: isOverdue ? theme.colors.status.error : theme.colors.text.secondary },
                  ]}
                >
                  📅 {formatDate(task.dueDate)}
                </Text>
              )}
              
              {task.reminderTime && (
                <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>
                  🔔 {task.reminderTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              )}
            </View>

            {showActions && onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(task)}
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={theme.colors.status.error}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 6,
    ...shadows.small,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
}); 
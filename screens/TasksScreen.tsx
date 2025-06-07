import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import TaskCard from '../components/TaskCard';
import Button from '../components/Button';
import Input from '../components/Input';

// Services & Types
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { Task, TaskPriority, TaskStatus, RootStackParamList } from '../types';
import { shadows } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
}

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tasks'>;

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
  });
  const [formErrors, setFormErrors] = useState<Partial<TaskFormData>>({});

  // Animations
  const fabAnim = useRef(new Animated.Value(1)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  // Set up header with Settings button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerButton}
        >
          <Ionicons name="settings" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.colors.text.primary]);

  // Also set header on focus to ensure it's always there
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerButton}
          >
            <Ionicons name="settings" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ),
      });
    }, [navigation, theme.colors.text.primary])
  );

  // Load tasks when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  // Filter tasks when search or filters change
  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedPriority, showCompleted]);

  // Animate list on mount
  useEffect(() => {
    if (!loading) {
      Animated.spring(listAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const loadedTasks = await storageService.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filter by priority
    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== TaskStatus.COMPLETED);
    }

    // Sort by priority (High -> Medium -> Low) and creation date
    filtered.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredTasks(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleAddTask = async () => {
    // Validate form
    const errors: Partial<TaskFormData> = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to storage
      const success = await storageService.addTask(newTask);
      if (success) {
        // Try to schedule notification (30 minutes from now as default)
        try {
          const notificationId = await notificationService.scheduleTaskNotification(
            newTask,
            30 // 30 minutes delay
          );
          
          if (notificationId) {
            newTask.notificationId = notificationId;
            await storageService.updateTask(newTask.id, { notificationId });
          }
        } catch (notificationError) {
          console.warn('Could not schedule notification for task:', notificationError);
          // Task still gets created successfully, just without notification
        }

        // Update UI
        setTasks(prev => [newTask, ...prev]);
        
        // Reset form and close modal
        setFormData({ title: '', description: '', priority: TaskPriority.MEDIUM });
        setFormErrors({});
        setIsAddModalVisible(false);

        // Animate FAB
        Animated.sequence([
          Animated.spring(fabAnim, { toValue: 1.1, useNativeDriver: true }),
          Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      } else {
        Alert.alert('Error', 'Failed to add task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === TaskStatus.COMPLETED 
        ? TaskStatus.PENDING 
        : TaskStatus.COMPLETED;

      const success = await storageService.updateTask(task.id, { 
        status: newStatus 
      });

      if (success) {
        // Try to cancel notification if task is completed
        if (newStatus === TaskStatus.COMPLETED && task.notificationId) {
          try {
            await notificationService.cancelNotification(task.notificationId);
          } catch (notificationError) {
            console.warn('Could not cancel notification:', notificationError);
            // Task completion still works, just notification might remain
          }
        }

        // Update UI
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date() } : t
          )
        );
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async (task: Task) => {
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
              // Try to cancel notification if exists
              if (task.notificationId) {
                try {
                  await notificationService.cancelNotification(task.notificationId);
                } catch (notificationError) {
                  console.warn('Could not cancel notification:', notificationError);
                  // Task deletion still works
                }
              }

              const success = await storageService.deleteTask(task.id);
              if (success) {
                setTasks(prev => prev.filter(t => t.id !== task.id));
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

  const renderTaskItem = ({ item, index }: { item: Task; index: number }) => (
    <Animated.View
      style={{
        opacity: listAnim,
        transform: [
          {
            translateY: listAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      }}
    >
      <TaskCard
        task={item}
        onPress={() => navigation.navigate('TaskDetails', { taskId: item.id, isEditing: true })}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteTask}
        style={{ marginHorizontal: 16 }}
      />
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="clipboard-outline"
        size={64}
        color={theme.colors.text.secondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        No tasks yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        Tap the + button to create your first task
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tasks..."
        variant="search"
        icon="search"
        style={styles.searchInput}
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'ALL', label: 'All', count: tasks.length },
            { key: 'HIGH', label: 'High', count: tasks.filter(t => t.priority === TaskPriority.HIGH).length },
            { key: 'MEDIUM', label: 'Medium', count: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length },
            { key: 'LOW', label: 'Low', count: tasks.filter(t => t.priority === TaskPriority.LOW).length },
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedPriority === item.key 
                    ? theme.colors.button.primary 
                    : theme.colors.surface,
                },
              ]}
              onPress={() => setSelectedPriority(item.key as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedPriority === item.key 
                      ? theme.colors.text.primary 
                      : theme.colors.text.secondary,
                  },
                ]}
              >
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Toggle Completed */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowCompleted(!showCompleted)}
      >
        <Ionicons
          name={showCompleted ? 'eye' : 'eye-off'}
          size={20}
          color={theme.colors.text.secondary}
        />
        <Text style={[styles.toggleButtonText, { color: theme.colors.text.secondary }]}>
          {showCompleted ? 'Hide' : 'Show'} completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredTasks.length === 0 && styles.centerContent,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.button.primary]}
            tintColor={theme.colors.button.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          { transform: [{ scale: fabAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: theme.colors.button.primary }]}
          onPress={() => navigation.navigate('TaskDetails', { isEditing: false })}
        >
          <Ionicons name="add" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Add Task Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.surface }]}>
            <TouchableOpacity
              onPress={() => {
                setIsAddModalVisible(false);
                setFormData({ title: '', description: '', priority: TaskPriority.MEDIUM });
                setFormErrors({});
              }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Add New Task
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Input
              label="Task Title"
              value={formData.title}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, title: text }));
                if (formErrors.title) {
                  setFormErrors(prev => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Enter task title..."
              error={formErrors.title}
              maxLength={100}
            />

            <Input
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Add more details..."
              variant="textarea"
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={[styles.priorityLabel, { color: theme.colors.text.primary }]}>
              Priority
            </Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor: formData.priority === priority
                        ? theme.colors.priority[priority.toLowerCase() as keyof typeof theme.colors.priority]
                        : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priority }))}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Create Task"
              onPress={handleAddTask}
              style={styles.createButton}
              fullWidth
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 100,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterList: {
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    ...shadows.small,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

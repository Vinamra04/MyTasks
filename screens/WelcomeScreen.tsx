import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Components & Services
import Button from '../components/Button';
import { storageService } from '../services/storageService';
import { RootStackParamList, TaskStats } from '../types';
import { shadows, motivationalQuotes } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: Math.random() * 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={[styles.statTitle, { color: theme.colors.text.secondary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.text.secondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { theme } = useTheme();

  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    pending: 0,
    highPriority: 0,
    dueSoon: 0,
  });
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

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

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Animate on mount
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load task statistics
      const stats = await storageService.getTaskStats();
      setTaskStats(stats);

      // Get next reminder
      const reminder = await storageService.getNextReminder();
      setNextReminder(reminder);

      // Set greeting based on time
      setGreeting(getTimeBasedGreeting());

      // Set random motivational quote
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalQuote(randomQuote);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    if (hour < 21) return 'Good Evening! 🌆';
    return 'Good Night! 🌙';
  };

  const formatNextReminder = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins <= 0) return 'Now';
    if (diffMins < 60) return `In ${diffMins} min`;
    if (diffHours < 24) return `In ${diffHours}h`;
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const getProgressMessage = (): string => {
    const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    
    if (taskStats.total === 0) return 'Ready to start your productivity journey!';
    if (completionRate === 100) return '🎉 Amazing! All tasks completed!';
    if (completionRate >= 80) return '🔥 You\'re crushing it!';
    if (completionRate >= 60) return '💪 Great progress!';
    if (completionRate >= 40) return '📈 Keep going!';
    return '🚀 Time to get productive!';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.button.primary]}
            tintColor={theme.colors.button.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: theme.colors.text.primary }]}>
              {greeting}
            </Text>
            <Text style={[styles.appTitle, { color: theme.colors.text.accent }]}>
              Dashboard
            </Text>
          </View>

          {/* Progress Message */}
          <View style={[styles.progressCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.progressMessage, { color: theme.colors.text.primary }]}>
              {getProgressMessage()}
            </Text>
            {taskStats.total > 0 && (
              <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.status.success,
                      width: `${(taskStats.completed / taskStats.total) * 100}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Task Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statsColumn}>
              <StatCard
                title="Total Tasks"
                value={taskStats.total}
                icon="list"
                color={theme.colors.text.accent}
              />
              <StatCard
                title="Pending"
                value={taskStats.pending}
                icon="time"
                color={theme.colors.status.warning}
              />
            </View>
            <View style={styles.statsColumn}>
              <StatCard
                title="Completed"
                value={taskStats.completed}
                icon="checkmark-circle"
                color={theme.colors.status.success}
              />
              <StatCard
                title="High Priority"
                value={taskStats.highPriority}
                icon="flame"
                color={theme.colors.priority.high}
              />
            </View>
          </View>

          {/* Next Reminder */}
          {nextReminder && (
            <View style={[styles.reminderCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.reminderHeader}>
                <Ionicons
                  name="notifications"
                  size={24}
                  color={theme.colors.button.primary}
                />
                <Text style={[styles.reminderTitle, { color: theme.colors.text.primary }]}>
                  Next Reminder
                </Text>
              </View>
              <Text style={[styles.reminderTime, { color: theme.colors.text.accent }]}>
                {formatNextReminder(nextReminder)}
              </Text>
              <Text style={[styles.reminderDate, { color: theme.colors.text.secondary }]}>
                {nextReminder.toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
          )}

          {/* Motivational Quote */}
          <View style={[styles.quoteCard, { backgroundColor: theme.colors.card }]}>
            <Ionicons
              name="bulb"
              size={24}
              color={theme.colors.status.warning}
              style={styles.quoteIcon}
            />
            <Text style={[styles.quote, { color: theme.colors.text.primary }]}>
              "{motivationalQuote}"
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Button
              title="📝 View My Tasks"
              onPress={() => navigation.navigate('Tasks')}
              style={styles.primaryButton}
              fullWidth
            />
            
            {taskStats.pending > 0 && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('Tasks')}
              >
                <Ionicons name="flash" size={20} color={theme.colors.status.warning} />
                <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                  {taskStats.pending} pending task{taskStats.pending === 1 ? '' : 's'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}

            {taskStats.dueSoon > 0 && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('Tasks')}
              >
                <Ionicons name="alarm" size={20} color={theme.colors.status.error} />
                <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                  {taskStats.dueSoon} task{taskStats.dueSoon === 1 ? '' : 's'} due soon
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    ...shadows.small,
  },
  progressMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsColumn: {
    width: '48.5%', // Each column spans almost half the width
    gap: 16, // Space between cards in the same column
  },
  statCard: {
    width: '100%', // Full width within the column
    minHeight: 120, // Fixed minimum height for consistency
    padding: 20,
    borderRadius: 16,
    justifyContent: 'space-between',
    ...shadows.medium,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  statSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  reminderCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    ...shadows.small,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  reminderTime: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 14,
  },
  quoteCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    ...shadows.small,
  },
  quoteIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    ...shadows.small,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

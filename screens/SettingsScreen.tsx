import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Components & Services
import Button from '../components/Button';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { RootStackParamList, AppSettings, TaskStats } from '../types';
import { shadows } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name={icon} size={20} color={theme.colors.button.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.text.secondary}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface SocialLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  platform: string;
  color: string;
  onPress: () => void;
  delay?: number;
}

const SocialLink: React.FC<SocialLinkProps> = ({ icon, platform, color, onPress, delay = 0 }) => {
  const { theme } = useTheme();
  const translateXAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateXAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(translateXAnim, {
        toValue: -5,
        useNativeDriver: true,
        tension: 200,
      }),
      Animated.spring(translateXAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
      }),
    ]).start();
    
    setTimeout(onPress, 100);
  };

  return (
    <Animated.View
      style={[
        styles.socialLink,
        {
          backgroundColor: color + '20',
          borderColor: color,
          opacity: opacityAnim,
          transform: [{ translateX: translateXAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.socialLinkInner}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.socialLinkText, { color }]}>
          {platform}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface DeveloperModalProps {
  visible: boolean;
  onClose: () => void;
  onSocialPress: (platform: string, url: string) => void;
}

const DeveloperModal: React.FC<DeveloperModalProps> = ({ visible, onClose, onSocialPress }) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.modalBackdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Know the Developer
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Developer Information */}
            <View style={[styles.developerCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.developerHeader, { borderBottomColor: theme.colors.surface }]}>
                <View style={[styles.developerAvatar, { backgroundColor: theme.colors.button.primary + '20' }]}>
                  <Ionicons name="person" size={32} color={theme.colors.button.primary} />
                </View>
                <View style={styles.developerInfo}>
                  <Text style={[styles.developerName, { color: theme.colors.text.primary }]}>
                    Vinamra Srivastava
                  </Text>
                  <Text style={[styles.developerTitle, { color: theme.colors.text.secondary }]}>
                    Full-Stack Developer & React Native Enthusiast
                  </Text>
                  <Text style={[styles.developerLocation, { color: theme.colors.text.secondary }]}>
                    🌍 Building amazing mobile experiences
                  </Text>
                </View>
              </View>

              <View style={styles.developerBio}>
                <Text style={[styles.bioText, { color: theme.colors.text.primary }]}>
                  Passionate about creating intuitive mobile applications with modern technologies. 
                  
                </Text>
              </View>

              <View style={styles.skillsContainer}>
                <Text style={[styles.skillsTitle, { color: theme.colors.text.primary }]}>
                  Tech Stack used in this Project
                </Text>
                <View style={styles.skillsGrid}>
                  {['React Native', 'TypeScript', 'Expo', 'Node.js', 'React', 'UI/UX'].map((skill, index) => (
                    <View key={skill} style={[styles.skillChip, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.skillText, { color: theme.colors.text.accent }]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.socialContainer}>
                <Text style={[styles.socialTitle, { color: theme.colors.text.primary }]}>
                  Connect with me
                </Text>
                <View style={styles.socialLinks}>
                  <SocialLink
                    icon="logo-linkedin"
                    platform="LinkedIn"
                    color="#0077B5"
                    onPress={() => onSocialPress('LinkedIn', 'https://www.linkedin.com/in/vinamrasrivastava18/')}
                    delay={0}
                  />
                  <SocialLink
                    icon="logo-github"
                    platform="GitHub"
                    color="#333333"
                    onPress={() => onSocialPress('GitHub', 'https://github.com/Vinamra04')}
                    delay={200}
                  />
                  <SocialLink
                    icon="logo-instagram"
                    platform="Instagram"
                    color="#E4405F"
                    onPress={() => onSocialPress('Instagram', 'https://www.instagram.com/vinamraisrivastava/')}
                    delay={400}
                  />
                </View>
              </View>

              {/* Additional Info */}
              <View style={styles.additionalInfo}>
                <Text style={[styles.additionalTitle, { color: theme.colors.text.primary }]}>
                  About This App
                </Text>
                <Text style={[styles.additionalText, { color: theme.colors.text.secondary }]}>
                  This task management app was built as a showcase of modern React Native development practices, 
                  featuring TypeScript, Expo, beautiful animations, and professional UI/UX design.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme, themeMode, setThemeMode } = useTheme();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // Load settings when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      loadTaskStats();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const currentSettings = await storageService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskStats = async () => {
    try {
      const stats = await storageService.getTaskStats();
      setTaskStats(stats);
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;

    try {
      const newSettings = { ...settings, ...updates };
      const success = await storageService.saveSettings(newSettings);
      
      if (success) {
        setSettings(newSettings);
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleResetAllTasks = () => {
    Alert.alert(
      'Reset All Tasks',
      'This will permanently delete all your tasks and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel all notifications first
              await notificationService.cancelAllNotifications();
              
              // Clear all data
              const success = await storageService.clearAllData();
              
              if (success) {
                Alert.alert('Success', 'All tasks have been deleted');
                loadTaskStats(); // Refresh stats
              } else {
                Alert.alert('Error', 'Failed to reset tasks');
              }
            } catch (error) {
              console.error('Error resetting tasks:', error);
              Alert.alert('Error', 'Failed to reset tasks');
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      const hasPermissions = await notificationService.hasPermissions();
      
      if (!hasPermissions) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.'
        );
        return;
      }

      // Schedule a test notification for 5 seconds from now
      const testTime = new Date(Date.now() + 5000);
      const testTask = {
        id: 'test',
        title: 'Test Notification',
        description: 'This is a test reminder',
        priority: 'MEDIUM' as any,
        status: 'PENDING' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminderTime: testTime,
      };

      await notificationService.scheduleTaskNotification(testTask);
      Alert.alert('Test Sent', 'You should receive a test notification in 5 seconds');
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleSocialLinkPress = (platform: string, url: string) => {
    Alert.alert(
      `Visit ${platform}`,
      'This will open the link in your default browser.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Visit',
          onPress: () => {
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  const getReminderDelayText = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleReminderDelayChange = () => {
    const options = [
      { label: '15 minutes', value: 15 },
      { label: '30 minutes', value: 30 },
      { label: '1 hour', value: 60 },
      { label: '2 hours', value: 120 },
      { label: '1 day', value: 1440 },
    ];

    Alert.alert(
      'Default Reminder Delay',
      'Choose how long before due time to send reminders:',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => updateSettings({ notificationDelay: option.value }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* App Appearance */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Appearance
            </Text>
            
            <SettingItem
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              icon="moon"
              rightElement={
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={(value) => {
                    const newMode = value ? 'dark' : 'light';
                    setThemeMode(newMode);
                    // Also update settings to keep them in sync
                    updateSettings({ themeMode: newMode });
                  }}
                  trackColor={{
                    false: theme.colors.surface,
                    true: theme.colors.button.primary + '40',
                  }}
                  thumbColor={themeMode === 'dark' ? theme.colors.button.primary : theme.colors.text.secondary}
                />
              }
              showChevron={false}
            />
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Notifications
            </Text>
            
            <SettingItem
              title="Enable Notifications"
              subtitle="Receive reminders for your tasks"
              icon="notifications"
              rightElement={
                <Switch
                  value={settings.enableNotifications}
                  onValueChange={(value) => updateSettings({ enableNotifications: value })}
                  trackColor={{
                    false: theme.colors.surface,
                    true: theme.colors.button.primary + '40',
                  }}
                  thumbColor={settings.enableNotifications ? theme.colors.button.primary : theme.colors.text.secondary}
                />
              }
              showChevron={false}
            />

            <SettingItem
              title="Default Reminder Delay"
              subtitle={`Remind me ${getReminderDelayText(settings.notificationDelay)} before due time`}
              icon="timer"
              onPress={handleReminderDelayChange}
            />

            <SettingItem
              title="Test Notification"
              subtitle="Send a test notification to check if they're working"
              icon="flash"
              onPress={handleTestNotification}
            />
          </View>

          {/* Data & Storage */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Data & Storage
            </Text>

            {taskStats && (
              <SettingItem
                title="Storage Usage"
                subtitle={`${taskStats.total} total tasks, ${taskStats.completed} completed`}
                icon="folder"
                showChevron={false}
              />
            )}

            <SettingItem
              title="Reset All Tasks"
              subtitle="Permanently delete all tasks and data"
              icon="trash"
              onPress={handleResetAllTasks}
            />
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              About
            </Text>

            <SettingItem
              title="My Tasks App"
              subtitle="Version 1.0.0"
              icon="information-circle"
              showChevron={false}
            />

            <SettingItem
              title="Built with React Native"
              subtitle="Powered by Expo and TypeScript"
              icon="code"
              showChevron={false}
            />

            <SettingItem
              title="Know the Developer"
              subtitle="Meet the creator behind this app"
              icon="person-circle"
              onPress={() => setShowDeveloperModal(true)}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Button
              title="🏠 Back to Dashboard"
              onPress={() => navigation.navigate('Welcome')}
              variant="secondary"
              fullWidth
              style={styles.actionButton}
            />

            <Button
              title="📝 View Tasks"
              onPress={() => navigation.navigate('Tasks')}
              fullWidth
              style={styles.actionButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
          </View>
        </View>
      </ScrollView>

      {/* Developer Modal */}
      <DeveloperModal
        visible={showDeveloperModal}
        onClose={() => setShowDeveloperModal(false)}
        onSocialPress={handleSocialLinkPress}
      />
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...shadows.small,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsSection: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Social Link Styles
  socialLink: {
    borderRadius: 16,
    borderWidth: 2,
    margin: 8,
    overflow: 'hidden',
  },
  socialLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  socialLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Developer Card Styles
  developerCard: {
    borderRadius: 16,
    marginTop: 0,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadows.medium,
  },
  developerHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
  },
  developerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  developerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  developerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  developerLocation: {
    fontSize: 13,
  },
  developerBio: {
    padding: 20,
    paddingTop: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  skillsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialContainer: {
    padding: 20,
    paddingTop: 0,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalScrollView: {
    padding: 20,
    paddingTop: 0,
  },
  additionalInfo: {
    padding: 20,
    paddingTop: 0,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  additionalText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

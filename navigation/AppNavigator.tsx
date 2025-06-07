import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar, Easing } from 'react-native';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import TasksScreen from '../screens/TasksScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import types and theme context
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ThemeLoader from '../components/ThemeLoader';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme, isLoading } = useTheme();

  // Navigation theme to prevent white flashes
  const navigationTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.button.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text.primary,
      border: theme.colors.surface,
      notification: theme.colors.status.warning,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <ThemeLoader isLoading={isLoading}>
      <NavigationContainer theme={navigationTheme}>
      <StatusBar 
        barStyle={theme.mode === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: theme.colors.text.primary,
          },
          cardStyle: {
            backgroundColor: theme.colors.background,
          },
          // Smooth transitions
          ...TransitionPresets.SlideFromRightIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 250,
                easing: Easing.out(Easing.cubic),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 200,
                easing: Easing.in(Easing.cubic),
              },
            },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
                backgroundColor: theme.colors.background,
                opacity: current.progress,
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
                backgroundColor: theme.colors.background,
              },
            };
          },
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ 
            title: 'Welcome',
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen 
          name="Tasks" 
          component={TasksScreen}
          options={{ 
            title: 'My Tasks',
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen 
          name="TaskDetails" 
          component={TaskDetailsScreen}
          options={{ 
            title: 'Task Details',
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Settings',
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeLoader>
  );
}

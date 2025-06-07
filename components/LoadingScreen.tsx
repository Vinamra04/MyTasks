import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible }) => {
  const systemColorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Use system color scheme directly for loading screen
  const isDark = systemColorScheme === 'dark';
  const backgroundColor = isDark ? '#1e1e2f' : '#ffffff';

  useEffect(() => {
    if (!visible) {
      // Fade out when loading is complete
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations when showing
      fadeAnim.setValue(1);
      scaleAnim.setValue(0.8);
      
      // Animate logo when loading starts
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor,
          opacity: fadeAnim,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Text style={[
          styles.appName, 
          { color: isDark ? '#ffffff' : '#1e1e2f' }
        ]}>
          My Tasks
        </Text>
        
        <Text style={[
          styles.tagline, 
          { color: isDark ? '#a0a0b2' : '#6b6b80' }
        ]}>
          Your productivity companion
        </Text>
        
        <View style={[
          styles.loadingBar, 
          { backgroundColor: isDark ? '#2a2a3e' : '#f0f0f5' }
        ]}>
          <Animated.View
            style={[
              styles.loadingFill,
              {
                backgroundColor: '#6366f1',
                transform: [{ scaleX: scaleAnim }],
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    marginBottom: 40,
  },
  loadingBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default LoadingScreen; 
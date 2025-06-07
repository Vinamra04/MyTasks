import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      // Add any app initialization logic here
      // For now, just show loading for a brief moment
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    initializeApp();
  }, []);

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <AppNavigator />
        <LoadingScreen visible={isLoading} />
      </View>
    </ThemeProvider>
  );
}

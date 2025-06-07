import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeLoaderProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function ThemeLoader({ children, isLoading = false }: ThemeLoaderProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        {/* Just a themed background while loading */}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
}); 
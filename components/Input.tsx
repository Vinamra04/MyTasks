import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  variant?: 'default' | 'search' | 'textarea';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
}

export default function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  variant = 'default',
  icon,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
    };

    const variantStyles = {
      default: {
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 14,
        minHeight: multiline ? 80 : 44,
      },
      search: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
        borderRadius: 22,
      },
      textarea: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 100,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      borderColor: error
        ? theme.colors.status.error
        : isFocused
        ? theme.colors.button.primary
        : theme.colors.text.secondary + '40',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      textAlignVertical: multiline ? 'top' : 'center',
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          getContainerStyle(),
          {
            shadowColor: theme.colors.button.primary,
            shadowOpacity: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
            shadowRadius: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 4],
            }),
            elevation: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }),
          },
        ]}
      >
        <View style={styles.inputContainer}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={isFocused ? theme.colors.button.primary : theme.colors.text.secondary}
              style={styles.icon}
            />
          )}
          
          <TextInput
            style={[getInputStyle(), inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.secondary + '80'}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            maxLength={maxLength}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            keyboardAppearance={theme.mode === 'dark' ? 'dark' : 'light'}
          />
        </View>
      </Animated.View>

      {error && (
        <Animated.View
          style={[
            styles.errorContainer,
            {
              opacity: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={theme.colors.status.error}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
            {error}
          </Text>
        </Animated.View>
      )}

      {maxLength && (
        <Text style={[styles.charCount, { color: theme.colors.text.secondary }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
}); 
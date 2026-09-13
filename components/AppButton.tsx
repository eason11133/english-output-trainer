import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
};

export function AppButton({ label, onPress, disabled, variant = 'primary', style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  primaryText: { color: theme.colors.primaryText, fontSize: 16, fontWeight: '800' },
  secondaryText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});

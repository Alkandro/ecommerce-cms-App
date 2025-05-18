// /home/ubuntu/ecommerce_app/components/Shared/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import COLORS from '../../../constants/colors'; // Assuming you have a colors constant file

export default function CustomButton({ title, onPress, style, textStyle, disabled, loading, icon, variant = 'primary' }) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: styles.buttonSecondary,
          text: styles.textSecondary,
        };
      case 'outline':
        return {
          button: styles.buttonOutline,
          text: styles.textOutline,
        };
      case 'text':
        return {
          button: styles.buttonTextOnly,
          text: styles.textTextOnly,
        };
      default: // primary
        return {
          button: styles.buttonPrimary,
          text: styles.textPrimary,
        };
    }
  };

  const { button: variantButton, text: variantText } = getButtonStyles();

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        variantButton,
        style,
        disabled || loading ? styles.buttonDisabled : {},
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? COLORS.white : COLORS.primary} size="small" />
      ) : (
        <>
          {icon && <View style={styles.iconWrapper}>{icon}</View>} 
          <Text style={[styles.textBase, variantText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48, // Consistent height
    marginVertical: 8,
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Primary Button
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  textPrimary: {
    color: COLORS.white,
  },
  // Secondary Button
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  textSecondary: {
    color: COLORS.white,
  },
  // Outline Button
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textOutline: {
    color: COLORS.primary,
  },
  // Text Only Button
  buttonTextOnly: {
    backgroundColor: 'transparent',
    paddingVertical: 8, // Less padding for text buttons
    paddingHorizontal: 10,
  },
  textTextOnly: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  // Disabled State
  buttonDisabled: {
    opacity: 0.6,
  },
  iconWrapper: {
    marginRight: 8,
  },
});


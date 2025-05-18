// /home/ubuntu/ecommerce_app/components/Shared/LoadingIndicator.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import COLORS from '../../../constants/colors'; // Assuming you have a colors constant file

export default function LoadingIndicator({ size = 'large', color = COLORS.primary, style, text }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary, // Or a color that fits the loading context
  },
});


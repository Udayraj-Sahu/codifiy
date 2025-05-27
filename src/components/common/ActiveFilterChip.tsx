// src/components/ActiveFilterChip.tsx (Conceptual)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme'; // Adjust path

interface ActiveFilterChipProps {
  label: string; // e.g., "Type: Scooter" or "₹200-₹500"
  onRemove?: () => void; // Optional remove action
}

const ActiveFilterChip: React.FC<ActiveFilterChipProps> = ({ label, onRemove }) => (
  <View style={styles.chipContainer}>
    <Text style={styles.chipLabel}>{label}</Text>
    {onRemove && (
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight || '#E6F7FF',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s -2,
    marginRight: spacing.s,
    marginBottom: spacing.s, // For wrapping
  },
  chipLabel: {
    fontSize: typography.fontSizes.s,
    color: colors.primaryDark || colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  removeButton: {
    marginLeft: spacing.s,
    padding: spacing.xs / 2,
  },
  removeButtonText: {
    color: colors.primaryDark || colors.primary,
    fontSize: typography.fontSizes.s,
    fontWeight: typography.fontWeights.bold,
  },
});

export default ActiveFilterChip;
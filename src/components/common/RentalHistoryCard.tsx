// src/components/RentalHistoryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme'; // Adjust path
// import Icon from 'react-native-vector-icons/Ionicons'; // For calendar icon

export type RentalCardStatus = 'Active' | 'Completed' | 'Cancelled'; // Matches prompt

export interface RentalHistoryItemData {
  id: string;
  bikeName: string;
  bikeModel: string;
  bikeImageUrl: string;
  dateRange: string; // e.g., "Jan 15, 2024 - Jan 17, 2024"
  totalPaid: string; // e.g., "$89.99" or "₹4500"
  status: RentalCardStatus;
}

interface RentalHistoryCardProps {
  item: RentalHistoryItemData;
  onPress: () => void;
}

const RentalHistoryCard: React.FC<RentalHistoryCardProps> = ({ item, onPress }) => {
  const getStatusBadgeStyle = () => {
    switch (item.status) {
      case 'Active': return styles.statusBadgeActive;
      case 'Completed': return styles.statusBadgeCompleted;
      case 'Cancelled': return styles.statusBadgeCancelled;
      default: return {};
    }
  };

  const getStatusTextStyle = () => {
    switch (item.status) {
      case 'Active': return styles.statusTextActive;
      case 'Completed': return styles.statusTextCompleted;
      case 'Cancelled': return styles.statusTextCancelled;
      default: return {};
    }
  }

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: item.bikeImageUrl }} style={styles.thumbnailImage} />
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.bikeNameText} numberOfLines={1}>{item.bikeName}</Text>
          <View style={[styles.statusBadgeBase, getStatusBadgeStyle()]}>
            <Text style={[styles.statusBadgeTextBase, getStatusTextStyle()]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.bikeModelText} numberOfLines={1}>{item.bikeModel}</Text>
        <View style={styles.dateRow}>
          {/* <Icon name="calendar-outline" size={16} color={colors.textMedium} style={styles.dateIcon} /> */}
          <Text style={styles.dateIcon}>🗓️</Text>
          <Text style={styles.dateText}>{item.dateRange}</Text>
        </View>
        <Text style={styles.totalPaidText}>{item.totalPaid}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.l, // e.g., 12
    padding: spacing.m,
    marginBottom: spacing.m,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 80, // Adjusted size
    height: 80,
    borderRadius: borderRadius.m,
    marginRight: spacing.m,
    backgroundColor: colors.greyLighter,
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align badge to top if text wraps
    marginBottom: spacing.xs,
  },
  bikeNameText: {
    flex: 1, // Allow name to take space and wrap if needed, before badge
    fontSize: typography.fontSizes.l,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginRight: spacing.s, // Space before badge
  },
  bikeModelText: {
    fontSize: typography.fontSizes.s,
    color: colors.textSecondary,
    marginBottom: spacing.s,
  },
  statusBadgeBase: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs + 1,
    borderRadius: borderRadius.pill, // Pill shape
    // alignSelf: 'flex-start', // Already right-aligned due to headerRow justify
  },
  statusBadgeTextBase: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  statusBadgeActive: { backgroundColor: '#D4F0E0' }, // Green
  statusTextActive: { color:'#006400' },
  statusBadgeCompleted: { backgroundColor:  '#D6EAF8' }, // Blue
  statusTextCompleted: { color: '#1A5276' },
  statusBadgeCancelled: { backgroundColor: '#FFD6D6' }, // Red
  statusTextCancelled: { color: '#A93226' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  dateIcon: {
    fontSize: 16,
    color: colors.textMedium,
    marginRight: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSizes.s,
    color: colors.textMedium,
  },
  totalPaidText: {
    fontSize: typography.fontSizes.m,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'right', // Align to bottom right
  },
});

export default RentalHistoryCard;
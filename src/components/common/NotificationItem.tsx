// Could be src/components/NotificationItem.tsx or defined inline in NotificationsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme'; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For actual icons

export interface NotificationData {
  id: string;
  iconPlaceholder: string; // Emoji or icon name
  title: string;
  subtitle: string;
  timestamp: string; // e.g., "10:45 AM" or "Yesterday" if group header handles date
  detailsLinkText?: string; // e.g., "View Details"
  onPressDetails?: () => void; // Action for the details link
  isRead?: boolean; // To style unread notifications differently if needed
}

interface NotificationItemProps {
  item: NotificationData;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ item }) => {
  return (
    <View style={[styles.notificationItemContainer, !item.isRead && styles.unreadNotification]}>
      <View style={styles.iconWrapper}>
        {/* <Icon name={item.iconName} size={24} color={colors.primary} /> */}
        <Text style={styles.notificationIcon}>{item.iconPlaceholder}</Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notificationSubtitle} numberOfLines={2}>{item.subtitle}</Text>
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          {item.detailsLinkText && item.onPressDetails && (
            <TouchableOpacity onPress={item.onPressDetails}>
              <Text style={styles.detailsLink}>{item.detailsLinkText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// Styles for NotificationItem (these would typically be in its own file or part of NotificationsScreen styles)
const notificationItemStyles = StyleSheet.create({
  notificationItemContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderDefault || '#EEE',
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight || '#E6FFFA', // Subtle background for unread
  },
  iconWrapper: {
    marginRight: spacing.m,
    alignItems: 'center',
    justifyContent: 'flex-start', // Align icon to the top of the text block
    paddingTop: spacing.xxs,
  },
  notificationIcon: {
    fontSize: 24, // Placeholder size
    color: colors.primary, // Default icon color
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSizes.m,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  notificationSubtitle: {
    fontSize: typography.fontSizes.s,
    color: colors.textSecondary,
    lineHeight: typography.fontSizes.s * 1.4,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: typography.fontSizes.xs,
    color: colors.textLight,
  },
  detailsLink: {
    fontSize: typography.fontSizes.s,
    color: colors.primary,
    fontWeight: typography.fontWeights.semiBold,
  },
});
// Make sure to merge these styles into the main StyleSheet of NotificationsScreen if defined inline
// or import NotificationItem from its own file. For this example, I'll merge below.
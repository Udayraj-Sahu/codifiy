// src/screens/App/Home/NotificationsScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList, // Ideal for grouped data
  TouchableOpacity,
  // ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../navigation/types'; // Adjust path
import { colors, spacing, typography, borderRadius } from '../../../theme'; // Adjust path
// For this example, NotificationItem is defined above. In a real app, import it:
// import NotificationItem, { NotificationData } from '../../../components/NotificationItem';

// --- Re-defining NotificationItem and its styles here for a single file example ---
// (Ideally, NotificationItem would be in its own file: src/components/NotificationItem.tsx)
interface NotificationData { /* ... same as above ... */
  id: string; iconPlaceholder: string; title: string; subtitle: string;
  timestamp: string; detailsLinkText?: string; onPressDetails?: () => void; isRead?: boolean;
}
const NotificationItem: React.FC<{ item: NotificationData }> = ({ item }) => ( /* ... same JSX as above ... */
  <View style={[styles.notificationItemContainer, !item.isRead && styles.unreadNotification]}>
    <View style={styles.iconWrapper}><Text style={styles.notificationIcon}>{item.iconPlaceholder}</Text></View>
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.notificationSubtitle} numberOfLines={2}>{item.subtitle}</Text>
      <View style={styles.notificationFooter}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        {item.detailsLinkText && item.onPressDetails && (
          <TouchableOpacity onPress={item.onPressDetails}><Text style={styles.detailsLink}>{item.detailsLinkText}</Text></TouchableOpacity>
        )}
      </View>
    </View>
  </View>
);
// --- End Inline NotificationItem ---


// --- Dummy Data ---
const DUMMY_NOTIFICATIONS: NotificationData[] = [
  // Today
  { id: 'n1', iconPlaceholder: '🚲', title: 'Booking Confirmed!', subtitle: 'Your ride with Urban Cruiser is booked for today at 2:00 PM.', timestamp: '10:45 AM', detailsLinkText: 'View Details', onPressDetails: () => Alert.alert("View Details", "Navigate to booking BKY456"), isRead: false },
  { id: 'n2', iconPlaceholder: '✅', title: 'License Verified', subtitle: 'Your Driver\'s License has been successfully verified.', timestamp: '09:15 AM', isRead: true },
  // Yesterday
  { id: 'n3', iconPlaceholder: '💳', title: 'Payment Successful', subtitle: 'Payment of ₹450 for Booking #BKY123 was successful.', timestamp: 'Yesterday, 6:30 PM', detailsLinkText: 'View Receipt', onPressDetails: () => Alert.alert("View Receipt", "For booking BKY123"), isRead: true },
  // Earlier
  { id: 'n4', iconPlaceholder: '🎉', title: 'Weekend Special!', subtitle: 'Get 25% off on all mountain bikes this weekend. Use code WEEKEND25.', timestamp: 'May 23, 2025', isRead: true },
  { id: 'n5', iconPlaceholder: '⚠️', title: 'Upcoming Ride Reminder', subtitle: 'Your booking for City Hopper starts in 1 hour.', timestamp: 'May 22, 2025', detailsLinkText: 'View Booking', onPressDetails: () => Alert.alert("View Booking", "Navigate to booking BKY090"), isRead: false },
];

interface GroupedNotification {
  title: string; // "Today", "Yesterday", "Earlier"
  data: NotificationData[];
}

const groupNotifications = (notifications: NotificationData[]): GroupedNotification[] => {
  // This is a simplified grouping. Real grouping would compare dates.
  // For now, let's use the dummy structure.
  const today = notifications.filter(n => n.timestamp.includes('AM') || n.timestamp.includes('PM')); // Simplistic
  const yesterday = notifications.filter(n => n.timestamp.includes('Yesterday'));
  const earlier = notifications.filter(n => !today.includes(n) && !yesterday.includes(n));

  const grouped: GroupedNotification[] = [];
  if (today.length > 0) grouped.push({ title: 'Today', data: today });
  if (yesterday.length > 0) grouped.push({ title: 'Yesterday', data: yesterday });
  if (earlier.length > 0) grouped.push({ title: 'Earlier', data: earlier });
  return grouped;
};
// --- End Dummy Data ---

type NotificationsScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'NotificationsScreen'>;
// type NotificationsScreenRouteProp = RouteProp<HomeStackParamList, 'NotificationsScreen'>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
  // route: NotificationsScreenRouteProp;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleMarkAllAsRead = () => {
    Alert.alert("Mark All As Read", "All notifications would be marked as read.");
    // TODO: Implement logic to mark all as read in state and backend
    const updatedNotifications = DUMMY_NOTIFICATIONS.map(n => ({ ...n, isRead: true }));
    setNotifications(groupNotifications(updatedNotifications)); // Re-group to reflect read status
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      // Title "Notifications" is likely set by the navigator options already
      headerRight: () => (
        <TouchableOpacity onPress={handleMarkAllAsRead} style={{ marginRight: spacing.m }}>
          <Text style={styles.markAllReadLink}>Mark all as read</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    // Simulate fetching notifications
    setIsLoading(true);
    setTimeout(() => {
      setNotifications(groupNotifications(DUMMY_NOTIFICATIONS));
      setIsLoading(false);
    }, 500);
  }, []);


  const renderNotification = ({ item }: { item: NotificationData }) => (
    <NotificationItem item={item} />
  );

  const renderSectionHeader = ({ section: { title } }: { section: GroupedNotification }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (isLoading) {
    return <View style={styles.centered}><Text>Loading notifications...</Text></View>;
  }

  if (notifications.length === 0) {
    return <View style={styles.centered}><Text>No notifications yet.</Text></View>;
  }

  return (
    <SectionList
      sections={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderNotification}
      renderSectionHeader={renderSectionHeader}
      style={styles.screenContainer}
      contentContainerStyle={styles.listContentContainer}
      stickySectionHeadersEnabled={false} // Or true if you prefer
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight || '#F7F9FC', // Off-white background
  },
  listContentContainer: {
    paddingBottom: spacing.l,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  markAllReadLink: {
    color: colors.primary,
    fontSize: typography.fontSizes.s,
    fontWeight: typography.fontWeights.medium,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.s,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundLight || '#F7F9FC', // Match screen background
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Styles for NotificationItem (merged here for single file example)
  notificationItemContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.white, // Clean notification background
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderDefault || '#EEE',
  },
  unreadNotification: {
    backgroundColor: '#F0FFF0', // Very subtle green tint for unread
    // borderLeftWidth: 3, // Example: different indicator for unread
    // borderLeftColor: colors.primary,
  },
  iconWrapper: {
    marginRight: spacing.m,
    alignItems: 'center',
    // justifyContent: 'center', // Center icon vertically with first line of text
    paddingTop: spacing.xxs,
  },
  notificationIcon: {
    fontSize: 22, // Adjusted size
    color: colors.primary,
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
  notificationFooter: { // Renamed from footer to avoid conflict
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSizes.xs,
    color: "#F0F0F0",
  },
  detailsLink: {
    fontSize: typography.fontSizes.s,
    color: colors.primary,
    fontWeight: typography.fontWeights.semiBold,
  },
});

export default NotificationsScreen;
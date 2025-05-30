// src/screens/App/Home/NotificationsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton";
import { useDispatch, useSelector } from "react-redux";
import { HomeStackParamList } from "../../../navigation/types";
import {
	fetchUserNotificationsThunk,
	markAllNotificationsAsReadThunk,
	markNotificationAsReadThunk,
	resetNotifications,
	NotificationData as StoreNotificationData, // Use type from slice
} from "../../../store/slices/notificationSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { colors, spacing, typography } from "../../../theme";

// --- NotificationItem Component ---
// (Can be moved to a separate file: src/components/common/NotificationItem.tsx)
// Mapping StoreNotificationData to NotificationItemData for display
interface NotificationItemDisplayData {
	id: string; // maps to _id
	iconPlaceholder: string; // Derived or from notification.type/data
	title: string;
	subtitle: string; // maps to body
	timestamp: string; // Formatted createdAt
	detailsLinkText?: string;
	onPressDetails?: () => void;
	isRead?: boolean;
}

const NotificationItem: React.FC<{
	item: NotificationItemDisplayData;
	onMarkRead: (id: string) => void;
}> = ({ item, onMarkRead }) => {
	const handlePress = () => {
		if (!item.isRead) {
			onMarkRead(item.id);
		}
		if (item.onPressDetails) {
			item.onPressDetails();
		}
	};

	return (
		<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
			<View
				style={[
					styles.notificationItemContainer,
					!item.isRead && styles.unreadNotification,
				]}>
				<View style={styles.iconWrapper}>
					<Text style={styles.notificationIcon}>
						{item.iconPlaceholder}
					</Text>
				</View>
				<View style={styles.notificationContent}>
					<Text style={styles.notificationTitle} numberOfLines={1}>
						{item.title}
					</Text>
					<Text style={styles.notificationSubtitle} numberOfLines={2}>
						{item.subtitle}
					</Text>
					<View style={styles.notificationFooter}>
						<Text style={styles.timestamp}>{item.timestamp}</Text>
						{item.detailsLinkText && ( // Only show if detailsLinkText is present
							<Text style={styles.detailsLink}>
								{item.detailsLinkText}
							</Text>
						)}
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};
// --- End NotificationItem ---

interface GroupedNotificationDisplay {
	title: string;
	data: NotificationItemDisplayData[];
}

const mapAndGroupNotifications = (
	notifications: StoreNotificationData[]
): GroupedNotificationDisplay[] => {
	const getIconForType = (type?: string): string => {
		switch (type) {
			case "booking_confirmed":
				return "✅";
			case "booking_cancelled":
				return "❌";
			case "ride_reminder":
				return "🔔";
			case "promo":
				return "🎉";
			case "document_verified":
				return "📄";
			case "document_rejected":
				return "⚠️";
			default:
				return "ℹ️";
		}
	};
	const formatTimestamp = (isoDate: string): string => {
		const date = new Date(isoDate);
		const now = new Date();
		const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
		if (diffSeconds < 60) return `${diffSeconds}s ago`;
		const diffMinutes = Math.round(diffSeconds / 60);
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const diffHours = Math.round(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffHours < 48) return "Yesterday";
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	};

	const mapped: NotificationItemDisplayData[] = notifications.map((n) => ({
		id: n._id,
		iconPlaceholder: getIconForType(n.type),
		title: n.title,
		subtitle: n.body,
		timestamp: formatTimestamp(n.createdAt),
		isRead: n.isRead,
		// Example: Derive detailsLinkText and onPressDetails from n.data
		detailsLinkText: n.data?.screen ? "View Details" : undefined,
		onPressDetails: n.data?.screen
			? () => {
					console.log(
						"Navigate to:",
						n.data.screen,
						"with params:",
						n.data
					);
					// navigation.navigate(n.data.screen, n.data.params); // Requires navigation prop
			  }
			: undefined,
	}));

	// Simplified grouping by date for example (Today, Yesterday, Earlier)
	const today: NotificationItemDisplayData[] = [];
	const yesterday: NotificationItemDisplayData[] = [];
	const earlier: NotificationItemDisplayData[] = [];

	mapped.forEach((n) => {
		const createdAt = new Date(
			notifications.find((orig) => orig._id === n.id)!.createdAt
		); // Get original createdAt
		const now = new Date();
		const diffDays =
			(now.setHours(0, 0, 0, 0) - createdAt.setHours(0, 0, 0, 0)) /
			(1000 * 60 * 60 * 24);

		if (diffDays === 0) today.push(n);
		else if (diffDays === 1) yesterday.push(n);
		else earlier.push(n);
	});

	const grouped: GroupedNotificationDisplay[] = [];
	if (today.length > 0) grouped.push({ title: "Today", data: today });
	if (yesterday.length > 0)
		grouped.push({ title: "Yesterday", data: yesterday });
	if (earlier.length > 0) grouped.push({ title: "Earlier", data: earlier });
	return grouped;
};

type NotificationsScreenNavigationProp = StackNavigationProp<
	HomeStackParamList,
	"NotificationsScreen"
>;
interface NotificationsScreenProps {
	navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		notifications: notificationsFromStore,
		pagination,
		unreadCount,
		isLoading,
		isLoadingMore,
		error,
	} = useSelector((state: RootState) => state.notifications);

	const groupedDisplayNotifications = useMemo(
		() => mapAndGroupNotifications(notificationsFromStore),
		[notificationsFromStore]
	);

	const loadNotifications = useCallback(
		(page = 1, isRefreshing = false) => {
			if (!isRefreshing && page > 1 && isLoadingMore) return; // Don't fetch if already fetching more
			if (!isRefreshing && page === 1 && isLoading) return; // Don't fetch if already loading initial
			dispatch(fetchUserNotificationsThunk({ page }));
		},
		[dispatch, isLoading, isLoadingMore]
	);

	useEffect(() => {
		dispatch(resetNotifications()); // Reset on mount to ensure fresh load
		loadNotifications(1);
		// Cleanup on unmount
		return () => {
			// dispatch(resetNotifications()); // Or based on your app's logic for persistence
		};
	}, [dispatch]); // loadNotifications dependency removed to prevent loop, called directly

	const handleMarkAllAsRead = useCallback(async () => {
		if (unreadCount > 0) {
			const resultAction = await dispatch(
				markAllNotificationsAsReadThunk()
			);
			if (markAllNotificationsAsReadThunk.rejected.match(resultAction)) {
				Alert.alert(
					"Error",
					resultAction.payload || "Could not mark all as read."
				);
			}
		}
	}, [dispatch, unreadCount]);

	const handleMarkOneAsRead = useCallback(
		(notificationId: string) => {
			dispatch(markNotificationAsReadThunk(notificationId));
		},
		[dispatch]
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () =>
				unreadCount > 0 ? ( // Only show if there are unread notifications
					<TouchableOpacity
						onPress={handleMarkAllAsRead}
						style={{ marginRight: spacing.m }}>
						<Text style={styles.markAllReadLink}>
							Mark all as read
						</Text>
					</TouchableOpacity>
				) : null,
		});
	}, [navigation, handleMarkAllAsRead, unreadCount]);

	const renderNotificationDisplayItem = ({
		item,
	}: {
		item: NotificationItemDisplayData;
	}) => (
		<NotificationItem
			item={item}
			onMarkRead={handleMarkOneAsRead} // Pass the handler
		/>
	);

	const renderSectionHeader = ({
		section: { title },
	}: {
		section: GroupedNotificationDisplay;
	}) => <Text style={styles.sectionHeader}>{title}</Text>;

	const onRefresh = () => {
		dispatch(resetNotifications());
		loadNotifications(1, true);
	};

	const onEndReached = () => {
		if (
			pagination &&
			pagination.currentPage < pagination.totalPages &&
			!isLoadingMore
		) {
			loadNotifications(pagination.currentPage + 1);
		}
	};

	if (isLoading && notificationsFromStore.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.messageText}>Loading notifications...</Text>
			</View>
		);
	}

	if (error && notificationsFromStore.length === 0) {
		return (
			<View style={styles.centered}>
				<Text style={styles.errorText}>Error: {error}</Text>
				<PrimaryButton
					title="Retry"
					onPress={() => loadNotifications(1)}
				/>
			</View>
		);
	}

	if (groupedDisplayNotifications.length === 0 && !isLoading) {
		return (
			<View style={styles.centered}>
				<Text style={styles.noNotificationsText}>
					You have no notifications yet.
				</Text>
			</View>
		);
	}

	return (
		<SectionList
			sections={groupedDisplayNotifications}
			keyExtractor={(item, index) => item.id + index}
			renderItem={renderNotificationDisplayItem}
			renderSectionHeader={renderSectionHeader}
			style={styles.screenContainer}
			contentContainerStyle={styles.listContentContainer}
			stickySectionHeadersEnabled={false}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={
						isLoading && notificationsFromStore.length === 0
					}
					onRefresh={onRefresh}
					colors={[colors.primary]}
					tintColor={colors.primary}
				/>
			}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			ListFooterComponent={
				isLoadingMore ? (
					<ActivityIndicator
						style={{ marginVertical: spacing.m }}
						color={colors.primary}
					/>
				) : null
			}
		/>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	listContentContainer: { paddingBottom: spacing.l },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	messageText: { marginTop: spacing.s, color: colors.textMedium },
	errorText: {
		color: colors.error,
		fontSize: typography.fontSizes.m,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	noNotificationsText: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
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
		backgroundColor: colors.backgroundLight || "#F7F9FC",
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	// NotificationItem Styles
	notificationItemContainer: {
		flexDirection: "row",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.m,
		backgroundColor: colors.white,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	unreadNotification: {
		backgroundColor: colors.primaryVeryLight || "#E6FFFA",
		borderLeftWidth: 3,
		borderLeftColor: colors.primary,
	},
	iconWrapper: {
		marginRight: spacing.m,
		alignItems: "center",
		paddingTop: spacing.xxs,
	},
	notificationIcon: { fontSize: 22, color: colors.primary },
	notificationContent: { flex: 1 },
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
	notificationFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	timestamp: { fontSize: typography.fontSizes.xs, color: colors.textLight },
	detailsLink: {
		fontSize: typography.fontSizes.s,
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},
});

export default NotificationsScreen;

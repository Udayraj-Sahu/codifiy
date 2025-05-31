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
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import { HomeStackParamList } from "../../../navigation/types";
import {
	fetchUserNotificationsThunk,
	markAllNotificationsAsReadThunk,
	markNotificationAsReadThunk,
	resetNotifications,
	NotificationData as StoreNotificationData,
} from "../../../store/slices/notificationSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { colors, spacing, typography } from "../../../theme";

// --- NotificationItem Component ---
interface NotificationItemDisplayData {
	id: string;
	iconName: string; // Changed from iconPlaceholder to iconName for MaterialIcons
	iconColor?: string; // Optional color for specific icons
	title: string;
	subtitle: string;
	timestamp: string;
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
		// If no onPressDetails, clicking a read notification might do nothing or navigate to a default screen
	};

	return (
		<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
			<View
				style={[
					styles.notificationItemContainer,
					!item.isRead && styles.unreadNotification,
				]}>
				<View style={styles.iconWrapper}>
					<MaterialIcons
						name={item.iconName}
						size={24} // Standardized icon size
						color={item.iconColor || colors.primary} // Use specific color or default to primary
					/>
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
						{item.detailsLinkText && (
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
	notifications: StoreNotificationData[],
	navigation: NotificationsScreenNavigationProp // Pass navigation for onPressDetails
): GroupedNotificationDisplay[] => {
	const getIconDetailsForType = (
		type?: string
	): { name: string; color?: string } => {
		switch (type) {
			case "booking_confirmed":
				return { name: "check-circle", color: colors.success };
			case "booking_cancelled":
				return { name: "cancel", color: colors.error };
			case "ride_reminder":
				return { name: "notifications-active", color: colors.primary };
			case "promo":
				return { name: "campaign", color: colors.warning }; // Using 'campaign' for promo
			case "document_verified":
				return { name: "verified-user", color: colors.success };
			case "document_rejected":
				return { name: "report-problem", color: colors.error };
			default:
				return { name: "info-outline", color: colors.iconDefault };
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

	const mapped: NotificationItemDisplayData[] = notifications.map((n) => {
		const iconDetails = getIconDetailsForType(n.type);
		return {
			id: n._id,
			iconName: iconDetails.name,
			iconColor: iconDetails.color,
			title: n.title,
			subtitle: n.body,
			timestamp: formatTimestamp(n.createdAt),
			isRead: n.isRead,
			detailsLinkText: n.data?.screen ? "View Details" : undefined,
			onPressDetails: n.data?.screen
				? () => {
						console.log(
							"Navigate to:",
							n.data.screen,
							"with params:",
							n.data.params // Ensure params is an object
						);
						// Ensure the screen name and params structure are correct for your navigator
						// Example: navigation.navigate('RideDetailsScreen', { bookingId: 'someId' });
						if (
							n.data.screen &&
							typeof n.data.screen === "string"
						) {
							try {
								// @ts-ignore - Bypassing type check for dynamic navigation, ensure safety
								navigation.navigate(
									n.data.screen,
									n.data.params || {}
								);
							} catch (e) {
								console.error("Navigation error:", e);
								Alert.alert(
									"Navigation Error",
									"Could not open the notification details."
								);
							}
						}
				  }
				: undefined,
		};
	});

	const today: NotificationItemDisplayData[] = [];
	const yesterday: NotificationItemDisplayData[] = [];
	const earlier: NotificationItemDisplayData[] = [];

	mapped.forEach((n) => {
		const originalNotification = notifications.find(
			(orig) => orig._id === n.id
		);
		if (!originalNotification) return;

		const createdAt = new Date(originalNotification.createdAt);
		const now = new Date();
		const startOfNow = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		const startOfCreatedAt = new Date(
			createdAt.getFullYear(),
			createdAt.getMonth(),
			createdAt.getDate()
		);
		const diffDays =
			(startOfNow.getTime() - startOfCreatedAt.getTime()) /
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
		() => mapAndGroupNotifications(notificationsFromStore, navigation), // Pass navigation here
		[notificationsFromStore, navigation]
	);

	const loadNotifications = useCallback(
		(page = 1, isRefreshing = false) => {
			if (!isRefreshing && page > 1 && isLoadingMore) return;
			if (
				!isRefreshing &&
				page === 1 &&
				isLoading &&
				notificationsFromStore.length > 0 &&
				!isRefreshing
			)
				return; // Avoid reload if already loading initial and has some data unless refreshing
			dispatch(fetchUserNotificationsThunk({ page, limit: 20 })); // Added limit
		},
		[dispatch, isLoading, isLoadingMore, notificationsFromStore.length]
	);

	useEffect(() => {
		dispatch(resetNotifications());
		loadNotifications(1, true); // Force refresh on initial mount
	}, [dispatch]); // Removed loadNotifications from deps

	const handleMarkAllAsRead = useCallback(async () => {
		if (unreadCount > 0) {
			const resultAction = await dispatch(
				markAllNotificationsAsReadThunk()
			);
			if (markAllNotificationsAsReadThunk.rejected.match(resultAction)) {
				Alert.alert(
					"Error",
					(resultAction.payload as string) ||
						"Could not mark all as read."
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
				unreadCount > 0 ? (
					<TouchableOpacity
						onPress={handleMarkAllAsRead}
						style={{ marginRight: spacing.m }}>
						<Text style={styles.markAllReadLink}>
							Mark all read
						</Text>
					</TouchableOpacity>
				) : null,
		});
	}, [navigation, handleMarkAllAsRead, unreadCount]);

	const renderNotificationDisplayItem = ({
		item,
	}: {
		item: NotificationItemDisplayData;
	}) => <NotificationItem item={item} onMarkRead={handleMarkOneAsRead} />;

	const renderSectionHeader = ({
		section: { title },
	}: {
		section: GroupedNotificationDisplay;
	}) => <Text style={styles.sectionHeader}>{title}</Text>;

	const onRefresh = () => {
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
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.error}
				/>
				<Text style={styles.errorText}>Error: {error}</Text>
				<PrimaryButton
					title="Retry"
					onPress={() => loadNotifications(1, true)}
				/>
			</View>
		);
	}

	if (groupedDisplayNotifications.length === 0 && !isLoading) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="notifications-off"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.noNotificationsText}>
					You have no notifications yet.
				</Text>
				<PrimaryButton
					title="Refresh"
					onPress={onRefresh}
					style={{ marginTop: spacing.m }}
				/>
			</View>
		);
	}

	return (
		<SectionList
			sections={groupedDisplayNotifications}
			keyExtractor={(item, index) => item.id + index.toString()}
			renderItem={renderNotificationDisplayItem}
			renderSectionHeader={renderSectionHeader}
			style={styles.screenContainer}
			contentContainerStyle={styles.listContentContainer}
			stickySectionHeadersEnabled={false} // Keep false for cleaner look with dark theme
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={
						isLoading && notificationsFromStore.length === 0
					} // Show only for initial load refresh
					onRefresh={onRefresh}
					colors={[colors.primary]} // For Android
					tintColor={colors.primary} // For iOS
				/>
			}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			ListFooterComponent={
				isLoadingMore ? (
					<ActivityIndicator
						style={{ marginVertical: spacing.m }}
						color={colors.primary}
						size="small"
					/>
				) : null
			}
		/>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	listContentContainer: {
		paddingBottom: spacing.l,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	messageText: {
		marginTop: spacing.s,
		color: colors.textSecondary, // Muted text on dark background
		fontFamily: typography.primaryRegular,
		fontSize: typography.fontSizes.m,
	},
	errorText: {
		color: colors.textError, // Theme error color
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	noNotificationsText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		textAlign: "center",
		marginTop: spacing.s,
	},
	markAllReadLink: {
		color: colors.textLink, // Use theme link color
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	sectionHeader: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primarySemiBold,
		color: colors.textSecondary, // Muted text for section headers
		backgroundColor: colors.backgroundCard, // Slightly different bg for section header
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
		borderTopWidth: StyleSheet.hairlineWidth, // Optional: add top border too
		borderTopColor: colors.borderDefault,
	},
	notificationItemContainer: {
		flexDirection: "row",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.m,
		backgroundColor: colors.backgroundCard, // Dark card background for items
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault, // Themed border
	},
	unreadNotification: {
		backgroundColor: colors.primaryDark, // Darker shade for unread items on dark theme
		// Or a slightly lighter shade of backgroundCard if primaryDark is too strong
		// e.g. colors.backgroundCardSlightlyLighter (define in theme)
		borderLeftWidth: 3,
		borderLeftColor: colors.primary, // Accent color for unread indicator
		paddingLeft: spacing.m - 3, // Adjust padding to account for border
	},
	iconWrapper: {
		marginRight: spacing.m,
		alignItems: "center",
		justifyContent: "center", // Center icon vertically
		width: 32, // Fixed width for alignment
	},
	// notificationIcon: { // Replaced by MaterialIcons
	//  fontSize: 22,
	//  color: colors.primary,
	// },
	notificationContent: {
		flex: 1,
	},
	notificationTitle: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text for title
		marginBottom: spacing.xxs,
	},
	notificationSubtitle: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text for subtitle
		lineHeight: typography.lineHeights.getForSize(
			typography.fontSizes.s,
			"body"
		),
		marginBottom: spacing.xs,
	},
	notificationFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	timestamp: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // More muted for timestamp
	},
	detailsLink: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primarySemiBold,
		color: colors.textLink, // Theme link color
	},
});

export default NotificationsScreen;

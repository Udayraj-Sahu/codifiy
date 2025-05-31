// src/screens/Owner/OwnerDashboardScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { OwnerStackParamList } from "../../navigation/types";
import { logoutUser } from "../../store/slices/authSlice";
import {
    ActivityItemData,
    fetchOwnerKpiStatsThunk,
    fetchOwnerRecentActivityThunk,
    KpiStatsData, // Assuming KpiStatsData is the type for rawKpiStats
    // KpiCardDisplayData, // This was for the transformed data, which is good
} from "../../store/slices/ownerDashboardSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// --- Helper Functions (Themed Icons) ---
const deriveIconDetailsFromActivityType = (type?: string): { name: keyof typeof MaterialIcons.glyphMap; color: string } => {
    switch (type?.toUpperCase()) {
        case "NEW_USER": return { name: "person-add", color: colors.info };
        case "NEW_BOOKING": return { name: "event-note", color: colors.primary };
        case "BOOKING_CONFIRMED": return { name: "check-circle", color: colors.success };
        case "BOOKING_CANCELLED": return { name: "cancel", color: colors.error };
        case "DOC_SUBMITTED": return { name: "upload-file", color: colors.warning };
        case "DOC_APPROVED": return { name: "verified-user", color: colors.success };
        case "DOC_REJECTED": return { name: "report-problem", color: colors.error };
        case "BIKE_ADDED": return { name: "add-circle", color: colors.success };
        default: return { name: "info", color: colors.textSecondary };
    }
};

const formatActivityTimestamp = (isoDate?: string): string => {
    if (!isoDate) return "Some time ago";
    try {
        const date = new Date(isoDate);
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        if (diffSeconds < 5) return "Just now";
        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        const diffMinutes = Math.round(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 168) return `${Math.round(diffHours / 24)}d ago`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) { return "A while ago"; }
};

// --- Reusable Components (Themed) ---
interface KpiCardDisplayData { // Keep this for clarity
    id: string;
    label: string;
    value: string | number;
    iconName: keyof typeof MaterialIcons.glyphMap;
    backgroundColor?: string; // Specific background for the card itself
    iconColor?: string;       // Specific color for this icon
}
const KpiCard: React.FC<{ item: KpiCardDisplayData }> = ({ item }) => (
    <View style={[styles.kpiCard, { backgroundColor: item.backgroundColor || colors.backgroundCard }]}>
        <MaterialIcons name={item.iconName} size={28} color={item.iconColor || colors.primary} style={styles.kpiIconThemed} />
        <Text style={styles.kpiValue}>{item.value}</Text>
        <Text style={styles.kpiLabel}>{item.label}</Text>
    </View>
);

interface DisplayActivityItem extends ActivityItemData {
    iconName: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    formattedTimestamp: string;
    action?: () => void;
}
const ActivityListItem: React.FC<{ item: DisplayActivityItem }> = ({ item }) => (
    <TouchableOpacity
        style={styles.activityItem}
        onPress={item.action}
        disabled={!item.action}
        activeOpacity={item.action ? 0.7 : 1}>
        <MaterialIcons name={item.iconName} size={22} color={item.iconColor} style={styles.activityItemIconThemed} />
        <View style={styles.activityItemTextContainer}>
            <Text style={styles.activityItemMessage} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.activityItemTimestamp}>{item.formattedTimestamp}</Text>
        </View>
        {item.action && <MaterialIcons name="chevron-right" size={24} color={colors.iconDefault} />}
    </TouchableOpacity>
);

interface QuickActionData {
    id: string;
    label: string;
    iconName: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
}
const QuickActionTile: React.FC<{ item: QuickActionData }> = ({ item }) => (
    <TouchableOpacity style={styles.quickActionTile} onPress={item.onPress} activeOpacity={0.7}>
        <View style={styles.quickActionTileIconContainer}>
            <MaterialIcons name={item.iconName} size={28} color={colors.primary} />
        </View>
        <Text style={styles.quickActionTileLabel}>{item.label}</Text>
    </TouchableOpacity>
);

type ScreenNavigationProp = StackNavigationProp<OwnerStackParamList, "OwnerDashboard">;
interface OwnerDashboardScreenProps { navigation: ScreenNavigationProp; }

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        kpiStats: rawKpiStats,
        recentActivity: rawRecentActivity,
        isLoadingKpis,
        isLoadingActivity,
        errorKpis,
        errorActivity,
    } = useSelector((state: RootState) => state.ownerDashboard);
    const authUser = useSelector((state: RootState) => state.auth.user);

    const loadDashboardData = useCallback((isRefreshing = false) => {
        // Internal checks prevent re-dispatch if already loading,
        // so isLoadingKpis/isLoadingActivity are not needed in dependency array.
        if (!isRefreshing && (isLoadingKpis || (isLoadingActivity && rawRecentActivity.length === 0))) { // Adjusted condition
             console.log("Dashboard: Already loading initial data or refreshing, skipping.");
            return;
        }
        console.log("Dashboard: Fetching data, isRefreshing:", isRefreshing);
        dispatch(fetchOwnerKpiStatsThunk());
        dispatch(fetchOwnerRecentActivityThunk({ limit: 6 }));
    }, [dispatch, rawRecentActivity.length]); // Added rawRecentActivity.length to re-evaluate if it's empty and needs loading

    useEffect(() => {
        loadDashboardData(); // Initial load
        const unsubscribeFocus = navigation.addListener("focus", () => {
            console.log("Dashboard: Screen focused, reloading data.");
            loadDashboardData(true); // Refresh on focus
        });
        return unsubscribeFocus;
    }, [navigation, loadDashboardData]); // loadDashboardData is now stable

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: () => dispatch(logoutUser()) },
        ]);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Owner Dashboard",
            headerTitleAlign: "center",
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate("OwnerProfileScreen" as any)} style={{ marginLeft: spacing.m }}>
                    <MaterialIcons name="account-circle" size={28} color={colors.iconWhite} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.s }}>
                    <TouchableOpacity onPress={() => navigation.navigate("OwnerSettingsScreen" as any)} style={{ paddingHorizontal: spacing.s }}>
                        <MaterialIcons name="settings" size={24} color={colors.iconWhite} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={{ paddingLeft: spacing.s, paddingRight: spacing.xs }}>
                        <MaterialIcons name="logout" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>
            ),
            // Ensure headerStyle uses dark theme colors if not handled by a global navigator option
            // headerStyle: { backgroundColor: colors.backgroundHeader },
            // headerTintColor: colors.textPrimary, // For title and back button if not custom
        });
    }, [navigation, handleLogout]);

    const displayKpis: KpiCardDisplayData[] = useMemo(() => {
        // Define themed colors for KPI cards here or pass them from a config
        // These colors should provide good contrast on colors.backgroundCard
        const kpiThemes = {
            totalBikes: { icon: "directions-bike" as const, bg: colors.infoMuted, iconColor: colors.info },
            registeredUsers: { icon: "people" as const, bg: colors.successMuted, iconColor: colors.success },
            activeBookings: { icon: "event-available" as const, bg: colors.warningMuted, iconColor: colors.warning },
            pendingDocuments: { icon: "pending-actions" as const, bg: colors.errorMuted, iconColor: colors.error },
        };
        return [
            { id: "s1", label: "Total Bikes", value: rawKpiStats.totalBikes ?? "N/A", iconName: kpiThemes.totalBikes.icon, backgroundColor: kpiThemes.totalBikes.bg, iconColor: kpiThemes.totalBikes.iconColor },
            { id: "s2", label: "Total Users", value: rawKpiStats.registeredUsers ?? "N/A", iconName: kpiThemes.registeredUsers.icon, backgroundColor: kpiThemes.registeredUsers.bg, iconColor: kpiThemes.registeredUsers.iconColor },
            { id: "s3", label: "Active Bookings", value: rawKpiStats.activeBookings ?? "N/A", iconName: kpiThemes.activeBookings.icon, backgroundColor: kpiThemes.activeBookings.bg, iconColor: kpiThemes.activeBookings.iconColor },
            { id: "s4", label: "Pending Docs", value: rawKpiStats.pendingDocuments ?? "N/A", iconName: kpiThemes.pendingDocuments.icon, backgroundColor: kpiThemes.pendingDocuments.bg, iconColor: kpiThemes.pendingDocuments.iconColor },
        ];
    }, [rawKpiStats]);

    const displayRecentActivity: DisplayActivityItem[] = useMemo(() => {
        return rawRecentActivity.map((act) => {
            const iconDetails = deriveIconDetailsFromActivityType(act.type);
            return {
                ...act,
                iconName: iconDetails.name,
                iconColor: iconDetails.color,
                formattedTimestamp: formatActivityTimestamp(act.timestamp),
                action: () => {
                    if (act.type === "DOC_SUBMITTED" && act.relatedDetails?.documentId) {
                        navigation.navigate("DocumentApprovalListScreen", { filter: "pending" });
                    } else if (act.type === "NEW_BOOKING" && act.relatedDetails?.bookingId) {
                        navigation.navigate("OwnerManageBookingsScreen", { initialFilter: "Active" });
                    } else if (act.type === "NEW_USER" && act.relatedDetails?.userId) {
                        navigation.navigate("RoleManagementScreen");
                    }
                },
            };
        });
    }, [rawRecentActivity, navigation]);

    const QUICK_ACTIONS: QuickActionData[] = [
        { id: "qa1", label: "User Roles", iconName: "admin-panel-settings", onPress: () => navigation.navigate("RoleManagementScreen") },
        { id: "qa2", label: "Bookings", iconName: "event-note", onPress: () => navigation.navigate("OwnerManageBookingsScreen") },
        { id: "qa3", label: "Documents", iconName: "folder-shared", onPress: () => navigation.navigate("DocumentApprovalListScreen", { filter: "pending" }) },
        { id: "qa4", label: "My Bikes", iconName: "two-wheeler", onPress: () => navigation.navigate("OwnerBikeListScreen" as any) }, // Assuming this screen exists
    ];

    const renderKpiSection = () => {
        if (isLoadingKpis && displayKpis.every((s) => s.value === "N/A")) return <ActivityIndicator color={colors.primary} style={styles.sectionLoader} />;
        if (errorKpis) return <Text style={styles.errorText}>Error loading stats: {errorKpis}</Text>;
        if (displayKpis.length === 0 || displayKpis.every((s) => s.value === "N/A" && !isLoadingKpis)) return <Text style={styles.noDataText}>No statistics available.</Text>;
        return <View style={styles.statsGrid}>{displayKpis.map((kpi) => (<KpiCard key={kpi.id} item={kpi} />))}</View>;
    };

    const renderActivitySection = () => {
        if (isLoadingActivity && displayRecentActivity.length === 0) return <ActivityIndicator color={colors.primary} style={styles.sectionLoader} />;
        if (errorActivity) return <Text style={styles.errorText}>Error loading activity: {errorActivity}</Text>;
        if (displayRecentActivity.length === 0 && !isLoadingActivity) return <Text style={styles.noDataText}>No recent activity.</Text>;
        return <View style={styles.activityListContainer}>{displayRecentActivity.map((activity) => (<ActivityListItem key={activity.id} item={activity} />))}</View>;
    };

    return (
        <ScrollView
            style={styles.screenContainer}
            contentContainerStyle={styles.scrollContentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isLoadingKpis || isLoadingActivity}
                    onRefresh={() => loadDashboardData(true)}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }>
            <Text style={styles.welcomeTitle}>Welcome, {authUser?.fullName?.split(' ')[0] || "Owner"}!</Text>
            <Text style={styles.welcomeSubtitle}>Here's an overview of your Bikya platform.</Text>

            {renderKpiSection()}

            <Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
                {QUICK_ACTIONS.map((action) => ( <QuickActionTile key={action.id} item={action} /> ))}
            </View>

            <Text style={styles.sectionHeaderTitle}>Recent Activity</Text>
            {renderActivitySection()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.backgroundMain, // Dark theme background
    },
    scrollContentContainer: {
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    welcomeTitle: {
        fontSize: typography.fontSizes.xxxl,
        fontFamily: typography.primaryBold,
        color: colors.textPrimary, // Light text
        marginBottom: spacing.xs,
    },
    welcomeSubtitle: {
        fontSize: typography.fontSizes.l,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary, // Muted light text
        marginBottom: spacing.xl,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: spacing.l,
    },
    kpiCard: { // Background color is passed as prop
        width: "48%",
        padding: spacing.m,
        borderRadius: borderRadius.l,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.m,
        borderWidth: 1, // Subtle border for cards on dark bg
        borderColor: colors.borderDefault,
        aspectRatio: 1.1,
    },
    kpiIconThemed: { // For MaterialIcons in KpiCard
        marginBottom: spacing.s,
    },
    kpiValue: {
        fontSize: typography.fontSizes.xxl,
        fontFamily: typography.primaryBold,
        color: colors.textPrimary,
        marginBottom: spacing.xxs,
    },
    kpiLabel: {
        fontSize: typography.fontSizes.s,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary,
        textAlign: "center",
    },
    sectionHeaderTitle: {
        fontSize: typography.fontSizes.xl, // Larger section titles
        fontFamily: typography.primaryBold,
        color: colors.textPrimary,
        marginBottom: spacing.m,
        marginTop: spacing.l, // More space above section titles
    },
    quickActionsContainer: {
        flexDirection: "row",
        justifyContent: "space-around", // Or space-between with padding
        marginBottom: spacing.l,
        backgroundColor: colors.backgroundCard, // Card background for this section
        paddingVertical: spacing.m,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    quickActionTile: {
        alignItems: "center",
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.xs, // Allow more tiles if labels are short
        width: "23%", // For 4 items, adjust if 3
        minHeight: 90, // Ensure consistent height
        justifyContent: 'center',
    },
    quickActionTileIconContainer: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.circle,
        backgroundColor: colors.backgroundMain, // Slightly different from card for depth
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.s,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    quickActionTileLabel: {
        fontSize: typography.fontSizes.xs,
        fontFamily: typography.primaryMedium,
        color: colors.textSecondary, // Muted text for labels
        textAlign: "center",
        marginTop: spacing.xs,
    },
    activityListContainer: {
        backgroundColor: colors.backgroundCard, // Card background for activity list
        borderRadius: borderRadius.l,
        paddingHorizontal: spacing.s,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    activityItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.m,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderDefault, // Themed border
    },
    activityItemIconThemed: { // For MaterialIcons in ActivityListItem
        marginRight: spacing.m,
        width: 24, // Fixed width for alignment
        textAlign: "center",
    },
    activityItemTextContainer: { flex: 1, marginRight: spacing.s },
    activityItemMessage: {
        fontSize: typography.fontSizes.s,
        fontFamily: typography.primaryRegular,
        color: colors.textPrimary, // Light text
    },
    activityItemTimestamp: {
        fontSize: typography.fontSizes.xs,
        fontFamily: typography.primaryRegular,
        color: colors.textPlaceholder, // More muted for timestamp
        marginTop: spacing.xxs,
    },
    // activityItemArrow removed, using MaterialIcons now
    sectionLoader: {
        marginVertical: spacing.l,
        alignSelf: 'center',
    },
    errorText: {
        color: colors.textError, // Themed error color
        textAlign: "center",
        paddingVertical: spacing.l,
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
    },
    noDataText: {
        color: colors.textSecondary, // Muted light text
        textAlign: "center",
        paddingVertical: spacing.l,
        fontStyle: "italic",
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
    },
});

export default OwnerDashboardScreen;

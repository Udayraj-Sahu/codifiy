// src/screens/Owner/OwnerBookingDetailsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState, useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
} from "react-native";
// PrimaryButton is not used on this screen directly in the provided code.
// import PrimaryButton from "../../../components/common/PrimaryButton";
import {
    BookingStatusOwnerView, // Assuming this type is 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | 'All'
    OwnerStackParamList,
} from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons

// --- Types and Dummy Data (structure remains, placeholders updated for dark theme) ---
type RideStatus = Exclude<BookingStatusOwnerView, "All">;

interface OwnerViewBookingDetail {
    id: string;
    bookingPlacedDate: string;
    rentalStartDate: string;
    rentalEndDate: string;
    duration?: string;
    status: RideStatus;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userPhotoUrl?: string;
    bikeId: string;
    bikeName: string;
    bikeModel?: string;
    bikeRegistrationNo?: string;
    bikeImageUrl?: string;
    priceBreakdown: {
        baseRate?: string;
        discountApplied?: string;
        taxesAndFees?: string;
        totalAmount: string;
    };
    paymentMethod?: string;
    paymentStatus?: "Paid" | "Pending" | "Refunded" | "Failed";
    transactionId?: string;
    assignedAdminName?: string;
}

const DUMMY_OWNER_VIEW_BOOKING_DETAILS: { [key: string]: OwnerViewBookingDetail; } = {
    bk001: { id: "bk001", bookingPlacedDate: "Jan 10, 2025, 08:30 PM", rentalStartDate: "2025-01-12T14:00:00Z", rentalEndDate: "2025-01-14T14:00:00Z", duration: "2 days", status: "Active", userId: "u001", userName: "John Doe", userEmail: "john.d@example.com", userPhone: "+1-555-0101", userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=JD", bikeId: "BX2938", bikeName: "Mountain X Pro", bikeModel: "MX Pro 2024", bikeRegistrationNo: "KA01MX2938", bikeImageUrl: "https://placehold.co/120x90/1A1A1A/F5F5F5?text=MountainX", priceBreakdown: { baseRate: "₹400 x 2 days = ₹800", discountApplied: "-₹50 (FIRST10)", taxesAndFees: "₹135", totalAmount: "₹885.00" }, paymentMethod: "Visa **** 1234", paymentStatus: "Paid", transactionId: "txn_abc123xyz", assignedAdminName: "Sarah Khan" },
    bk002: { id: "bk002", bookingPlacedDate: "Jan 07, 2025, 11:00 AM", rentalStartDate: "2025-01-08T10:00:00Z", rentalEndDate: "2025-01-10T10:00:00Z", duration: "2 days", status: "Completed", userId: "u002", userName: "Priya Sharma", userEmail: "priya.s@example.com", userPhone: "+91-98XXXXXX02", userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=PS", bikeId: "RX2000", bikeName: "Roadster 2K Deluxe", bikeModel: "R2000 Deluxe", bikeImageUrl: "https://placehold.co/120x90/1A1A1A/F5F5F5?text=Roadster", priceBreakdown: { baseRate: "₹300 x 2 days = ₹600", taxesAndFees: "₹108", totalAmount: "₹708.00" }, paymentMethod: "UPI", paymentStatus: "Paid", transactionId: "txn_def456uvw", assignedAdminName: "Admin Bot" },
    bk003: { id: "bk003", bookingPlacedDate: "Jan 04, 2025, 09:30 AM", rentalStartDate: "2025-01-05T10:00:00Z", rentalEndDate: "2025-01-06T17:00:00Z", duration: "1 day, 7 hours", status: "Cancelled", userId: "u003", userName: "Mike Johnson", userEmail: "mike.j@example.com", userPhone: "+1-555-0102", userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=MJ", bikeId: "CC100", bikeName: "City Cruiser Ltd", bikeModel: "CC Ltd 2022", bikeImageUrl: "https://placehold.co/120x90/1A1A1A/F5F5F5?text=Cruiser", priceBreakdown: { baseRate: "₹150 x 1 day = ₹150", taxesAndFees: "₹27", totalAmount: "₹177.00 (Cancelled)" }, paymentMethod: "Visa **** 6789", paymentStatus: "Refunded", transactionId: "txn_ghi789jkl", assignedAdminName: "System" },
};

const fetchOwnerBookingDetailsAPI = async (bookingId: string): Promise<OwnerViewBookingDetail | null> => {
    console.log(`OWNER: Fetching details for booking ID: ${bookingId}`);
    return new Promise((resolve) =>
        setTimeout(() => resolve(DUMMY_OWNER_VIEW_BOOKING_DETAILS[bookingId] || null), 300)
    );
};
// --- End Dummy Data ---

// Helper to render detail rows (Themed)
const DetailRow: React.FC<{
    label: string;
    value?: string | number | null;
    valueStyle?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    iconName?: keyof typeof MaterialIcons.glyphMap; // Changed from iconPlaceholder
}> = ({ label, value, valueStyle, children, iconName }) => {
    if ((value === undefined || value === null || value === "") && !children) return null;
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
                {iconName && (
                    <MaterialIcons name={iconName} size={18} color={colors.iconDefault} style={styles.detailRowIconThemed} />
                )}
                <Text style={styles.detailLabel}>{label}:</Text>
            </View>
            {value !== undefined && value !== null && (
                <Text style={[styles.detailValue, valueStyle]}>{String(value)}</Text>
            )}
            {children}
        </View>
    );
};

type ScreenRouteProp = RouteProp<OwnerStackParamList, "OwnerBookingDetailsScreen">;
type ScreenNavigationProp = StackNavigationProp<OwnerStackParamList, "OwnerBookingDetailsScreen">;

interface OwnerBookingDetailsScreenProps {
    route: ScreenRouteProp;
    navigation: ScreenNavigationProp;
}

const OwnerBookingDetailsScreen: React.FC<OwnerBookingDetailsScreenProps> = ({
    route,
    navigation,
}) => {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState<OwnerViewBookingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const bikeImagePlaceholder = 'https://placehold.co/400x250/1A1A1A/F5F5F5?text=Bike';
    const userPhotoPlaceholder = 'https://placehold.co/60x60/1A1A1A/F5F5F5?text=User';


    useLayoutEffect(() => {
        if (booking) {
            navigation.setOptions({ title: `Booking #${booking.id.slice(-6).toUpperCase()}` });
        } else if (bookingId) {
            navigation.setOptions({ title: `Booking #${bookingId.slice(-6).toUpperCase()}` });
        } else {
            navigation.setOptions({ title: "Booking Details" });
        }
    }, [navigation, booking, bookingId]);

    useEffect(() => {
        const loadBooking = async () => {
            if (!bookingId) {
                Alert.alert("Error", "Booking ID missing.", [{ text: "OK", onPress: () => navigation.goBack() }]);
                setIsLoading(false); return;
            }
            setIsLoading(true);
            const fetchedBooking = await fetchOwnerBookingDetailsAPI(bookingId);
            setBooking(fetchedBooking);
            setIsLoading(false);
            if (!fetchedBooking) {
                Alert.alert("Error", "Booking not found.", [{ text: "OK", onPress: () => navigation.goBack() }]);
            }
        };
        loadBooking();
    }, [bookingId, navigation]);

    const formatDate = (dateString?: string, includeTime: boolean = true): string => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
            if (includeTime) {
                options.hour = "numeric"; options.minute = "2-digit"; options.hour12 = true;
            }
            return date.toLocaleString(undefined, options);
        } catch { return "Invalid Date"; }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.centered}>
                <MaterialIcons name="error-outline" size={48} color={colors.textDisabled} />
                <Text style={styles.errorText}>Booking details could not be loaded.</Text>
                {/* Optional: Add a button to go back or retry */}
            </View>
        );
    }

    const getStatusDisplay = (status: RideStatus): { color: string; iconName: keyof typeof MaterialIcons.glyphMap } => {
        switch (status) {
            case "Active": return { color: colors.success, iconName: "play-circle-filled" };
            case "Upcoming": return { color: colors.info, iconName: "event" };
            case "Completed": return { color: colors.textDisabled, iconName: "check-circle" }; // Muted for completed
            case "Cancelled": return { color: colors.error, iconName: "cancel" };
            default: return { color: colors.textSecondary, iconName: "help-outline" };
        }
    };
    const statusDisplay = getStatusDisplay(booking.status);

    return (
        <ScrollView
            style={styles.screenContainer}
            contentContainerStyle={styles.scrollContentContainer}>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Booking Overview</Text>
                <DetailRow label="Booking ID" value={`#${booking.id.toUpperCase()}`} iconName="confirmation-number"/>
                <DetailRow label="Status" value={booking.status} valueStyle={{ color: statusDisplay.color, fontFamily: typography.primaryBold }} iconName={statusDisplay.iconName}/>
                <DetailRow label="Booked On" value={formatDate(booking.bookingPlacedDate, false)} iconName="today"/>
                <DetailRow label="Start Time" value={formatDate(booking.rentalStartDate)} iconName="event-available"/>
                <DetailRow label="End Time" value={formatDate(booking.rentalEndDate)} iconName="event-busy"/>
                {booking.duration && <DetailRow label="Duration" value={booking.duration} iconName="hourglass-empty"/>}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>User Information</Text>
                <View style={styles.userHeader}>
                    <Image source={{ uri: booking.userPhotoUrl || userPhotoPlaceholder }} style={styles.userPhoto} />
                    <View style={styles.userInfoTextContainer}>
                        <DetailRow label="Name" value={booking.userName} iconName="person"/>
                        <DetailRow label="Email" value={booking.userEmail} iconName="email"/>
                        {booking.userPhone && <DetailRow label="Phone" value={booking.userPhone} iconName="phone"/>}
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Bike Information</Text>
                {booking.bikeImageUrl && (
                    <Image source={{ uri: booking.bikeImageUrl || bikeImagePlaceholder }} style={styles.bikeImage} />
                )}
                <DetailRow label="Bike Name" value={booking.bikeName} iconName="directions-bike"/>
                {booking.bikeModel && <DetailRow label="Model" value={booking.bikeModel} iconName="info-outline"/>}
                {booking.bikeRegistrationNo && <DetailRow label="Reg. No." value={booking.bikeRegistrationNo} iconName="article"/>}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Payment Details</Text>
                {booking.priceBreakdown.baseRate && <DetailRow label="Base Rate" value={booking.priceBreakdown.baseRate} iconName="payments"/>}
                {booking.priceBreakdown.discountApplied && <DetailRow label="Discount" value={booking.priceBreakdown.discountApplied} valueStyle={styles.discountText} iconName="local-offer"/>}
                {booking.priceBreakdown.taxesAndFees && <DetailRow label="Taxes & Fees" value={booking.priceBreakdown.taxesAndFees} iconName="receipt-long"/>}
                <View style={styles.totalDivider} />
                <DetailRow label="Total Amount" value={booking.priceBreakdown.totalAmount} valueStyle={styles.totalAmountText} iconName="monetization-on"/>
                {booking.paymentMethod && <DetailRow label="Method" value={booking.paymentMethod} iconName="credit-card"/>}
                {booking.paymentStatus && <DetailRow label="Pay Status" value={booking.paymentStatus} valueStyle={{ color: booking.paymentStatus === "Paid" ? colors.success : (booking.paymentStatus === "Refunded" ? colors.info : colors.error), fontFamily: typography.primarySemiBold }} iconName="credit-score"/>}
                {booking.transactionId && <DetailRow label="Transaction ID" value={booking.transactionId} iconName="vpn-key"/>}
            </View>

            {booking.assignedAdminName && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Managed By</Text>
                    <DetailRow label="Staff" value={booking.assignedAdminName} iconName="admin-panel-settings"/>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.backgroundMain, // Dark theme
    },
    scrollContentContainer: {
        padding: spacing.m,
        paddingBottom: spacing.xl,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.backgroundMain, // Dark theme
        padding: spacing.l,
    },
    loadingText: {
        marginTop: spacing.s,
        color: colors.textSecondary, // Light text on dark
        fontFamily: typography.primaryRegular,
        fontSize: typography.fontSizes.m,
    },
    errorText: { // Added for consistency
        marginTop: spacing.s,
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
        color: colors.textError,
        textAlign: 'center',
    },
    notFoundText: { // Added for consistency
        marginTop: spacing.s,
        fontSize: typography.fontSizes.l,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.backgroundCard, // Dark card background
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.l, // Increased space
        borderWidth: 1, // Subtle border for definition
        borderColor: colors.borderDefault,
    },
    sectionTitle: {
        fontSize: typography.fontSizes.l, // Adjusted size
        fontFamily: typography.primaryBold,
        color: colors.textPrimary, // Light text
        marginBottom: spacing.m,
        paddingBottom: spacing.s,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderDefault, // Themed border
    },
    userHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.s, // Adjusted margin
    },
    userPhoto: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.circle, // Circular
        marginRight: spacing.m,
        backgroundColor: colors.borderDefault, // Dark placeholder background
    },
    userInfoTextContainer: { flex: 1 },
    bikeImage: {
        width: "100%",
        height: 180,
        borderRadius: borderRadius.m,
        marginBottom: spacing.m,
        backgroundColor: colors.borderDefault, // Dark placeholder background
        resizeMode: "cover",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: spacing.s - 2, // Fine-tuned padding
        alignItems: "flex-start",
    },
    detailLabelContainer: {
        flexDirection: "row",
        alignItems: "center", // Align icon with label text
        flex: 0.45, // Give label part defined space
        marginRight: spacing.xs,
    },
    detailRowIconThemed: { // For MaterialIcons in DetailRow
        marginRight: spacing.s,
        marginTop: spacing.xxs, // Align icon better
    },
    // detailRowIcon removed (was for emoji), using detailRowIconThemed for MaterialIcons
    detailLabel: {
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary, // Muted light text
    },
    detailValue: { // Base style for values
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryMedium,
        color: colors.textPrimary, // Light text
        textAlign: "right",
        flex: 0.55, // Give value part defined space
    },
    discountText: { // Specific style for discount value
        color: colors.success, // Bright success color
        fontFamily: typography.primaryMedium,
    },
    totalDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.borderDefault,
        marginVertical: spacing.s,
    },
    totalAmountText: { // For the main total amount in payment summary
        fontFamily: typography.primaryBold,
        color: colors.primary, // Accent color for total
        fontSize: typography.fontSizes.l,
    },
    // Action buttons removed from this screen's direct styles
});

export default OwnerBookingDetailsScreen;
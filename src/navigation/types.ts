// src/navigation/types.ts
import { NavigatorScreenParams, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Interface for filters if you haven't defined it elsewhere
export interface AppliedFilters {
	distance?: number;
	bikeTypes?: string[];
	pricePerHourMin?: number;
	pricePerHourMax?: number;
	availability?: "now" | "today";
	minRating?: number;
	verifiedOwner?: boolean;
	freeHelmet?: boolean;
	lowDeposit?: boolean;
	instantBooking?: boolean;
}

export type HomeStackParamList = {
	HomeScreenRoot: undefined;
	NotificationsScreen: undefined; // Changed name to avoid conflict if 'HomeScreen' is used elsewhere
	// Example: NotificationsScreen: undefined; // If bell icon navigates within this stack
	// Example: SearchResultsScreen: { query: string }; // If search navigates within this stack
};

// 1. Authentication Flow
export type AuthStackParamList = {
	Login: undefined;
	Signup: undefined;
	ForgotPassword?: { email?: string };
	OTP?: {
		verificationId: string;
		usage?: "signup" | "resetPassword" | "general";
	};
};

// 2. Main User Flow

// == Explore Tab ==
export type ExploreStackParamList = {
	Explore: { appliedFilters?: AppliedFilters } | undefined;
	BikeDetails: { bikeId: string };
	Booking: { bikeId: string; startDate?: string; endDate?: string };
	ApplyPromoCode: {
		/* ... */
	};
	BookingConfirmation: { bookingId: string };
	Filter: undefined; // This is the modal for setting filters
	DocumentUploadScreen_FromExplore?: { fromBooking?: boolean };
	SearchResults: {
		// NEW
		query?: string; // The search query text
		filters?: AppliedFilters; // The filters applied
		// You can add more params like initialSortOption if needed
	};
};
// == My Rentals/Bookings Tab ==
export type RentalsStackParamList = {
	MyRentalsScreen: undefined;
	RideDetailsScreen: { bookingId: string };
	EndRideScreen: { bookingId: string; bikeName?: string };
};

// == Documents Tab ==

export type DocumentStatusAdmin = "pending" | "approved" | "rejected" | "all";

export type AdminStackParamList = {
	AdminDashboard: undefined;
	AdminManageBikes: undefined;
	AdminBikeForm: { bikeId?: string };
	AdminManageBookings: { initialFilter?: BookingStatusAdmin } | undefined;
	AdminBookingDetails: { bookingId: string };
	// AdminDocumentList was for the general "View Document" from dashboard,
	// this new screen is specifically for "Approved Documents".
	// We can rename AdminDocumentList or add this as a new distinct screen
	AdminDocumentList: { initialStatus?: DocumentStatusAdmin } | undefined;
	// Let's add it as new for now, as its functionality is specific.
	AdminApprovedDocumentsScreen:
		| { initialFilter?: "All" | "Today" | "This Week" | "This Month" }
		| undefined; // NEW
	AdminDocumentViewerScreen: {
		// Ensure params are suitable
		documentId?: string; // If fetching details by ID
		documentImageUrl?: string; // If URL is passed directly
		userName?: string;
		documentType?: string; // Optional to display
		status?: string; // Optional to display
	};
	AdminNotifications: undefined;
	AdminProfile: undefined;
	AdminBookingFilterModal: { currentFilters: any } | undefined;

	// ... other admin-specific screens
};

// Define Booking Status for Admin
export type BookingStatusAdmin = "Active" | "Completed" | "Cancelled" | "All";

// == Profile Tab ==
export type ProfileStackParamList = {
	Profile: undefined;
	EditProfile: undefined;
	Settings: undefined;
	MyRentalsScreen: undefined; // NEW - For listing all rentals
	RideDetailsScreen: { bookingId: string }; // Screen to show details of a specific rental
	EndRideScreen: { bookingId: string; bikeName?: string }; // Screen to end an active ride
	ChangePasswordScreen: undefined;
	NotificationPreferencesScreen: undefined;
	LanguageSelectionScreen: undefined;
	TwoFactorAuthScreen: undefined;
	DataPrivacyScreen: undefined;
	FAQScreen: undefined;
	ContactSupportScreen: undefined;
	WebViewScreen?: { title: string; url?: string; content?: string };
	AboutScreen?: undefined;
	DocumentUploadScreen?: {
		// <<< ADD THIS
		documentType?: "driversLicense" | "idCard";
		isVerificationRequired?: boolean;
	};
};

export type BookingStatusOwnerView =
	| "Active"
	| "Completed"
	| "Cancelled"
	| "All";

export type DocumentStatusOwner = "pending" | "approved" | "rejected" | "all";
export type OwnerStackParamList = {
	OwnerDashboard: undefined;
	RoleManagementScreen: undefined; // To manage user roles (promote/demote)
	OwnerManageBookingsScreen:
		| { initialFilter?: BookingStatusOwnerView }
		| undefined; // Current screen
	OwnerBookingDetailsScreen: { bookingId: string }; // NEW: For viewing details
	OwnerBookingFilterModal: { currentFilters: any } | undefined; // NEW: For header filter
	OwnerDocumentViewerScreen: {
		// NEW or ensure it's specific for Owner
		documentId?: string;
		documentImageUrl?: string;
		userName?: string;
		documentType?: string;
		status?: Exclude<DocumentStatusOwner, "all">;
	};
	DocumentApprovalListScreen: {
		filter?: "pending" | "approved" | "rejected";
	}; // To approve/reject documents
	// DocumentReviewScreen: { documentId: string }; // Detail view for a specific document
	AppStatisticsScreen: undefined; // For app usage stats
	// Could reuse SettingsScreen or be specific
	// ... other owner-specific screens
};

export type WalletStackParamList = {
	WalletPaymentsScreen: undefined; // Main screen for wallet
	AddMoneyScreen: undefined; // For adding money to wallet
	TransactionHistoryScreen: undefined; // For full transaction list
	AddPaymentMethodScreen: undefined; // For adding new cards/UPI etc.
	// ... other wallet related screens
};

// == Main Bottom Tab Navigator for Authenticated User ==
export type UserTabParamList = {
	HomeTab: NavigatorScreenParams<HomeStackParamList>;
	ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
	WalletTab: NavigatorScreenParams<WalletStackParamList>; // NEW
	ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
	// DocumentsTab: NavigatorScreenParams<DocumentStackParamList>; // REMOVED
};

// Define the specific prop types that DocumentUploadScreen can receive
export type DocumentUploadScreenNavigationProp =
	| StackNavigationProp<
			ExploreStackParamList,
			"DocumentUploadScreen_FromExplore"
	  >
	// | StackNavigationProp<DocumentStackParamList, 'DocumentUploadScreen'> // If DocumentStack is fully removed for user
	| StackNavigationProp<ProfileStackParamList, "DocumentUploadScreen">; // ADDED

export type DocumentUploadScreenRouteProp =
	| RouteProp<ExploreStackParamList, "DocumentUploadScreen_FromExplore">
	// | RouteProp<DocumentStackParamList, 'DocumentUploadScreen'>
	| RouteProp<ProfileStackParamList, "DocumentUploadScreen">; // ADDED

export interface DocumentUploadScreenProps {
	// This interface is used by DocumentUploadScreen.tsx
	navigation: DocumentUploadScreenNavigationProp;
	route: DocumentUploadScreenRouteProp;
}

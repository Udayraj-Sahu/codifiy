// src/navigation/OwnerAppNavigator.tsx
import {
	createStackNavigator,
	StackNavigationOptions,
} from "@react-navigation/stack";
import React from "react";
import { Platform } from "react-native"; // For platform-specific styling if needed

// Import Owner Screens (create these files in src/screens/Owner/ if they don't exist)
import DocumentApprovalListScreen from "../screens/Owner/DocumentApprovalListScreen"; // Placeholder
import OwnerBookingDetailsScreen from "../screens/Owner/OwnerBookingDetailsScreen";
import OwnerDashboardScreen from "../screens/Owner/OwnerDashboardScreen";
import OwnerDocumentViewerScreen from "../screens/Owner/OwnerDocumentViewerScreen"; // Placeholder
import OwnerManageBookingsScreen from "../screens/Owner/OwnerManageBookingScreen";
import RoleManagementScreen from "../screens/Owner/RoleManagementScreen";
// import AppStatisticsScreen from '../screens/Owner/AppStatisticsScreen'; // Placeholder
// For Profile and Settings, you might reuse existing user screens or create owner-specific ones
// import OwnerNotificationsScreen from '../screens/Owner/OwnerNotificationsScreen'; // Placeholder

import { colors, typography } from "../theme"; // Ensure this path is correct
import { OwnerStackParamList } from "./types"; // Ensure this path is correct

const Stack = createStackNavigator<OwnerStackParamList>();

// Default screen options for the Owner Stack
const defaultOwnerScreenOptions: StackNavigationOptions = {
	headerStyle: {
		backgroundColor: colors.white, // Or a specific Owner theme header color
		elevation: Platform.OS === "android" ? 2 : 0,
		shadowOpacity: Platform.OS === "ios" ? 0.1 : 0,
	},
	headerTintColor: colors.textPrimary, // Back arrow and title color
	headerTitleStyle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
	},

	headerTitleAlign: "center", // Default for Owner screens, can be overridden
};

const OwnerAppNavigator: React.FC = () => {
	return (
		<Stack.Navigator
			initialRouteName="OwnerDashboard"
			screenOptions={defaultOwnerScreenOptions}>
			<Stack.Screen
				name="OwnerDashboard"
				component={OwnerDashboardScreen}
				// Title, headerLeft, headerRight will be set by OwnerDashboardScreen
				// using navigation.setOptions as per its detailed prompt.
				// Example: options={{ title: "Owner Dashboard" }}
			/>
			<Stack.Screen
				name="OwnerManageBookingsScreen"
				component={OwnerManageBookingsScreen} // Create this placeholder screen
				// Title and headerRight will be set by the screen itself
			/>
			<Stack.Screen
				name="OwnerBookingDetailsScreen"
				component={OwnerBookingDetailsScreen} // Create this placeholder screen
				// Title will be set dynamically in the screen
			/>
			<Stack.Screen
				name="DocumentApprovalListScreen"
				component={DocumentApprovalListScreen} // Create this placeholder screen
				options={{ title: "Document Approvals" }}
			/>
			<Stack.Screen
				name="OwnerDocumentViewerScreen" // <<< Must match exactly
				component={OwnerDocumentViewerScreen}
				// options={{ title: 'View Document' }} // Title can be set dynamically
			/>

			<Stack.Screen
				name="RoleManagementScreen"
				component={RoleManagementScreen} // Create this placeholder screen
				options={{ title: "Manage User Roles" }}
			/>

			{/* Example for a modal filter screen, if needed for OwnerBookings or DocumentApprovalList
      <Stack.Screen
        name="OwnerBookingFilterModal"
        component={OwnerBookingFilterModalScreen} // Create this placeholder
        options={{ presentation: 'modal', title: 'Filter Bookings' }}
      />
      */}
			{/* <Stack.Screen
        name="AppStatisticsScreen"
        component={AppStatisticsScreen} // Create this placeholder screen
        options={{ title: 'App Statistics' }}
      /> */}

			{/*
      <Stack.Screen
        name="OwnerNotificationsScreen"
        component={OwnerNotificationsScreen} // Create this placeholder screen
        options={{ title: 'Notifications' }}
      />
      */}
			{/* Add other Owner-specific screens from OwnerStackParamList here as you build them */}
		</Stack.Navigator>
	);
};

export default OwnerAppNavigator;

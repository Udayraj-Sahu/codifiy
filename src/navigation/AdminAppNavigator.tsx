// src/navigation/AdminAppNavigator.tsx
import React from 'react';
import {
	createStackNavigator,
	StackNavigationOptions,
} from "@react-navigation/stack";
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen"; // We'll create this
// Import other admin screens as they are created:
import ScreenHeader from "../components/common/ScreenHeader"; // Assuming you want to reuse or adapt this
import AdminApprovedDocumentsScreen from "../screens/Admin/AdminApprovedDocumentsScreen";
import AdminBikeFormScreen from "../screens/Admin/AdminBikeFormScreen";
import AdminDocumentListScreen from "../screens/Admin/AdminDocumentListScreen";
import AdminManageBikesScreen from "../screens/Admin/AdminManageBikesScreen";
import AdminManageBookingsScreen from "../screens/Admin/AdminManageBookingScreen";
import AdminBookingDetailsScreen from '../screens/Admin/AdminBookingDetailsScreen';
import { AdminStackParamList } from "./types";
import AdminDocumentViewerScreen from '../screens/Admin/AdminDocumentViewerScreen';

// Common header options for Admin Stack, can be customized per screen
const adminStackScreenOptions: (navigation: any) => StackNavigationOptions = (
	navigation
) => ({
	header: ({ route, options }) => {
		const title = options.title !== undefined ? options.title : route.name;
		// Admin screens might not always have a back button if they are root of a flow or tab
		const showBackButton =
			options.headerLeft !== undefined ? true : navigation.canGoBack();

		return (
			<ScreenHeader
				title={title}
				showBackButton={showBackButton}
				onPressBack={
					showBackButton && options.headerLeft === undefined
						? () => navigation.goBack()
						: undefined
				}
				// headerLeft and headerRight can be overridden by navigation.setOptions in each screen

				// You might want a different style for admin headers
				// style={{ backgroundColor: colors.adminHeaderBackground || colors.white }}
			/>
		);
	},
});

const Stack = createStackNavigator<AdminStackParamList>();

const AdminAppNavigator: React.FC = () => {
	return (
		<Stack.Navigator
			initialRouteName="AdminDashboard"
			screenOptions={({ navigation }) =>
				adminStackScreenOptions(navigation)
			}>
			<Stack.Screen
				name="AdminDashboard"
				component={AdminDashboardScreen}
				options={{ title: "Dashboard" }}
			/>
			<Stack.Screen
				name="AdminManageBikes" // NEW
				component={AdminManageBikesScreen}
				options={{ title: "Manage Bikes" }}
			/>
			<Stack.Screen
				name="AdminBikeForm" // NEW
				component={AdminBikeFormScreen}
				// Title can be set dynamically in the screen itself (e.g., "Add Bike" or "Edit Bike")
			/>
			<Stack.Screen
				name="AdminManageBookings"
				component={AdminManageBookingsScreen}
				// Title and headerRight (filter icon) will be set by AdminManageBookingsScreen itself
			/>
			<Stack.Screen
				name="AdminApprovedDocumentsScreen"
				component={AdminApprovedDocumentsScreen}
				// Title and headerRight (search icon) will be set by AdminApprovedDocumentsScreen itself
			/>
			<Stack.Screen
				name="AdminDocumentList"
				component={AdminDocumentListScreen}
				options={({ route }) => ({
					// Title can be dynamic based on params
					title: route.params?.status
						? `${capitalizeFirstLetter(
								route.params.status
						  )} Documents`
						: "All Documents",
				})}
			/>
			<Stack.Screen
				name="AdminDocumentViewerScreen"
				component={AdminDocumentViewerScreen} // You'll need to create this screen
				options={{ title: "View Document" }}
			/>
			 <Stack.Screen
        name="AdminBookingDetails" // <<< ADD THIS SCREEN
        component={AdminBookingDetailsScreen}
        // Title can be set dynamically in the screen component
      />
			{/*
      <Stack.Screen name="AdminManageBookings" component={AdminManageBookingsScreen} options={{ title: 'Manage Bookings' }} />
      <Stack.Screen name="AdminDocumentList" component={AdminDocumentListScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ title: 'Profile' }} />
      */}
		</Stack.Navigator>
	);
};

const capitalizeFirstLetter = (string: string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};
export default AdminAppNavigator;

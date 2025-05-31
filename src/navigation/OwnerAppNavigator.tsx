// src/navigation/OwnerAppNavigator.tsx
import {
    createStackNavigator,
    StackNavigationOptions,
} from "@react-navigation/stack";
import React from "react";
import { Platform } from "react-native";

// Import Owner Screens
import DocumentApprovalListScreen from "../screens/Owner/DocumentApprovalListScreen";
import OwnerBookingDetailsScreen from "../screens/Owner/OwnerBookingDetailsScreen";
import OwnerDashboardScreen from "../screens/Owner/OwnerDashboardScreen";
import OwnerDocumentViewerScreen from "../screens/Owner/OwnerDocumentViewerScreen";
import OwnerManageBookingsScreen from "../screens/Owner/OwnerManageBookingScreen";
import RoleManagementScreen from "../screens/Owner/RoleManagementScreen";
// Import other owner screens as they are created, e.g.:
// import OwnerProfileScreen from '../screens/Owner/OwnerProfileScreen';
// import OwnerSettingsScreen from '../screens/Owner/OwnerSettingsScreen';
// import OwnerBikeListScreen from '../screens/Owner/OwnerBikeListScreen';
// import OwnerAddEditBikeScreen from '../screens/Owner/OwnerAddEditBikeScreen';


import { colors, typography, spacing } from "../theme"; // Ensure this path is correct
import { OwnerStackParamList } from "./types";

const Stack = createStackNavigator<OwnerStackParamList>();

// Default screen options for the Owner Stack (Dark Theme)
const defaultOwnerScreenOptions: StackNavigationOptions = {
    headerStyle: {
        backgroundColor: colors.backgroundHeader, // Dark header background
        elevation: 0, // Remove elevation for a flatter dark theme look on Android
        shadowOpacity: 0, // Remove shadow for iOS
        borderBottomWidth: Platform.OS === 'android' ? 0 : StyleSheet.hairlineWidth, // Optional: subtle border for iOS
        borderBottomColor: colors.borderDefault, // Themed border color
    },
    headerTintColor: colors.textPrimary, // Light color for back arrow and title if not overridden by headerTitleStyle
    headerTitleStyle: {
        fontSize: typography.fontSizes.l,
        fontFamily: typography.primarySemiBold, // Use themed font family
        color: colors.textPrimary, // Explicitly set title color to light
    },
    headerTitleAlign: "center",
    // cardStyle: { backgroundColor: colors.backgroundMain }, // Set background for the entire screen card
};

const OwnerAppNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="OwnerDashboard"
            screenOptions={defaultOwnerScreenOptions}>
            <Stack.Screen
                name="OwnerDashboard"
                component={OwnerDashboardScreen}
                // Title, headerLeft, headerRight are set dynamically by OwnerDashboardScreen
                // using navigation.setOptions. The defaultOwnerScreenOptions will apply to the header's base style.
            />
            <Stack.Screen
                name="OwnerManageBookingsScreen"
                component={OwnerManageBookingsScreen}
                options={{ title: "Manage Bookings" }} // Example title, can be overridden by screen
            />
            <Stack.Screen
                name="OwnerBookingDetailsScreen"
                component={OwnerBookingDetailsScreen}
                // Title will be set dynamically in the screen
            />
            <Stack.Screen
                name="DocumentApprovalListScreen"
                component={DocumentApprovalListScreen}
                options={{ title: "Document Approvals" }}
            />
            <Stack.Screen
                name="OwnerDocumentViewerScreen"
                component={OwnerDocumentViewerScreen}
                options={{ title: 'View Document' }} // Title can be set dynamically
            />
            <Stack.Screen
                name="RoleManagementScreen"
                component={RoleManagementScreen}
                options={{ title: "Manage User Roles" }}
            />
            {/*
            // Add these screens once they are created and imported
            <Stack.Screen
                name="OwnerProfileScreen"
                component={OwnerProfileScreen} // Replace with actual component
                options={{ title: "My Profile" }}
            />
            <Stack.Screen
                name="OwnerSettingsScreen"
                component={OwnerSettingsScreen} // Replace with actual component
                options={{ title: "Settings" }}
            />
             <Stack.Screen
                name="OwnerBikeListScreen"
                component={OwnerBikeListScreen} // Replace with actual component
                options={{ title: "My Bikes" }}
            />
             <Stack.Screen
                name="OwnerAddEditBikeScreen"
                component={OwnerAddEditBikeScreen} // Replace with actual component
                // Title can be "Add Bike" or "Edit Bike" set dynamically
            />
            */}

            {/* Add other Owner-specific screens from OwnerStackParamList here */}
        </Stack.Navigator>
    );
};

export default OwnerAppNavigator;

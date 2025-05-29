// src/navigation/AppNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useSelector } from "react-redux"; // <<< IMPORT useSelector
import { RootState } from "../store/store"; // <<< IMPORT RootState
import { colors } from "../theme";
import AdminAppNavigator from "./AdminAppNavigator";
import AuthNavigator from "./AuthNavigator";
import OwnerAppNavigator from "./OwnerAppNavigator";
import UserAppNavigator from "./UserAppNavigator";
// import { useAuth } from "../context/AuthContext"; // <<< REMOVE or comment out if Redux is the sole source of truth for navigation state

const AppNavigator: React.FC = () => {
	// Select authentication state directly from the Redux store
	const {
		isAuthenticated,
		user,
		isRestoringToken, // This flag from authSlice is crucial for initial loading
	} = useSelector((state: RootState) => state.auth);
	console.log("AppNavigator Redux State:", {
		isAuthenticated,
		userRole: user?.role,
		isRestoringToken,
	});
	// Use isRestoringToken from Redux to determine initial app loading state
	if (isRestoringToken) {
		// This will wait for Redux authSlice.restoreToken to complete
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.white, // Make sure colors.white is defined
				}}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{isAuthenticated && user ? ( // Check Redux state: user object also exists
				user.role === "Admin" ? (
					<AdminAppNavigator />
				) : user.role === "Owner" ? (
					<OwnerAppNavigator />
				) : (
					<UserAppNavigator />
				)
			) : (
				<AuthNavigator />
			)}
		</NavigationContainer>
	);
};

export default AppNavigator;

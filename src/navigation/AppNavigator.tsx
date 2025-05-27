// src/navigation/AppNavigator.tsx
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, View } from "react-native"; // For loading state
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { colors } from "../theme"; // Assuming you have theme colors
import AdminAppNavigator from "./AdminAppNavigator";
import AuthNavigator from "./AuthNavigator";
import OwnerAppNavigator from "./OwnerAppNavigator";
import UserAppNavigator from "./UserAppNavigator";

const AppNavigator: React.FC = () => {
	const { isAuthenticated, user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.white,
				}}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<NavigationContainer>
			{isAuthenticated ? (
				user?.role === "Admin" ? (
					<AdminAppNavigator /> // Check user role
				) : user?.role === "Owner" ? (
					<OwnerAppNavigator /> // TODO: Create OwnerAppNavigator
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

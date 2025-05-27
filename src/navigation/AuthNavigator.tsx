// src/navigation/AuthNavigator.tsx
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
// Import ForgotPasswordScreen, OTPScreen when created

import { AuthStackParamList } from "./types";

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
			}}
			initialRouteName="Login">
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Signup" component={SignupScreen} />
		</Stack.Navigator>
	);
};

export default AuthNavigator;

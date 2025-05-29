// src/navigation/UserAppNavigator.tsx
import {
	BottomTabNavigationOptions,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
	createStackNavigator,
	StackNavigationOptions,
} from "@react-navigation/stack";
import React ,{useMemo} from "react";
import { Text } from "react-native"; // For placeholder icons

import HomeScreen from "../screens/App/Home/HomeScreen"; // NEW
import MyRentalsScreen from "../screens/App/Rental/MyRentalsScreen";
// Import your screen components (ensure paths match your project structure)
import ApplyPromoCodeScreen from "../screens/App/Booking/ApplyPromoCodeScreen";
import BookingConfirmationScreen from "../screens/App/Booking/BookingConfirmationScreen";
import BookingScreen from "../screens/App/Booking/BookingScreen";
import BikeDetailsScreen from "../screens/App/Explore/BikeDetailsScreen";
import ExploreScreen from "../screens/App/Explore/ExploreScreen";
import FilterScreen from "../screens/App/Explore/FilterScreen";
// Ensure these paths are correct for your project:
import DocumentUploadScreen from "../screens/App/Documents/DocumentUploadScreen";
import NotificationsScreen from "../screens/App/Home/NotificationsScreen";
import EditProfileScreen from "../screens/App/Profile/EditProfileScreen";
import ProfileScreen from "../screens/App/Profile/ProfileScreen";
import SettingsScreen from "../screens/App/Profile/SettingScreen"; // Corrected to SettingsScreen
import WalletPaymentsScreen from "../screens/App/Wallet/WalletPaymentScreen";

import ScreenHeader from "../components/common/ScreenHeader"; // Using your specified path
import { colors, typography } from "../theme"; // Using your specified path

import {
	ExploreStackParamList,
	HomeStackParamList,
	ProfileStackParamList,
	UserTabParamList,
	WalletStackParamList,
} from "./types"; // Correct, as it's in the same folder

// --- Common Stack Navigator Options using our Custom Header ---
const customStackScreenOptions: (navigation: any) => StackNavigationOptions = (
	navigation
) => ({
	header: ({ route, options }) => {
		const title = options.title !== undefined ? options.title : route.name;
		const showBackButton = navigation.canGoBack();
		return (
			<ScreenHeader
				title={title}
				showBackButton={showBackButton}
				onPressBack={
					showBackButton ? () => navigation.goBack() : undefined
				}
			/>
		);
	},
});

// --- Placeholder Tab Bar Icon Component ---
const TabBarIcon: React.FC<{
	name: keyof UserTabParamList;
	focused: boolean;
	color: string;
	size: number;
}> = ({ name, focused, color, size }) => {
	let iconName = name.substring(0, 1);
	if (name === "HomeTab") iconName = focused ? "🏠" : "🏡"; // NEW
	else if (name === "ExploreTab") iconName = focused ? "🗺️" : "🌍";
	else if (name === "WalletTab") iconName = focused ? "💳" : "💰"; // NEW
	else if (name === "ProfileTab") iconName = focused ? "👤" : "🧍";
	return (
		<Text
			style={{
				color,
				fontSize: size,
				fontWeight: focused ? "bold" : "normal",
			}}>
			{iconName}
		</Text>
	);
};

const HomeStack = createStackNavigator<HomeStackParamList>();
const HomeStackNavigator: React.FC = () => (
	<HomeStack.Navigator initialRouteName="HomeScreenRoot">
		<HomeStack.Screen
			name="HomeScreenRoot"
			component={HomeScreen}
			options={{ headerShown: false }} // As HomeScreen will have its own custom top section
		/>
		<HomeStack.Screen
			name="NotificationsScreen" // Screen added here
			component={NotificationsScreen}
			options={{ title: "Notifications" }} // Default title, can be overridden by ScreenHeader in NotificationsScreen
		/>
	</HomeStack.Navigator>
);

// --- 1. Explore Stack ---

// UserAppNavigator.tsx

// --- 1. Explore Stack ---
const ExploreStack = createStackNavigator<ExploreStackParamList>();
const ExploreStackNavigator: React.FC = () => (
	<ExploreStack.Navigator
		screenOptions={({ navigation }) => customStackScreenOptions(navigation)}
		initialRouteName="Explore">
		{/* NO STRAY SPACES OR CHARACTERS ALLOWED DIRECTLY HERE OR BETWEEN SCREEN COMPONENTS */}
		<ExploreStack.Screen
			name="Explore"
			component={ExploreScreen}
			options={{ title: "Explore Bikes" }}
		/>
		{/* Ensure there's nothing here ^ and v like accidental spaces or newlines or invalid comments */}
		<ExploreStack.Screen name="BikeDetails" component={BikeDetailsScreen} />
		<ExploreStack.Screen
			name="Booking"
			component={BookingScreen}
			options={{ title: "Booking Summary" }}
		/>
		<ExploreStack.Screen
			name="ApplyPromoCode"
			component={ApplyPromoCodeScreen}
			options={{ title: "Apply Promo Code" }}
		/>
		<ExploreStack.Screen
			name="BookingConfirmation"
			component={BookingConfirmationScreen}
			options={{ headerShown: false }}
		/>
		<ExploreStack.Screen
			name="Filter"
			component={FilterScreen}
			options={{ presentation: "modal", title: "Filter Bikes" }}
		/>
		<ExploreStack.Screen
			name="DocumentUploadScreen_FromExplore"
			component={DocumentUploadScreen}
			options={{ title: "Upload Document" }}
		/>
		{/* NO STRAY SPACES OR CHARACTERS ALLOWED HERE EITHER */}
	</ExploreStack.Navigator>
);

const WalletStack = createStackNavigator<WalletStackParamList>();
const WalletStackNavigator: React.FC = () => (
	<WalletStack.Navigator
		screenOptions={({ navigation }) => customStackScreenOptions(navigation)}
		initialRouteName="WalletPaymentsScreen">
		<WalletStack.Screen
			name="WalletPaymentsScreen"
			component={WalletPaymentsScreen}
			options={{ title: "Wallet & Payments" }}
		/>
		{/* Example future screens in this stack:
    <WalletStack.Screen name="AddMoneyScreen" component={AddMoneyScreen} options={{ title: 'Add Money' }} />
    <WalletStack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} options={{ title: 'Transaction History' }} />
    <WalletStack.Screen name="AddPaymentMethodScreen" component={AddPaymentMethodScreen} options={{ title: 'Add Payment Method' }} />
    */}
	</WalletStack.Navigator>
);
// --- 4. Profile Stack ---
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const ProfileStackNavigator: React.FC = () => (
	<ProfileStack.Navigator
		screenOptions={({ navigation }) => customStackScreenOptions(navigation)}
		initialRouteName="Profile">
		<ProfileStack.Screen
			name="Profile"
			component={ProfileScreen}
			options={{ title: "My Profile" }}
		/>
		<ProfileStack.Screen
			name="EditProfile"
			component={EditProfileScreen}
			options={{ title: "Edit Profile" }}
		/>
		<ProfileStack.Screen
			name="Settings"
			component={SettingsScreen}
			options={{ title: "Settings" }}
		/>
		<ProfileStack.Screen
			name="MyRentalsScreen"
			component={MyRentalsScreen}
			options={{ title: "My Rentals" }} // Title for the MyRentalsScreen header
		/>
		<ProfileStack.Screen
			name="DocumentUploadScreen" // Added here
			component={DocumentUploadScreen}
			options={{ title: "Upload Document" }} // Or can be set dynamically in the screen
		/>
	</ProfileStack.Navigator>
);

// --- Main User Tab Navigator ---
const Tab = createBottomTabNavigator<UserTabParamList>();

const UserAppNavigator: React.FC = () => {
	return (
		<Tab.Navigator
			screenOptions={({ route }): BottomTabNavigationOptions => ({
				/* ... tab options as before, ensure TabBarIcon handles 'HomeTab' ... */
				headerShown: false,
				tabBarIcon: ({ focused, color, size }) => (
					<TabBarIcon
						name={route.name as keyof UserTabParamList}
						focused={focused}
						color={color}
						size={focused ? 24 : 20}
					/>
				),
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMedium,
				tabBarStyle: {
					backgroundColor: colors.white,
					borderTopColor: colors.borderDefault,
				},
				tabBarLabelStyle: {
					fontSize: typography.fontSizes.xs,
					fontWeight: typography.fontWeights.medium,
				},
			})}>
			<Tab.Screen
				name="HomeTab" // NEW
				component={HomeStackNavigator}
				options={{ title: "Home" }}
			/>
			<Tab.Screen
				name="ExploreTab"
				component={ExploreStackNavigator}
				options={{ title: "Explore" }}
			/>

			<Tab.Screen
				name="WalletTab"
				component={WalletStackNavigator}
				options={{ title: "Wallet" }}
			/>
			<Tab.Screen
				name="ProfileTab"
				component={ProfileStackNavigator}
				options={{ title: "Profile" }}
			/>
		</Tab.Navigator>
	);
};

export default UserAppNavigator;

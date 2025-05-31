// src/navigation/UserAppNavigator.tsx
import {
	BottomTabNavigationOptions,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
	createStackNavigator,
	StackNavigationOptions,
} from "@react-navigation/stack";
import React from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Platform } from "react-native";
import HomeScreen from "../screens/App/Home/HomeScreen";
import MyRentalsScreen from "../screens/App/Rental/MyRentalsScreen";
import { TabBarIconProps } from "./types";

import ApplyPromoCodeScreen from "../screens/App/Booking/ApplyPromoCodeScreen";
import BookingConfirmationScreen from "../screens/App/Booking/BookingConfirmationScreen";
import BookingScreen from "../screens/App/Booking/BookingScreen";
import BikeDetailsScreen from "../screens/App/Explore/BikeDetailsScreen";
import ExploreScreen from "../screens/App/Explore/ExploreScreen";
import FilterScreen from "../screens/App/Explore/FilterScreen";
// Ensure ScreenHeader is correctly themed internally
import ScreenHeader from "../components/common/ScreenHeader";
import DocumentUploadScreen from "../screens/App/Documents/DocumentUploadScreen";
import NotificationsScreen from "../screens/App/Home/NotificationsScreen";
import EditProfileScreen from "../screens/App/Profile/EditProfileScreen";
import ProfileScreen from "../screens/App/Profile/ProfileScreen";
import SettingsScreen from "../screens/App/Profile/SettingScreen";
import AddMoneyScreen from "../screens/App/Wallet/AddMoneyScreen";
import WalletPaymentsScreen from "../screens/App/Wallet/WalletPaymentScreen";

// Assuming colors imported from here now refer to the dark theme palette
import { colors, typography } from "../theme"; // Added spacing for potential use in header

import {
	ExploreStackParamList,
	HomeStackParamList,
	ProfileStackParamList,
	UserTabParamList,
	WalletStackParamList,
} from "./types";

// --- Common Stack Navigator Options using our Custom Header ---
// ScreenHeader is responsible for its own styling using theme colors.
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
				// ScreenHeader should internally use:
				// backgroundColor: colors.backgroundHeader,
				// titleColor: colors.textPrimary,
				// iconColor: colors.iconWhite (or textPrimary for back arrow)
			/>
		);
	},
	// You can also set cardStyle for the stack navigator if needed for transitions or overall bg
	// cardStyle: { backgroundColor: colors.backgroundMain },
});

// --- Tab Bar Icon Component ---
const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, color }) => {
	let iconNameToRender: string;
	let iconSize = focused ? 28 : 24;

	if (name === "HomeTab") {
		iconNameToRender = focused ? "home" : "home-outline";
	} else if (name === "ExploreTab") {
		iconNameToRender = focused ? "explore" : "explore";
	} else if (name === "WalletTab") {
		iconNameToRender = focused
			? "account-balance-wallet"
			: "account-balance-wallet";
	} else if (name === "ProfileTab") {
		iconNameToRender = focused ? "person" : "person-outline";
	} else {
		iconNameToRender = "help-outline";
	}
	return (
		<MaterialIcons name={iconNameToRender} size={iconSize} color={color} />
	);
};

const HomeStack = createStackNavigator<HomeStackParamList>();
const HomeStackNavigator: React.FC = () => (
	<HomeStack.Navigator
		initialRouteName="HomeScreenRoot"
		// Apply customStackScreenOptions to screens that need the themed header
		screenOptions={({ navigation }) =>
			customStackScreenOptions(navigation)
		}>
		<HomeStack.Screen
			name="HomeScreenRoot"
			component={HomeScreen}
			options={{ headerShown: false }} // HomeScreen has its own custom header section
		/>
		<HomeStack.Screen
			name="NotificationsScreen"
			component={NotificationsScreen}
			options={{ title: "Notifications" }} // Title used by ScreenHeader
		/>
	</HomeStack.Navigator>
);

const ExploreStack = createStackNavigator<ExploreStackParamList>();
const ExploreStackNavigator: React.FC = () => (
	<ExploreStack.Navigator
		screenOptions={({ navigation }) => customStackScreenOptions(navigation)}
		initialRouteName="Explore">
		<ExploreStack.Screen
			name="Explore"
			component={ExploreScreen}
			options={{ title: "Explore Bikes" }}
		/>
		<ExploreStack.Screen
			name="BikeDetails"
			component={BikeDetailsScreen}
			options={{ title: "Bike Details" }}
		/>
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
			options={{ presentation: "modal", title: "Filter Bikes" }} // Modal might use default header depending on platform
		/>
		<ExploreStack.Screen
			name="DocumentUploadScreen_FromExplore"
			component={DocumentUploadScreen}
			options={{ title: "Upload Document" }}
		/>
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
			options={{ title: "Wallet" }}
		/>
		<WalletStack.Screen
			name="AddMoneyScreen"
			component={AddMoneyScreen}
			options={{ title: "Add Money" }}
		/>
	</WalletStack.Navigator>
);

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
			options={{ title: "My Rentals" }}
		/>
		<ProfileStack.Screen
			name="DocumentUploadScreen"
			component={DocumentUploadScreen}
			options={{ title: "Upload Document" }}
		/>
		{/* Add other screens like ChangePasswordScreen here if they belong to ProfileStack */}
		<ProfileStack.Screen
			name="ChangePasswordScreen"
			component={SettingsScreen}
			options={{ title: "Change Password" }}
		/>
		<ProfileStack.Screen
			name="NotificationPreferencesScreen"
			component={SettingsScreen}
			options={{ title: "Notifications" }}
		/>
		<ProfileStack.Screen
			name="ContactSupportScreen"
			component={SettingsScreen}
			options={{ title: "Help & Support" }}
		/>
		<ProfileStack.Screen
			name="RideDetailsScreen"
			component={MyRentalsScreen}
			options={{ title: "Ride Details" }}
		/>
	</ProfileStack.Navigator>
);

const Tab = createBottomTabNavigator<UserTabParamList>();

const UserAppNavigator: React.FC = () => {
	return (
		<Tab.Navigator
			screenOptions={({ route }): BottomTabNavigationOptions => ({
				headerShown: false,
				tabBarIcon: ({ focused, color }) => (
					<TabBarIcon
						name={route.name as keyof UserTabParamList}
						focused={focused}
						color={color}
						size={0} // Size is handled internally by TabBarIcon
					/>
				),
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.iconDefault,
				tabBarStyle: {
					backgroundColor: colors.backgroundCard, // Dark tab bar
					borderTopColor: colors.borderDefault,
					paddingTop: 5,
					height: Platform.OS === "ios" ? 90 : 60,
				},
				tabBarLabelStyle: {
					fontSize: typography.fontSizes.xs,
					fontFamily: typography.primaryRegular,
					marginBottom: Platform.OS === "ios" ? 0 : 5,
				},
				tabBarHideOnKeyboard: true,
			})}>
			<Tab.Screen
				name="HomeTab"
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

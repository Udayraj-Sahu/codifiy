// src/screens/Auth/SignupScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import PrimaryButton from "../../components/common/PrimaryButton"; // Assumed themed
import StyledTextInput from "../../components/common/StyledTextInput"; // Assumed themed
import { useAuth } from "../../context/AuthContext"; // Keeping useAuth as per original
import { AuthStackParamList } from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
// Redux imports are not used in this version as it uses useAuth from context
// import { useDispatch } from 'react-redux';
// import { AppDispatch } from '../../store/store';
// import { registerUser } from '../../store/slices/authSlice'; // Example if using Redux for signup

// Checkbox Component (Themed)
interface CheckboxProps {
	labelComponent: React.ReactNode;
	checked: boolean;
	onPress: () => void;
	accessibilityLabel?: string;
	containerStyle?: object;
}
const Checkbox: React.FC<CheckboxProps> = ({
	labelComponent,
	checked,
	onPress,
	accessibilityLabel,
	containerStyle,
}) => (
	<TouchableOpacity
		onPress={onPress}
		style={[styles.checkboxBaseContainer, containerStyle]}
		accessibilityLabel={accessibilityLabel}
		accessibilityRole="checkbox"
		accessibilityState={{ checked }}
		activeOpacity={0.7}>
		<View
			style={[
				styles.checkboxSquare,
				checked && styles.checkboxSquareChecked,
			]}>
			{checked && (
				<MaterialIcons
					name="check"
					size={16}
					color={colors.buttonPrimaryText}
				/>
			)}
		</View>
		{labelComponent}
	</TouchableOpacity>
);

type SignupScreenNavigationProp = StackNavigationProp<
	AuthStackParamList,
	"Signup"
>;

interface SignupScreenProps {
	navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSigningUp, setIsSigningUp] = useState(false);
	const { signUpAndSignIn } = useAuth(); // Using context-based auth

	const handleSignup = async () => {
		if (
			!fullName.trim() ||
			!email.trim() ||
			!password.trim() ||
			!confirmPassword.trim()
		) {
			Alert.alert("Validation Error", "Please fill in all fields.");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Validation Error", "Passwords do not match.");
			return;
		}
		if (password.length < 6) {
			// Example: Minimum password length
			Alert.alert(
				"Validation Error",
				"Password must be at least 6 characters long."
			);
			return;
		}
		if (!agreedToTerms) {
			Alert.alert(
				"Agreement Required",
				"Please agree to Bikya's terms & privacy policy."
			);
			return;
		}

		setIsSigningUp(true);
		// Using context-based signUpAndSignIn
		const result = await signUpAndSignIn(
			fullName.trim(),
			email.trim(),
			password
		);
		setIsSigningUp(false);

		if (!result.success) {
			Alert.alert(
				"Signup Failed",
				result.error ||
					"Could not create your account. Please try again."
			);
		}
		// Successful signup will automatically navigate due to AppNavigator's auth state change
	};

	const handleTermsPress = () => {
		// TODO: Navigate to Terms and Conditions screen or open a webview
		Alert.alert(
			"Terms & Conditions",
			"Navigate to Terms & Conditions page."
		);
	};

	const handlePrivacyPolicyPress = () => {
		// TODO: Navigate to Privacy Policy screen or open a webview
		Alert.alert("Privacy Policy", "Navigate to Privacy Policy page.");
	};

	const termsAndPolicyLabel = (
		<Text style={styles.checkboxLabelText}>
			I agree to Bikya's{" "}
			<Text style={styles.linkTextUnderlined} onPress={handleTermsPress}>
				Terms of Service
			</Text>
			{" & "}
			<Text
				style={styles.linkTextUnderlined}
				onPress={handlePrivacyPolicyPress}>
				Privacy Policy
			</Text>
			.
		</Text>
	);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.keyboardAvoidingContainer}>
			<ScrollView
				contentContainerStyle={styles.scrollContainer}
				keyboardShouldPersistTaps="handled">
				<View style={styles.container}>
					<View style={styles.headerContainer}>
						<Text style={styles.headerTitle}>
							Create Your Account
						</Text>
						<Text style={styles.subHeaderTitle}>
							Let's get started with Bikya!
						</Text>
					</View>

					<View style={styles.formContainer}>
						<StyledTextInput // Assumed themed
							label="Full Name"
							placeholder="Enter your full name"
							value={fullName}
							onChangeText={setFullName}
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput // Assumed themed
							label="Email Address"
							placeholder="you@example.com"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput // Assumed themed
							label="Password"
							placeholder="Create a strong password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry={!showPassword}
							iconRight={
								<TouchableOpacity
									onPress={() =>
										setShowPassword(!showPassword)
									}
									style={styles.eyeIconTouchable}>
									<MaterialIcons
										name={
											showPassword
												? "visibility"
												: "visibility-off"
										}
										size={22}
										color={colors.iconDefault} // Themed icon color
									/>
								</TouchableOpacity>
							}
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput // Assumed themed
							label="Confirm Password"
							placeholder="Re-enter your password"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry={!showConfirmPassword}
							iconRight={
								<TouchableOpacity
									onPress={() =>
										setShowConfirmPassword(
											!showConfirmPassword
										)
									}
									style={styles.eyeIconTouchable}>
									<MaterialIcons
										name={
											showConfirmPassword
												? "visibility"
												: "visibility-off"
										}
										size={22}
										color={colors.iconDefault} // Themed icon color
									/>
								</TouchableOpacity>
							}
							containerStyle={styles.inputContainer}
						/>

						<Checkbox
							labelComponent={termsAndPolicyLabel}
							checked={agreedToTerms}
							onPress={() => setAgreedToTerms(!agreedToTerms)}
							accessibilityLabel="Agree to terms and privacy policy"
							containerStyle={styles.checkboxContainerFull}
						/>

						<PrimaryButton // Assumed themed
							title="Sign Up"
							onPress={handleSignup}
							isLoading={isSigningUp}
							disabled={isSigningUp}
							style={styles.signupButton}
						/>
					</View>

					<View style={styles.footer}>
						<Text style={styles.footerText}>
							Already have an account?
						</Text>
						<TouchableOpacity
							onPress={() => navigation.navigate("Login")}>
							<Text style={[styles.footerText, styles.linkText]}>
								Login
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	keyboardAvoidingContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: "center",
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	container: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.xl,
	},
	headerContainer: {
		alignItems: "flex-start",
		marginBottom: spacing.xl,
		width: "100%",
	},
	headerTitle: {
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.xs,
	},
	subHeaderTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	formContainer: {
		width: "100%",
	},
	inputContainer: {
		// For StyledTextInput wrapper
		marginBottom: spacing.l, // Increased space
		// StyledTextInput handles its own internal theming
	},
	eyeIconTouchable: {
		padding: spacing.s,
	},
	// eyeIcon removed, using MaterialIcons now
	checkboxBaseContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.l,
	},
	checkboxContainerFull: {
		// If checkbox needs to span full width or have specific margin
		// No specific style here if default is fine
	},
	checkboxSquare: {
		width: 22,
		height: 22,
		borderWidth: 1.5,
		borderColor: colors.borderDefault, // Themed border for unchecked
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark background for checkbox square
	},
	checkboxSquareChecked: {
		backgroundColor: colors.primary, // Primary color when checked
		borderColor: colors.primary,
	},
	// checkboxCheckmark removed, using MaterialIcons now
	checkboxLabelText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text for checkbox label
		flexShrink: 1,
		lineHeight: typography.lineHeights.getForSize(
			typography.fontSizes.s,
			"body"
		),
	},
	linkTextUnderlined: {
		color: colors.textLink, // Themed link color
		fontFamily: typography.primaryMedium,
		textDecorationLine: "underline",
	},
	signupButton: {
		marginTop: spacing.m, // Adjusted margin
		// PrimaryButton handles its own theming
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.xl, // Increased margin
	},
	footerText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	linkText: {
		color: colors.textLink, // Themed link color
		fontFamily: typography.primarySemiBold,
		marginLeft: spacing.xs,
	},
});

export default SignupScreen;

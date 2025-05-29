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
import PrimaryButton from "../../components/common/PrimaryButton";
import StyledTextInput from "../../components/common/StyledTextInput"; // Adjust path
import { useAuth } from "../../context/AuthContext"; // Adjust path
import { AuthStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path

// Basic Checkbox Component (as defined before, or use a library)
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
			{checked && <Text style={styles.checkboxCheckmark}>✓</Text>}
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
	const { signUpAndSignIn } = useAuth();

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
		if (!agreedToTerms) {
			Alert.alert(
				"Agreement Required",
				"Please agree to Bikya's terms & privacy policy."
			);
			return;
		}

		setIsSigningUp(true);
		const result = await signUpAndSignIn(fullName, email, password);
		setIsSigningUp(false);

		if (!result.success) {
			Alert.alert(
				"Signup Failed",
				result.error ||
					"Could not create your account. Please try again."
			);
		}
		// Successful signup will automatically navigate due to AppNavigator's state change
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
			I agree to Bikya's
			<Text style={styles.linkTextUnderlined} onPress={handleTermsPress}>
				terms&
			</Text>
			<Text
				style={styles.linkTextUnderlined}
				onPress={handlePrivacyPolicyPress}>
				privacy policy
			</Text>
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
						<Text style={styles.headerTitle}>Create Account</Text>
						<Text style={styles.subHeaderTitle}>
							Join Bikya today
						</Text>
					</View>

				
					<View style={styles.formContainer}>
						<StyledTextInput
							label="Full Name"
							placeholder="Enter your full name"
							value={fullName}
							onChangeText={setFullName}
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput
							label="Email"
							placeholder="Enter your email"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput
							label="Password"
							placeholder="Create a password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry={!showPassword}
							iconRight={
								<TouchableOpacity
									onPress={() =>
										setShowPassword(!showPassword)
									}
									style={styles.eyeIconTouchable}>
									<Text style={styles.eyeIcon}>
										{showPassword ? "👁️" : "🙈"}
									</Text>
								</TouchableOpacity>
							}
							containerStyle={styles.inputContainer}
						/>
						<StyledTextInput
							label="Confirm Password"
							placeholder="Confirm your password"
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
									<Text style={styles.eyeIcon}>
										{showConfirmPassword ? "👁️" : "🙈"}
									</Text>
								</TouchableOpacity>
							}
							containerStyle={styles.inputContainer}
						/>

						<Checkbox
							labelComponent={termsAndPolicyLabel}
							checked={agreedToTerms}
							onPress={() => setAgreedToTerms(!agreedToTerms)}
							accessibilityLabel="Agree to terms and privacy policy"
						/>

						<PrimaryButton
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
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: "center",
		backgroundColor: colors.white,
	},
	container: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.xl,
	},
	headerContainer: {
		alignItems: "flex-start", // Align text to left as per design
		marginBottom: spacing.xl,
		width: "100%",
	},
	headerTitle: {
		fontSize: typography.fontSizes.xxxl, // e.g., 28
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	subHeaderTitle: {
		fontSize: typography.fontSizes.l, // e.g., 16
		color: colors.textSecondary,
	},
	formContainer: {
		width: "100%",
	},
	inputContainer: {
		marginBottom: spacing.m,
	},
	eyeIconTouchable: {
		padding: spacing.s,
	},
	eyeIcon: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
	},
	checkboxBaseContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.l,
		// alignSelf: 'flex-start', // If form is centered and checkbox needs to be left
	},
	checkboxSquare: {
		width: 22,
		height: 22,
		borderWidth: 1.5,
		borderColor: colors.primary,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSquareChecked: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	checkboxCheckmark: {
		color: colors.white,
		fontSize: typography.fontSizes.s - 2,
		fontWeight: "bold",
	},
	checkboxLabelText: {
		fontSize: typography.fontSizes.s, // Slightly smaller for checkbox label
		color: colors.textSecondary,
		flexShrink: 1, // Allow text to wrap
		lineHeight: typography.fontSizes.s * 1.4,
	},
	linkTextUnderlined: {
		// For terms & policy
		color: colors.primary,
		fontWeight: typography.fontWeights.medium,
		textDecorationLine: "underline",
	},
	signupButton: {
		marginTop: spacing.s,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.xl,
	},
	footerText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	linkText: {
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
		marginLeft: spacing.xs,
	},
});

export default SignupScreen;

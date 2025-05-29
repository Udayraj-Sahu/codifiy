// src/screens/Auth/LoginScreen.tsx
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
//import { useAuth } from "../../context/AuthContext"; // Adjust path
import { AuthStackParamList } from "../../navigation/types"; // Adjust path if needed
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
import { useDispatch } from 'react-redux'; // <<< ADD
import { AppDispatch } from '../../store/store'; // <<< ADD
import { loginUser } from '../../store/slices/authSlice';

// Placeholder for Social Login Button
const SocialButton: React.FC<{
	title: string;
	icon: string;
	onPress: () => void;
	style?: object;
}> = ({ title, icon, onPress, style }) => (
	<TouchableOpacity
		style={[styles.socialButtonBase, style]}
		onPress={onPress}>
		<Text style={styles.socialButtonIcon}>{icon}</Text>
		<Text style={styles.socialButtonText}>{title}</Text>
	</TouchableOpacity>
);

type LoginScreenNavigationProp = StackNavigationProp<
	AuthStackParamList,
	"Login"
>;

interface LoginScreenProps {
	navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	//const { signIn } = useAuth();
	const dispatch = useDispatch<AppDispatch>();

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert(
				"Validation Error",
				"Please enter both email and password."
			);
			return;
		}
		setIsLoggingIn(true);
		  try {
            // const result = await signIn(email, password); // <<< OLD WAY
            const resultAction = await dispatch(loginUser({ email, password })); // <<< NEW WAY

            if (loginUser.fulfilled.match(resultAction)) {
                // Navigation will be handled automatically by AppNavigator
                // because isAuthenticated in Redux authSlice will become true.
                // No need to explicitly navigate here if AppNavigator is set up correctly.
                console.log("Login successful via Redux");
            } else if (loginUser.rejected.match(resultAction)) {
                Alert.alert(
                    "Login Failed",
                    (resultAction.payload as string) || "Invalid email or password. Please try again."
                );
            }
        } catch (error: any) {
            Alert.alert("Login Error", error.message || "An unexpected error occurred.");
        } finally {
            setIsLoggingIn(false);
        }
    };

	const handleGoogleLogin = () => {
		// TODO: Implement Google Sign-In
		Alert.alert(
			"Google Login",
			"Google login functionality to be implemented."
		);
	};

	const handleAppleLogin = () => {
		// TODO: Implement Apple Sign-In
		Alert.alert(
			"Apple Login",
			"Apple login functionality to be implemented."
		);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.keyboardAvoidingContainer}>
			<ScrollView
				contentContainerStyle={styles.scrollContainer}
				keyboardShouldPersistTaps="handled">
				<View style={styles.container}>
			
					<View style={styles.logoContainer}>
				
						<View style={styles.logoCircle}>
							<Text style={styles.logoIcon}>🚲</Text>
					
						</View>
						<Text style={styles.appName}>Bikya</Text>
						<Text style={styles.tagline}>
							Rent a bike, ride with freedom.
						</Text>
					</View>

			
					<View style={styles.formContainer}>
						<Text style={styles.headerTitle}>Welcome Back</Text>
						<Text style={styles.subHeaderTitle}>
							Login to your account
						</Text>

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
							placeholder="Enter your password"
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

						<TouchableOpacity
							onPress={() =>
								navigation.navigate("ForgotPassword")
							}
							style={styles.forgotPasswordButton}>
							<Text style={styles.forgotPasswordText}>
								Forgot Password?
							</Text>
						</TouchableOpacity>

						<PrimaryButton
							title="Login"
							onPress={handleLogin}
							isLoading={isLoggingIn}
							disabled={isLoggingIn}
							style={styles.loginButton}
						/>
					</View>

			
					<View style={styles.separatorContainer}>
						<View style={styles.separatorLine} />
						<Text style={styles.separatorText}>OR</Text>
						<View style={styles.separatorLine} />
					</View>

					
					<View style={styles.socialLoginContainer}>
						<SocialButton
							title="Google"
							icon="G"
							onPress={handleGoogleLogin}
							style={styles.googleButton}
						/>
						<SocialButton
							title="Apple"
							icon=""
							onPress={handleAppleLogin}
							style={styles.appleButton}
						/>
					</View>

			
					<View style={styles.footer}>
						<Text style={styles.footerText}>
							Don't have an account?
						</Text>
						<TouchableOpacity
							onPress={() => navigation.navigate("Signup")}>
							<Text style={[styles.footerText, styles.linkText]}>
								Sign up
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
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.l, // e.g., 24
		paddingVertical: spacing.xl, // e.g., 32
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	logoCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: colors.primaryLight || "#D3EAA4", // Light green from design
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	logoIcon: {
		fontSize: 40, // Adjust for your bike icon
		color: colors.primary,
	},
	appName: {
		fontSize: typography.fontSizes.xxxl + 4, // e.g., 28-32
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	tagline: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	formContainer: {
		width: "100%",
		alignItems: "stretch", // Make inputs take full width available
		marginBottom: spacing.l,
	},
	headerTitle: {
		fontSize: typography.fontSizes.xxl, // e.g., 24
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
		textAlign: "left",
	},
	subHeaderTitle: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.l,
		textAlign: "left",
	},
	inputContainer: {
		marginBottom: spacing.m,
	},
	eyeIconTouchable: {
		padding: spacing.s, // Make it easier to tap
	},
	eyeIcon: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
	},
	forgotPasswordButton: {
		alignSelf: "flex-end",
		marginBottom: spacing.l,
	},
	forgotPasswordText: {
		color: colors.primary,
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
	},
	loginButton: {
		// PrimaryButton is fullWidth by default
	},
	separatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		width: "80%",
		marginVertical: spacing.l,
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.borderDefault || "#E0E0E0",
	},
	separatorText: {
		marginHorizontal: spacing.s,
		color: colors.textMedium,
		fontSize: typography.fontSizes.s,
	},
	socialLoginContainer: {
		flexDirection: "row",
		justifyContent: "space-between", // Or 'space-around'
		width: "100%", // Or a specific width like '90%'
		marginBottom: spacing.xl,
	},
	socialButtonBase: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.m - 2,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#E0E0E0",
		backgroundColor: colors.white,
		flex: 1, // Make buttons share space
		marginHorizontal: spacing.xs, // Space between buttons
	},
	socialButtonIcon: {
		marginRight: spacing.s,
		fontSize: typography.fontSizes.l, // Adjust for Google/Apple icon size
		color: colors.textPrimary, // Or specific icon color
	},
	socialButtonText: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		color: colors.textPrimary,
	},
	googleButton: {
		// Specific styles if needed
	},
	appleButton: {
		// Specific styles if needed
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.m, // Space from social buttons
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

export default LoginScreen;

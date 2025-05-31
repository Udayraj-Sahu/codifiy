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
    ActivityIndicator, // Added for login button loading state
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
// For social icons, you might prefer react-native-vector-icons/MaterialCommunityIcons or SVGs
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import PrimaryButton from "../../components/common/PrimaryButton"; // Assumed themed
import StyledTextInput from "../../components/common/StyledTextInput"; // Assumed themed
import { AuthStackParamList } from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { loginUser } from '../../store/slices/authSlice'; // Assuming this is your Redux thunk

// Social Login Button (Themed)
const SocialButton: React.FC<{
    title: string;
    iconName?: keyof typeof MaterialIcons.glyphMap; // For MaterialIcons
    iconText?: string; // For text icons like 'G' or ''
    iconColor?: string;
    onPress: () => void;
    style?: object;
    textStyle?: object;
}> = ({ title, iconName, iconText, iconColor = colors.textPrimary, onPress, style, textStyle }) => (
    <TouchableOpacity
        style={[styles.socialButtonBase, style]}
        onPress={onPress}>
        {iconName && <MaterialIcons name={iconName} size={20} color={iconColor} style={styles.socialButtonIconVector} />}
        {iconText && !iconName && <Text style={[styles.socialButtonIconText, {color: iconColor}]}>{iconText}</Text>}
        <Text style={[styles.socialButtonText, textStyle]}>{title}</Text>
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
    const dispatch = useDispatch<AppDispatch>();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Validation Error", "Please enter both email and password.");
            return;
        }
        setIsLoggingIn(true);
        try {
            const resultAction = await dispatch(loginUser({ email: email.trim(), password }));
            if (loginUser.fulfilled.match(resultAction)) {
                // Navigation handled by AppNavigator observing auth state
                console.log("Login successful via Redux");
            } else if (loginUser.rejected.match(resultAction)) {
                Alert.alert(
                    "Login Failed",
                    (resultAction.payload as string) || "Invalid email or password."
                );
            }
        } catch (error: any) {
            Alert.alert("Login Error", error.message || "An unexpected error occurred.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google Sign-In & Redux dispatch
        Alert.alert("Google Login", "Google login to be implemented.");
    };

    const handleAppleLogin = () => {
        // TODO: Implement Apple Sign-In & Redux dispatch
        Alert.alert("Apple Login", "Apple login to be implemented.");
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
                            <MaterialIcons name="directions-bike" size={40} color={colors.primary} />
                        </View>
                        <Text style={styles.appName}>Bikya</Text>
                        <Text style={styles.tagline}>Rent a bike, ride with freedom.</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.headerTitle}>Welcome Back!</Text>
                        <Text style={styles.subHeaderTitle}>Login to continue your journey.</Text>

                        <StyledTextInput // Assumed themed
                            label="Email Address"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            containerStyle={styles.inputContainer}
                            // Example explicit theming if needed:
                            // labelTextStyle={{color: colors.textSecondary}}
                            // inputStyle={{backgroundColor: colors.backgroundInput, color: colors.textPrimary}}
                            // placeholderTextColor={colors.textPlaceholder}
                        />
                        <StyledTextInput // Assumed themed
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            iconRight={
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIconTouchable}>
                                    <MaterialIcons
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={22}
                                        color={colors.iconDefault}
                                    />
                                </TouchableOpacity>
                            }
                            containerStyle={styles.inputContainer}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate("ForgotPassword")}
                            style={styles.forgotPasswordButton}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <PrimaryButton // Assumed themed
                            title="Login"
                            onPress={handleLogin}
                            isLoading={isLoggingIn}
                            disabled={isLoggingIn}
                            style={styles.loginButton}
                        />
                    </View>

                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>OR CONTINUE WITH</Text>
                        <View style={styles.separatorLine} />
                    </View>

                    <View style={styles.socialLoginContainer}>
                        <SocialButton
                            title="Google"
                            iconName="google" // Assuming you use MaterialCommunityIcons for 'google'
                                             // For MaterialIcons, might need custom SVG or use text 'G'
                            iconText="G" // Fallback if iconName not found/used
                            iconColor="#DB4437" // Google Red
                            onPress={handleGoogleLogin}
                            style={styles.googleButton} // Can have specific background
                            textStyle={{color: colors.textPrimary}} // Text color for Google button
                        />
                        <SocialButton
                            title="Apple"
                            iconName="apple" // Assuming you use MaterialCommunityIcons for 'apple'
                            iconText=""  // Apple logo character
                            iconColor={colors.textPrimary} // White/Light icon on dark button, or black on light
                            onPress={handleAppleLogin}
                            style={styles.appleButton} // Can have specific background for Apple
                            textStyle={{color: colors.textPrimary}}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                            <Text style={[styles.footerText, styles.linkText]}>Sign up</Text>
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
        backgroundColor: colors.backgroundMain, // Dark theme background for the whole KAV
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        backgroundColor: colors.backgroundMain, // Dark theme background
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.xl,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: spacing.xl,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.circle, // Circular
        backgroundColor: colors.backgroundCard, // Dark card background for logo circle
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.m, // Increased margin
        borderWidth: 1,
        borderColor: colors.primary, // Accent border
    },
    // logoIcon removed, using MaterialIcons now
    appName: {
        fontSize: typography.fontSizes.xxxl + 4,
        fontFamily: typography.primaryBold,
        color: colors.textPrimary, // Light text
    },
    tagline: {
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary, // Muted light text
        marginTop: spacing.xs,
    },
    formContainer: {
        width: "100%",
        alignItems: "stretch",
        marginBottom: spacing.l,
    },
    headerTitle: {
        fontSize: typography.fontSizes.xxxl, // Made larger
        fontFamily: typography.primaryBold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: "left",
    },
    subHeaderTitle: {
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary,
        marginBottom: spacing.xl, // Increased margin
        textAlign: "left",
    },
    inputContainer: { // For StyledTextInput wrapper
        marginBottom: spacing.l, // Increased space between inputs
        // StyledTextInput handles its own theming for background, text, placeholder etc.
    },
    eyeIconTouchable: {
        padding: spacing.s,
    },
    // eyeIcon removed, using MaterialIcons now
    forgotPasswordButton: {
        alignSelf: "flex-end",
        marginBottom: spacing.l,
        paddingVertical: spacing.xs, // Add padding for better touch area
    },
    forgotPasswordText: {
        color: colors.textLink, // Use themed link color
        fontSize: typography.fontSizes.s,
        fontFamily: typography.primaryMedium,
    },
    loginButton: {
        marginTop: spacing.s, // Add some margin above login button
        // PrimaryButton handles its own theming
    },
    separatorContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "90%", // Slightly wider
        marginVertical: spacing.xl, // Increased margin
    },
    separatorLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth, // Thinner line
        backgroundColor: colors.borderDefault, // Themed border color
    },
    separatorText: {
        marginHorizontal: spacing.m, // Increased margin
        color: colors.textSecondary, // Muted text
        fontSize: typography.fontSizes.xs, // Smaller text for "OR"
        fontFamily: typography.primaryRegular,
    },
    socialLoginContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: spacing.xl,
    },
    socialButtonBase: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.m, // Consistent padding
        paddingHorizontal: spacing.s, // Adjust as needed
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.borderDefault, // Themed border
        backgroundColor: colors.backgroundCard, // Dark card background for social buttons
        flex: 1,
        marginHorizontal: spacing.xs,
    },
    socialButtonIconVector: { // For MaterialIcons or MaterialCommunityIcons
         marginRight: spacing.s,
    },
    socialButtonIconText: { // For text icons like 'G', ''
        marginRight: spacing.s,
        fontSize: typography.fontSizes.l,
        fontFamily: typography.primaryBold, // Make it bold
    },
    socialButtonText: {
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryMedium, // Medium weight for social button text
        color: colors.textPrimary, // Light text
    },
    googleButton: {
        // You can add specific border color or icon color for Google if needed
        // borderColor: '#DB4437', // Example Google Red border
    },
    appleButton: {
        // Specific styles for Apple button
        // borderColor: colors.textPrimary, // Example: White/Light border for Apple button on dark theme
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: spacing.m,
    },
    footerText: {
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryRegular,
        color: colors.textSecondary,
    },
    linkText: {
        color: colors.textLink, // Use themed link color
        fontFamily: typography.primarySemiBold,
        marginLeft: spacing.xs,
    },
});

export default LoginScreen;

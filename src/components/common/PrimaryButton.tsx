// components/PrimaryButton.tsx
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    StyleProp,
    ViewStyle,
    TextStyle,
    GestureResponderEvent,
} from 'react-native';

// Import theme constants
import {
    colors,
    typography,
    spacing,
    borderRadius,
} from '../../theme'; // Adjust path if your theme file is elsewhere

// Define the props interface
interface PrimaryButtonProps {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    disabled?: boolean;
    isLoading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    fullWidth?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'; // Optional variant prop
    size?: 'small' | 'medium' | 'large'; // Optional size prop
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    disabled = false,
    isLoading = false,
    style,
    textStyle,
    iconLeft,
    iconRight,
    fullWidth = true,
    variant = 'primary', // Default variant
    size = 'medium', // Default size
}) => {
    const isButtonDisabled = disabled || isLoading;

    // Determine styles based on variant and disabled state
    // These could be further expanded in a dedicated theme file or helper
    let currentBackgroundColor: string;
    let currentTextColor: string;
    let currentBorderColor: string | undefined;
    let currentBorderWidth: number | undefined;

    switch (variant) {
        case 'secondary':
            currentBackgroundColor = isButtonDisabled ? colors.backgroundDisabled : colors.buttonSecondaryBackground;
            currentTextColor = isButtonDisabled ? colors.textDisabled : colors.buttonSecondaryText;
            break;
        case 'outline':
            currentBackgroundColor = 'transparent';
            currentTextColor = isButtonDisabled ? colors.textDisabled : colors.primary; // Or colors.buttonOutlineText
            currentBorderColor = isButtonDisabled ? colors.borderDisabled : colors.primary; // Or colors.buttonOutlineBorder
            currentBorderWidth = 1;
            break;
        case 'ghost':
            currentBackgroundColor = 'transparent';
            currentTextColor = isButtonDisabled ? colors.textDisabled : colors.primary; // Or colors.buttonGhostText
            break;
        case 'link':
            currentBackgroundColor = 'transparent';
            currentTextColor = isButtonDisabled ? colors.textDisabled : colors.textLink;
            break;
        case 'primary':
        default:
            currentBackgroundColor = isButtonDisabled ? colors.buttonPrimaryDisabledBackground : colors.buttonPrimaryBackground;
            currentTextColor = isButtonDisabled ? colors.buttonPrimaryDisabledText : colors.buttonPrimaryText;
            break;
    }

    // Determine padding and font size based on size prop
    let currentPaddingVertical = spacing.m;
    let currentFontSize = typography.fontSizes.m;

    switch (size) {
        case 'small':
            currentPaddingVertical = spacing.s;
            currentFontSize = typography.fontSizes.s;
            break;
        case 'large':
            currentPaddingVertical = spacing.l;
            currentFontSize = typography.fontSizes.l;
            break;
        case 'medium':
        default:
            // Already set
            break;
    }


    const handlePress = (event: GestureResponderEvent) => {
        if (!isButtonDisabled && onPress) {
            onPress(event);
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: currentBackgroundColor,
                    borderColor: currentBorderColor,
                    borderWidth: currentBorderWidth,
                    paddingVertical: currentPaddingVertical,
                },
                fullWidth && styles.fullWidth,
                style, // External style overrides
            ]}
            onPress={handlePress}
            disabled={isButtonDisabled}
            activeOpacity={0.7}>
            {isLoading ? (
                <ActivityIndicator color={currentTextColor} size="small" />
            ) : (
                <View style={styles.contentContainer}>
                    {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
                    <Text
                        style={[
                            styles.text,
                            { color: currentTextColor, fontSize: currentFontSize },
                            textStyle, // External text style overrides
                        ]}>
                        {title}
                    </Text>
                    {iconRight && <View style={styles.iconWrapper}>{iconRight}</View>}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: spacing.l, // Use theme spacing
        borderRadius: borderRadius.m, // Use theme border radius (m or default)
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        // Vertical padding is now dynamic based on 'size' prop
    },
    fullWidth: {
        width: '100%',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        // fontSize is now dynamic based on 'size' prop
        fontFamily: typography.primaryBold, // Use theme typography
        // fontWeight: typography.fontWeights.bold, // fontFamily often includes weight
        textAlign: 'center',
    },
    iconWrapper: {
        marginHorizontal: spacing.s, // Use theme spacing
    },
});

export default PrimaryButton;

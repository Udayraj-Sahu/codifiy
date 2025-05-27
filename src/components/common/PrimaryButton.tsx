// components/PrimaryButton.tsx (Conceptual - Corrected)
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
  GestureResponderEvent, // Import GestureResponderEvent
} from 'react-native';

// --- Theme constants (Colors, Fonts, Spacing, BorderRadius) would be here as before ---
// Placeholder for actual theme constants (same as used in StyledTextInput.tsx)
const Colors = {
  primary: '#A0D911', // Example primary green from your designs
  primaryDisabled: '#D3EAA4', // A lighter, desaturated version for disabled state
  textWhite: '#FFFFFF',
  textDisabled: '#F0F0F0', // Or a more muted white/light grey for disabled text
};

const Fonts = {
  size: {
    medium: 16,
    large: 18,
  },
  weight: {
    bold: 'bold' as 'bold',
    semiBold: '600' as '600',
  },
};

const Spacing = {
  small: 8,
  medium: 14,
  large: 24,
};

const BorderRadius = {
  standard: 8,
  pill: 25,
};
// --- End Theme constants ---


// Define the props interface
interface PrimaryButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void; // MODIFIED: Expects GestureResponderEvent
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress, // This will now be (event: GestureResponderEvent) => void
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  iconLeft,
  iconRight,
  fullWidth = true,
}) => {
  const isButtonDisabled = disabled || isLoading;
  const buttonBackgroundColor = isButtonDisabled ? Colors.primaryDisabled : Colors.primary;
  const currentTextColor = isButtonDisabled ? Colors.textDisabled : Colors.textWhite;

  // The `onPress` prop from TouchableOpacity passes the event automatically.
  // So, simply passing `onPress` through is correct if the types match.
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event); // Pass the event to the handler provided by the parent
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonBackgroundColor },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress} // Pass our wrapper or directly `onPress`
      disabled={isButtonDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={currentTextColor} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
          <Text style={[styles.text, { color: currentTextColor }, textStyle]}>
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
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: BorderRadius.standard,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
    fontSize: Fonts.size.medium,
    fontWeight: Fonts.weight.bold,
    textAlign: 'center',
  },
  iconWrapper: {
    marginHorizontal: Spacing.small,
  },
});

export default PrimaryButton;
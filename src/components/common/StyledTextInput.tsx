// components/StyledTextInput.tsx (Conceptual)
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions, // For keyboardType prop
  StyleProp,         // For style props
  ViewStyle,         // For containerStyle
  TextStyle,          // For inputStyle and labelStyle
} from 'react-native';

// Assuming you'll have centralized theme constants.
// These would ideally also have their own type definitions.
// Example:
// interface ThemeColors {
//   primary: string;
//   textDark: string;
//   // ... other colors
// }
// const Colors: ThemeColors = { /* ... your colors ... */ };

// Placeholder for actual theme constants
const Colors = {
  primary: '#A0D911', // Example primary green
  textDark: '#333333',
  textMedium: '#666666',
  placeholder: '#AAAAAA',
  border: '#DDDDDD',
  error: '#FF0000', // Standard error red
  white: '#FFFFFF',
  // ... other theme colors
};

const Fonts = {
  size: {
    extraSmall: 12,
    small: 14,
    medium: 16,
  },
  // weight: { medium: '500', /* ... */ } // if you define font weights
};

const Spacing = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16, // Example spacing units
};

const BorderRadius = {
  standard: 8,
  // ... other border radius values
};

// Define the props interface
interface StyledTextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightPress?: () => void;
  errorMessage?: string;
  touched?: boolean;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>; // Added for label specific styling
  // Add any other specific props you foresee
}

const StyledTextInput: React.FC<StyledTextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect, // undefined by default, TextInput default will apply
  iconLeft,
  iconRight,
  onIconRightPress,
  errorMessage,
  touched,
  editable = true,
  multiline = false,
  numberOfLines,
  inputStyle,
  containerStyle,
  labelStyle,
}) => {
  const showError = touched && errorMessage;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          showError && styles.inputContainerError, // Apply error border style
          !editable && styles.inputContainerDisabled, // Style for disabled state
        ]}
      >
        {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
        <TextInput
          style={[styles.input, inputStyle, !editable && styles.inputDisabled]}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          // underlineColorAndroid="transparent" // Useful for some Android styling
        />
        {iconRight && (
          <TouchableOpacity
            onPress={onIconRightPress}
            style={styles.iconWrapper}
            disabled={!editable || !onIconRightPress}
          >
            {iconRight}
          </TouchableOpacity>
        )}
      </View>
      {showError && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.medium,
  },
  label: {
    fontSize: Fonts.size.small,
    color: Colors.textMedium,
    marginBottom: Spacing.extraSmall,
    // fontWeight: '500', // Example
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.standard,
    paddingHorizontal: Spacing.medium,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: '#F5F5F5', // A common disabled background color
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.medium, // Adjust for desired height
    fontSize: Fonts.size.medium,
    color: Colors.textDark,
  },
  inputDisabled: {
    color: Colors.textMedium, // Text color for disabled input
  },
  iconWrapper: {
    paddingHorizontal: Spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Fonts.size.extraSmall,
    color: Colors.error,
    marginTop: Spacing.extraSmall,
  },
});

export default StyledTextInput;
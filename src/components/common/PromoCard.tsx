// components/PromoCard.tsx (Conceptual)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

// --- Theme constants (Colors, Fonts, Spacing, BorderRadius) ---
// These would be imported from your actual theme files
const Colors = {
  primary: '#A0D911', // Example primary green
  textDark: '#333333',
  textMedium: '#666666',
  textLight: '#888888',
  white: '#FFFFFF',
  border: '#E0E0E0', // A light border color
  // ... other theme colors
};

const Fonts = {
  size: {
    extraSmall: 11,
    small: 13,
    medium: 15,
    large: 17,
  },
  weight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semiBold: '600' as '600',
    bold: 'bold' as 'bold',
  },
};

const Spacing = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
};

const BorderRadius = {
  standard: 8,
  medium: 10, // Example for card rounding
};
// --- End Theme constants ---

interface PromoCardProps {
  promoCode: string;
  description: string;
  validityText: string;
  onApply: () => void;
  style?: StyleProp<ViewStyle>;
  // isApplied?: boolean; // For future consideration
}

const PromoCard: React.FC<PromoCardProps> = ({
  promoCode,
  description,
  validityText,
  onApply,
  style,
  // isApplied = false,
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.promoCodeText}>{promoCode}</Text>
        <Text style={styles.descriptionText}>{description}</Text>
        <Text style={styles.validityText}>{validityText}</Text>
      </View>
      <TouchableOpacity onPress={onApply} style={styles.applyButtonContainer}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    flexDirection: 'row', // Align text content and button horizontally
    justifyContent: 'space-between', // Push button to the right
    alignItems: 'center', // Vertically align items if they have different heights
    borderWidth: 1,
    borderColor: Colors.border,
    // Add shadow here if needed, e.g.:
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 2,
    // elevation: 2,
  },
  textContainer: {
    flex: 1, // Allow text container to take available space
    marginRight: Spacing.medium, // Space before the apply button
  },
  promoCodeText: {
    fontSize: Fonts.size.large,
    fontWeight: Fonts.weight.bold,
    color: Colors.textDark,
    marginBottom: Spacing.extraSmall,
  },
  descriptionText: {
    fontSize: Fonts.size.medium,
    color: Colors.textMedium,
    marginBottom: Spacing.extraSmall,
    lineHeight: Fonts.size.medium * 1.4, // Improved readability
  },
  validityText: {
    fontSize: Fonts.size.small,
    color: Colors.textLight,
  },
  applyButtonContainer: {
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium, // Give some touch area
    borderRadius: BorderRadius.standard, // Optional: if you want button background
    // backgroundColor: Colors.primary, // Example if it were a filled button
  },
  applyButtonText: {
    fontSize: Fonts.size.medium,
    fontWeight: Fonts.weight.semiBold,
    color: Colors.primary, // Styled as a green text link
  },
});

export default PromoCard;
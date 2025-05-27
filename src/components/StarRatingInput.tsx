import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography } from '../theme'; // Assuming your theme files are set up

interface StarRatingInputProps {
  /** The current rating value (e.g., 0 to 5). */
  rating: number;
  /** Function called when the rating changes. */
  onRatingChange: (rating: number) => void;
  /** Maximum number of stars to display. Defaults to 5. */
  maxStars?: number;
  /** Color of selected stars. Defaults to theme's star color or primary. */
  selectedColor?: string;
  /** Color of unselected stars. Defaults to a theme grey. */
  unselectedColor?: string;
  /** Size of the star icons/text. Defaults to a predefined size. */
  starSize?: number;
  /** Style for the container of the stars. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for individual star TouchableOpacity. */
  starStyle?: StyleProp<ViewStyle>;
  /** Style for the star text/icon itself. */
  starTextStyle?: StyleProp<TextStyle>;
  /** If true, the rating cannot be changed. Defaults to false. */
  disabled?: boolean;
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  rating,
  onRatingChange,
  maxStars = 5,
  selectedColor = colors.starYellow || colors.primary, // Fallback to primary if starYellow not in theme
  unselectedColor = colors.greyLight || '#CBD5E0',
  starSize = typography.fontSizes.xxxl || 30, // Default size
  containerStyle,
  starStyle,
  starTextStyle,
  disabled = false,
}) => {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1); // Creates [1, 2, 3, 4, 5]

  const handlePress = (starValue: number) => {
    if (!disabled) {
      onRatingChange(starValue);
    }
  };

  return (
    <View style={[styles.defaultContainerStyle, containerStyle]}>
      {stars.map((starValue) => (
        <TouchableOpacity
          key={starValue}
          onPress={() => handlePress(starValue)}
          style={[styles.defaultStarStyle, starStyle]}
          disabled={disabled}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <Text
            style={[
              styles.defaultStarTextStyle,
              { fontSize: starSize },
              rating >= starValue ? { color: selectedColor } : { color: unselectedColor },
              starTextStyle,
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  defaultContainerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultStarStyle: {
    paddingHorizontal: spacing.xs / 2, // Small spacing between stars
  },
  defaultStarTextStyle: {
    // Default text style if any, size and color are handled by props
  },
});

export default StarRatingInput;
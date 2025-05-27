// components/BikeCard.tsx (Conceptual)
import React from 'react';
import { GestureResponderEvent } from 'react-native'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import PrimaryButton from './PrimaryButton'; // Assuming PrimaryButton is in the same folder or accessible path
// Import icons (e.g., from react-native-vector-icons or an SVG library)
// import Icon from 'react-native-vector-icons/MaterialIcons'; // Example

// Placeholder for actual theme constants
const Colors = {
  primary: '#A0D911', // Example primary green
  textDark: '#333333',
  textMedium: '#666666',
  textLight: '#888888',
  white: '#FFFFFF',
  border: '#EEEEEE',
  starYellow: '#FFD700', // For star ratings
  // ... other theme colors
};

const Fonts = {
  size: {
    extraSmall: 10,
    small: 12,
    medium: 14,
    large: 16,
    xLarge: 18,
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
  large: 12, // For card rounding
};

interface BikeCardProps {
  imageUrl: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceInKm: number;
  pricePerHour: number;
  currencySymbol?: string; // Optional, defaults to ₹ or $
  onPressBookNow: () => void;
  onPressCard: () => void;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  // isAvailable?: boolean; // For future use
}

const BikeCard: React.FC<BikeCardProps> = ({
  imageUrl,
  name,
  rating,
  reviewCount,
  distanceInKm,
  pricePerHour,
  currencySymbol = '₹', // Default currency symbol
  onPressBookNow,
  onPressCard,
  style,
  imageStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.cardContainer, style]}
      onPress={onPressCard}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, imageStyle]}
        resizeMode="cover" // Or "contain" depending on design needs
      />
      <View style={styles.contentContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.row}>
        
          <Text style={styles.starIcon}>★</Text> 
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} ({reviewCount})
          </Text>
        </View>

        <View style={styles.row}>
        
          <Text style={styles.locationIcon}>📍</Text> 
          <Text style={styles.distanceText}>{distanceInKm.toFixed(1)} km</Text>
        </View>

        <View style={styles.priceAndButtonRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmountText}>
              {currencySymbol}
              {pricePerHour}
            </Text>
            <Text style={styles.priceUnitText}>/hr</Text>
          </View>
          <PrimaryButton
            title="Book Now"
            onPress={(event :  GestureResponderEvent) => {
              event.stopPropagation(); // Prevent card press if button is part of it
              onPressBookNow();
            }}
            style={styles.bookNowButton}
            textStyle={styles.bookNowButtonText}
            fullWidth={false} // Override default fullWidth
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.large,
    // Shadow styles (platform-dependent)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android
  },
  image: {
    width: '100%',
    height: 150, // Adjust as needed
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
  },
  contentContainer: {
    padding: Spacing.medium,
  },
  nameText: {
    fontSize: Fonts.size.large,
    fontWeight: Fonts.weight.bold,
    color: Colors.textDark,
    marginBottom: Spacing.extraSmall,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.extraSmall,
  },
  starIcon: { // Placeholder style
    color: Colors.starYellow,
    fontSize: Fonts.size.medium,
    marginRight: Spacing.extraSmall,
  },
  ratingText: {
    fontSize: Fonts.size.small,
    color: Colors.textMedium,
  },
  locationIcon: { // Placeholder style
    fontSize: Fonts.size.small,
    marginRight: Spacing.extraSmall,
    color: Colors.textMedium,
  },
  distanceText: {
    fontSize: Fonts.size.small,
    color: Colors.textMedium,
  },
  priceAndButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // To align "/hr" nicely with the price
  },
  priceAmountText: {
    fontSize: Fonts.size.xLarge,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  priceUnitText: {
    fontSize: Fonts.size.small,
    color: Colors.textMedium,
    marginLeft: Spacing.extraSmall / 2,
    marginBottom: Spacing.extraSmall / 2, // slight adjustment for baseline
  },
  bookNowButton: {
    paddingVertical: Spacing.small, // Smaller padding for card button
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.standard, // Or a different radius if needed
  },
  bookNowButtonText: {
    fontSize: Fonts.size.medium, // Potentially smaller font for card button
    fontWeight: Fonts.weight.semiBold,
  },
});

export default BikeCard;
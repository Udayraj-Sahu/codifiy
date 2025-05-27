// src/screens/App/Explore/FilterScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform, // For potential platform-specific styling or components
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native'; // If you plan to pass initial filters
import { ExploreStackParamList } from '../../../navigation/types';
import  PrimaryButton  from '../../../components/common/PrimaryButton'; // Corrected import path
import StarRatingInput from '../../../components/StarRatingInput'; // Corrected import path
import { colors, spacing, typography, borderRadius } from '../../../theme';

// --- More Defined Placeholder Components (still recommend replacing with proper libraries) ---

// Slider Placeholder (using simple buttons for +/- for now)
// For a real app, use: import Slider from '@react-native-community/slider';
interface SliderPlaceholderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  labelSuffix?: string;
}
const SliderPlaceholder: React.FC<SliderPlaceholderProps> = ({
  label,
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 10,
  step = 1,
  labelSuffix = '',
}) => (
  <View style={styles.sliderContainer}>
    <View style={styles.sliderLabelRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Text style={styles.sliderValueText}>
        {value.toFixed(labelSuffix.includes('km') ? 1 : 0)}
        {labelSuffix}
      </Text>
    </View>
 
    <View style={styles.sliderControlPlaceholder}>
      <TouchableOpacity
        style={styles.sliderButton}
        onPress={() => onValueChange(Math.max(minimumValue, value - step))}
      >
        <Text style={styles.sliderButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.sliderTrackPlaceholderText}> (Use @RNC/Slider) </Text>
      <TouchableOpacity
        style={styles.sliderButton}
        onPress={() => onValueChange(Math.min(maximumValue, value + step))}
      >
        <Text style={styles.sliderButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Bike Type Chip (more styled placeholder)
interface BikeTypeChipProps {
  label: string;
  icon?: string; // Emoji or icon name (e.g., from react-native-vector-icons)
  isSelected: boolean;
  onPress: () => void;
}
const BikeTypeChip: React.FC<BikeTypeChipProps> = ({ label, icon, isSelected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.bikeTypeChipBase,
      isSelected ? styles.bikeTypeChipSelected : styles.bikeTypeChipNotSelected,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon && <Text style={styles.bikeTypeChipIconText}>{icon}</Text>}
    <Text style={[styles.bikeTypeChipTextBase, isSelected ? styles.bikeTypeChipTextSelected : styles.bikeTypeChipTextNotSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Checkbox Item (more styled placeholder)
interface CheckboxItemProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}
const CheckboxItem: React.FC<CheckboxItemProps> = ({ label, value, onValueChange, accessibilityLabel }) => (
  <TouchableOpacity
    style={styles.checkboxItemContainer}
    onPress={() => onValueChange(!value)}
    activeOpacity={0.7}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: value }}
    accessibilityLabel={accessibilityLabel || label}
  >
    <View style={[styles.checkboxSquareBase, value && styles.checkboxSquareChecked]}>
      {value && <Text style={styles.checkboxCheckText}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabelText}>{label}</Text>
  </TouchableOpacity>
);
// --- End Placeholder Components ---

// Define the structure for filters that can be passed back
export interface AppliedFilters {
  distance?: number;
  bikeTypes?: string[];
  pricePerHourMin?: number;
  pricePerHourMax?: number;
  availability?: 'now' | 'today'; // Simplified, 'customDate' would need a date picker
  minRating?: number;
  verifiedOwner?: boolean;
  freeHelmet?: boolean;
  lowDeposit?: boolean;
  instantBooking?: boolean;
}

type FilterScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'Filter'>;
// If FilterScreen can receive initial filters from ExploreScreen:
// type FilterScreenRouteProp = RouteProp<ExploreStackParamList, 'Filter'>;
// interface FilterScreenProps {
//   navigation: FilterScreenNavigationProp;
//   route: FilterScreenRouteProp;
// }

interface FilterScreenProps {
  navigation: FilterScreenNavigationProp;
}


const BIKE_TYPES_OPTIONS = [
    { label: 'Scooter', value: 'Scooter', icon: '🛵' },
    { label: 'Motorcycle', value: 'Motorcycle', icon: '🏍️' },
    { label: 'Electric', value: 'Electric', icon: '⚡' },
    { label: 'Mountain', value: 'Mountain', icon: '⛰️' },
];
const PRICE_MIN_DEFAULT = 0;
const PRICE_MAX_DEFAULT = 5000;
const DISTANCE_DEFAULT = 3.5;

const FilterScreen: React.FC<FilterScreenProps> = ({ navigation /*, route*/ }) => {
  // const initialFilters = route.params?.initialFilters || {}; // If passing initial filters

  const [distance, setDistance] = useState<number>(DISTANCE_DEFAULT);
  const [selectedBikeTypes, setSelectedBikeTypes] = useState<string[]>([]);
  const [priceRangeMin, setPriceRangeMin] = useState<number>(50);
  const [priceRangeMax, setPriceRangeMax] = useState<number>(2000);
  const [availabilityNow, setAvailabilityNow] = useState<boolean>(false);
  const [availabilityToday, setAvailabilityToday] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [additionalFilters, setAdditionalFilters] = useState({
    verifiedOwner: false,
    freeHelmet: false,
    lowDeposit: false,
    instantBooking: false,
  });

  const handleBikeTypeToggle = useCallback((typeValue: string) => {
    setSelectedBikeTypes(prev =>
      prev.includes(typeValue) ? prev.filter(t => t !== typeValue) : [...prev, typeValue]
    );
  }, []);

  const handleAvailabilityChange = (type: 'now' | 'today') => {
    if (type === 'now') {
      setAvailabilityNow(!availabilityNow);
      if (!availabilityNow) setAvailabilityToday(false); // If 'now' is selected, deselect 'today'
    } else if (type === 'today') {
      setAvailabilityToday(!availabilityToday);
      if (!availabilityToday) setAvailabilityNow(false); // If 'today' is selected, deselect 'now'
    }
  };

  const handleResetFilters = useCallback(() => {
    setDistance(DISTANCE_DEFAULT);
    setSelectedBikeTypes([]);
    setPriceRangeMin(50);
    setPriceRangeMax(2000);
    setAvailabilityNow(false);
    setAvailabilityToday(false);
    setMinRating(0);
    setAdditionalFilters({ verifiedOwner: false, freeHelmet: false, lowDeposit: false, instantBooking: false });
  }, []);

  const handleApplyFilters = useCallback(() => {
    const applied: AppliedFilters = {};
    if (distance > 0.5) applied.distance = distance; // Assuming 0.5 is min effective distance
    if (selectedBikeTypes.length > 0) applied.bikeTypes = selectedBikeTypes;
    if (priceRangeMin > PRICE_MIN_DEFAULT) applied.pricePerHourMin = priceRangeMin;
    if (priceRangeMax < PRICE_MAX_DEFAULT) applied.pricePerHourMax = priceRangeMax; // Only apply if not max
    if (availabilityNow) applied.availability = 'now';
    else if (availabilityToday) applied.availability = 'today';
    if (minRating > 0) applied.minRating = minRating;
    if (additionalFilters.verifiedOwner) applied.verifiedOwner = true;
    if (additionalFilters.freeHelmet) applied.freeHelmet = true;
    if (additionalFilters.lowDeposit) applied.lowDeposit = true;
    if (additionalFilters.instantBooking) applied.instantBooking = true;

    // Pass filters back to ExploreScreen
    // ExploreScreen needs to be set up to receive these params and apply them
    navigation.navigate('Explore', { appliedFilters: applied } as any); // Using 'as any' temporarily if appliedFilters isn't in Explore's params yet
                                                                      // TODO: Add appliedFilters to ExploreStackParamList for Explore screen
    // Modals usually dismiss themselves when navigating away.
    // If not, or if you want explicit control: navigation.goBack();
  }, [navigation, distance, selectedBikeTypes, priceRangeMin, priceRangeMax, availabilityNow, availabilityToday, minRating, additionalFilters]);

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        
        <SliderPlaceholder
          label="Show bikes within"
          value={distance}
          onValueChange={setDistance}
          minimumValue={0.5}
          maximumValue={20}
          step={0.5}
          labelSuffix=" km"
        />

       
        <Text style={styles.filterSectionTitle}>Bike Type</Text>
        <View style={styles.bikeTypeContainer}>
          {BIKE_TYPES_OPTIONS.map(type => (
            <BikeTypeChip
              key={type.value}
              label={type.label}
              icon={type.icon}
              isSelected={selectedBikeTypes.includes(type.value)}
              onPress={() => handleBikeTypeToggle(type.value)}
            />
          ))}
        </View>

     
        <Text style={styles.filterSectionTitle}>Price per hour</Text>
        <SliderPlaceholder // This would ideally be a Range Slider
          label="Min Price"
          value={priceRangeMin}
          onValueChange={(val) => setPriceRangeMin(Math.min(val, priceRangeMax - 50))} // Ensure min < max
          minimumValue={PRICE_MIN_DEFAULT}
          maximumValue={PRICE_MAX_DEFAULT - 50} // Max for min slider
          step={50}
          labelSuffix={` ${colors.primary}`} // Example currency
        />
        <SliderPlaceholder
          label="Max Price"
          value={priceRangeMax}
          onValueChange={(val) => setPriceRangeMax(Math.max(val, priceRangeMin + 50))} // Ensure max > min
          minimumValue={PRICE_MIN_DEFAULT + 50} // Min for max slider
          maximumValue={PRICE_MAX_DEFAULT}
          step={50}
          labelSuffix={` ${colors.primary}`} // Example currency
        />

        
        <Text style={styles.filterSectionTitle}>Availability</Text>
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>Available Now</Text>
          <Switch
            trackColor={{ false: colors.greyLightest || '#E0E0E0', true: colors.primaryLight || '#D3EAA4' }}
            thumbColor={availabilityNow ? colors.primary : Platform.OS === 'ios' ? colors.white : colors.greyMedium}
            ios_backgroundColor={colors.greyLightest}
            onValueChange={() => handleAvailabilityChange('now')}
            value={availabilityNow}
          />
        </View>
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>Available Today</Text>
          <Switch
            trackColor={{ false: colors.greyLightest || '#E0E0E0', true: colors.primaryLight || '#D3EAA4' }}
            thumbColor={availabilityToday ? colors.primary : Platform.OS === 'ios' ? colors.white : colors.greyMedium}
            ios_backgroundColor={colors.greyLightest}
            onValueChange={() => handleAvailabilityChange('today')}
            value={availabilityToday}
          />
        </View>

      
        <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
        <StarRatingInput
            rating={minRating}
            onRatingChange={setMinRating}
            maxStars={5}
            starSize={32}
            containerStyle={styles.starRatingInputContainer}
        />

    
        <Text style={styles.filterSectionTitle}>Additional Filters</Text>
        <CheckboxItem
          label="Verified Owner"
          value={additionalFilters.verifiedOwner}
          onValueChange={val => setAdditionalFilters(prev => ({ ...prev, verifiedOwner: val }))}
        />
        <CheckboxItem
          label="Free Helmet"
          value={additionalFilters.freeHelmet}
          onValueChange={val => setAdditionalFilters(prev => ({ ...prev, freeHelmet: val }))}
        />
        <CheckboxItem
          label="Low Deposit"
          value={additionalFilters.lowDeposit}
          onValueChange={val => setAdditionalFilters(prev => ({ ...prev, lowDeposit: val }))}
        />
        <CheckboxItem
          label="Instant Booking"
          value={additionalFilters.instantBooking}
          onValueChange={val => setAdditionalFilters(prev => ({ ...prev, instantBooking: val }))}
        />
      </ScrollView>

    
      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters} activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        <PrimaryButton
          title="Apply Filters"
          onPress={handleApplyFilters}
          style={styles.applyButton}
          fullWidth={false} // PrimaryButton defaults to true, override here
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContentContainer: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s, // If header is present and has its own padding
    paddingBottom: spacing.xxl * 2.5, // Ample space for the fixed footer
  },
  filterSectionTitle: {
    fontSize: typography.fontSizes.l,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  // Slider Placeholder Styles
  sliderContainer: {
    marginBottom: spacing.m,
    paddingVertical: spacing.s,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  sliderLabel: {
    fontSize: typography.fontSizes.m,
    color: colors.textSecondary,
  },
  sliderValueText: {
    fontSize: typography.fontSizes.m,
    fontWeight: typography.fontWeights.medium,
    color: colors.primary,
  },
  sliderControlPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Or space-between if you have a visual track
    backgroundColor: colors.greyLightest || '#F0F0F0',
    borderRadius: borderRadius.s,
    paddingVertical: spacing.xs,
  },
  sliderButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  sliderButtonText: {
    fontSize: typography.fontSizes.xl,
    color: colors.primary,
  },
  sliderTrackPlaceholderText: {
    color: colors.textMedium,
    marginHorizontal: spacing.m,
  },
  // Bike Type Chip Styles
  bikeTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow chips to wrap to next line
    marginBottom: spacing.s,
  },
  bikeTypeChipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    marginRight: spacing.s,
    marginBottom: spacing.s,
  },
  bikeTypeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bikeTypeChipNotSelected: {
    backgroundColor: colors.white,
    borderColor: colors.borderDefault || '#E0E0E0',
  },
  bikeTypeChipIconText: {
    marginRight: spacing.xs,
    fontSize: typography.fontSizes.m, // Adjust if using image icons
  },
  bikeTypeChipTextBase: {
    fontSize: typography.fontSizes.s,
  },
  bikeTypeChipTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
  bikeTypeChipTextNotSelected: {
    color: colors.textMedium,
  },
  // Availability Styles
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault || '#F0F0F0',
  },
  availabilityLabel: {
    fontSize: typography.fontSizes.m,
    color: colors.textPrimary,
  },
  // Star Rating Input Container Style
  starRatingInputContainer: {
    justifyContent: 'flex-start', // Align stars to the left
    marginBottom: spacing.l,
  },
  // Checkbox Item Styles
  checkboxItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault || '#F0F0F0',
  },
  checkboxSquareBase: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.greyMedium,
    borderRadius: borderRadius.s,
    marginRight: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  checkboxSquareChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheckText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: typography.fontSizes.s,
  },
  checkboxLabelText: {
    fontSize: typography.fontSizes.m,
    color: colors.textPrimary,
    flex: 1, // Allow label to take remaining space
  },
  // Footer Styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    paddingBottom: Platform.OS === 'ios' ? spacing.l : spacing.s, // More padding for home indicator on iOS
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault || '#E0E0E0',
    backgroundColor: colors.white,
    // position: 'absolute', // If you want it to overlay content
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
  resetButton: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.m,
    // backgroundColor: colors.greyLightest, // Example subtle background
  },
  resetButtonText: {
    fontSize: typography.fontSizes.m,
    color: colors.textMedium,
    fontWeight: typography.fontWeights.semiBold,
  },
  applyButton: {
    // PrimaryButton is fullWidth by default, if we need it to share space:
    flex: 1, // Take available space
    marginLeft: spacing.m,
  },
});

export default FilterScreen;
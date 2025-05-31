// src/screens/App/Explore/FilterScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useState } from "react";
import {
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
// import { RouteProp } from '@react-navigation/native'; // Uncomment if passing initial filters
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // For icons
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import StarRatingInput from "../../../components/StarRatingInput"; // Assumed to be themed or accept themed props
import { ExploreStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Placeholder Components (Styled for Dark Theme) ---
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
	labelSuffix = "",
}) => (
	<View style={styles.sliderContainer}>
		<View style={styles.sliderLabelRow}>
			<Text style={styles.sliderLabel}>{label}</Text>
			<Text style={styles.sliderValueText}>
				{value.toFixed(labelSuffix.includes("km") ? 1 : 0)}
				{labelSuffix}
			</Text>
		</View>
		<View style={styles.sliderControlPlaceholder}>
			<TouchableOpacity
				style={styles.sliderButton}
				onPress={() =>
					onValueChange(Math.max(minimumValue, value - step))
				}>
				<MaterialIcons
					name="remove-circle-outline"
					size={24}
					color={colors.primary}
				/>
			</TouchableOpacity>
			<Text style={styles.sliderTrackPlaceholderText}>
				{" "}
				(Use a Slider component){" "}
			</Text>
			<TouchableOpacity
				style={styles.sliderButton}
				onPress={() =>
					onValueChange(Math.min(maximumValue, value + step))
				}>
				<MaterialIcons
					name="add-circle-outline"
					size={24}
					color={colors.primary}
				/>
			</TouchableOpacity>
		</View>
	</View>
);

interface BikeTypeChipProps {
	label: string;
	icon?: string;
	isSelected: boolean;
	onPress: () => void;
}
const BikeTypeChip: React.FC<BikeTypeChipProps> = ({
	label,
	icon,
	isSelected,
	onPress,
}) => (
	<TouchableOpacity
		style={[
			styles.bikeTypeChipBase,
			isSelected
				? styles.bikeTypeChipSelected
				: styles.bikeTypeChipNotSelected,
		]}
		onPress={onPress}
		activeOpacity={0.7}>
		{icon && (
			<Text
				style={[
					styles.bikeTypeChipIconText,
					isSelected
						? styles.bikeTypeChipTextSelected
						: styles.bikeTypeChipTextNotSelected,
				]}>
				{icon}
			</Text>
		)}
		<Text
			style={[
				styles.bikeTypeChipTextBase,
				isSelected
					? styles.bikeTypeChipTextSelected
					: styles.bikeTypeChipTextNotSelected,
			]}>
			{label}
		</Text>
	</TouchableOpacity>
);

interface CheckboxItemProps {
	label: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
	accessibilityLabel?: string;
}
const CheckboxItem: React.FC<CheckboxItemProps> = ({
	label,
	value,
	onValueChange,
	accessibilityLabel,
}) => (
	<TouchableOpacity
		style={styles.checkboxItemContainer}
		onPress={() => onValueChange(!value)}
		activeOpacity={0.7}
		accessibilityRole="checkbox"
		accessibilityState={{ checked: value }}
		accessibilityLabel={accessibilityLabel || label}>
		<View
			style={[
				styles.checkboxSquareBase,
				value && styles.checkboxSquareChecked,
			]}>
			{value && (
				<MaterialIcons
					name="check"
					size={16}
					color={colors.buttonPrimaryText}
				/>
			)}
		</View>
		<Text style={styles.checkboxLabelText}>{label}</Text>
	</TouchableOpacity>
);

// --- Filter Definitions ---
export interface AppliedFilters {
	distance?: number;
	bikeTypes?: string[];
	pricePerHourMin?: number;
	pricePerHourMax?: number;
	availability?: "now" | "today";
	minRating?: number;
	verifiedOwner?: boolean;
	freeHelmet?: boolean;
	lowDeposit?: boolean;
	instantBooking?: boolean;
}

type FilterScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"Filter"
>;

interface FilterScreenProps {
	navigation: FilterScreenNavigationProp;
	// route: RouteProp<ExploreStackParamList, 'Filter'>; // If receiving initialFilters
}

const BIKE_TYPES_OPTIONS = [
	{ label: "Scooter", value: "Scooter", icon: "🛵" },
	{ label: "Motorcycle", value: "Motorcycle", icon: "🏍️" },
	{ label: "Electric", value: "Electric", icon: "⚡" },
	{ label: "Mountain", value: "Mountain", icon: "⛰️" },
	// { label: 'Cruiser', value: 'Cruiser', icon: '🛹' }, // Example
	// { label: 'Road', value: 'Road', icon: '🚲' },       // Example
];
const PRICE_MIN_DEFAULT = 0;
const PRICE_MAX_DEFAULT = 5000; // Adjust as per your app's max price
const DISTANCE_DEFAULT = 5; // Default distance in km

const FilterScreen: React.FC<FilterScreenProps> = ({
	navigation /*, route*/,
}) => {
	// const initialFilters = route.params?.initialFilters || {};

	const [distance, setDistance] = useState<number>(DISTANCE_DEFAULT);
	const [selectedBikeTypes, setSelectedBikeTypes] = useState<string[]>([]);
	const [priceRangeMin, setPriceRangeMin] = useState<number>(100); // Example default min
	const [priceRangeMax, setPriceRangeMax] = useState<number>(1500); // Example default max
	const [availabilityNow, setAvailabilityNow] = useState<boolean>(false);
	const [availabilityToday, setAvailabilityToday] = useState<boolean>(false);
	const [minRating, setMinRating] = useState<number>(0); // 0 means no filter
	const [additionalFilters, setAdditionalFilters] = useState({
		verifiedOwner: false,
		freeHelmet: false,
		lowDeposit: false,
		instantBooking: false,
	});

	const handleBikeTypeToggle = useCallback((typeValue: string) => {
		setSelectedBikeTypes((prev) =>
			prev.includes(typeValue)
				? prev.filter((t) => t !== typeValue)
				: [...prev, typeValue]
		);
	}, []);

	const handleAvailabilityChange = (type: "now" | "today") => {
		if (type === "now") {
			const newAvailabilityNow = !availabilityNow;
			setAvailabilityNow(newAvailabilityNow);
			if (newAvailabilityNow) setAvailabilityToday(false);
		} else if (type === "today") {
			const newAvailabilityToday = !availabilityToday;
			setAvailabilityToday(newAvailabilityToday);
			if (newAvailabilityToday) setAvailabilityNow(false);
		}
	};

	const handleResetFilters = useCallback(() => {
		setDistance(DISTANCE_DEFAULT);
		setSelectedBikeTypes([]);
		setPriceRangeMin(100);
		setPriceRangeMax(1500);
		setAvailabilityNow(false);
		setAvailabilityToday(false);
		setMinRating(0);
		setAdditionalFilters({
			verifiedOwner: false,
			freeHelmet: false,
			lowDeposit: false,
			instantBooking: false,
		});
	}, []);

	const handleApplyFilters = useCallback(() => {
		const applied: AppliedFilters = {};
		if (distance > 0.5) applied.distance = distance;
		if (selectedBikeTypes.length > 0) applied.bikeTypes = selectedBikeTypes;
		// Only apply price filters if they differ significantly from defaults or create a meaningful range
		if (
			priceRangeMin > PRICE_MIN_DEFAULT ||
			priceRangeMax < PRICE_MAX_DEFAULT
		) {
			if (priceRangeMin > PRICE_MIN_DEFAULT)
				applied.pricePerHourMin = priceRangeMin;
			if (priceRangeMax < PRICE_MAX_DEFAULT)
				applied.pricePerHourMax = priceRangeMax;
		}
		if (availabilityNow) applied.availability = "now";
		else if (availabilityToday) applied.availability = "today";
		if (minRating > 0) applied.minRating = minRating;
		if (additionalFilters.verifiedOwner) applied.verifiedOwner = true;
		if (additionalFilters.freeHelmet) applied.freeHelmet = true;
		if (additionalFilters.lowDeposit) applied.lowDeposit = true;
		if (additionalFilters.instantBooking) applied.instantBooking = true;

		navigation.navigate("Explore", { appliedFilters: applied } as any);
	}, [
		navigation,
		distance,
		selectedBikeTypes,
		priceRangeMin,
		priceRangeMax,
		availabilityNow,
		availabilityToday,
		minRating,
		additionalFilters,
	]);

	return (
		<View style={styles.screenContainer}>
			<ScrollView
				contentContainerStyle={styles.scrollContentContainer}
				showsVerticalScrollIndicator={false}>
				<Text style={styles.filterSectionTitle}>Distance</Text>
				<SliderPlaceholder
					label="Show bikes within"
					value={distance}
					onValueChange={setDistance}
					minimumValue={0.5} // e.g., 500m
					maximumValue={25} // e.g., 25km
					step={0.5}
					labelSuffix=" km"
				/>

				<Text style={styles.filterSectionTitle}>Bike Type</Text>
				<View style={styles.bikeTypeContainer}>
					{BIKE_TYPES_OPTIONS.map((type) => (
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
					onValueChange={(val) =>
						setPriceRangeMin(Math.min(val, priceRangeMax - 50))
					} // Ensure min < max
					minimumValue={PRICE_MIN_DEFAULT}
					maximumValue={PRICE_MAX_DEFAULT - 50}
					step={50}
					labelSuffix={` ${currencySymbol()}`}
				/>
				<SliderPlaceholder
					label="Max Price"
					value={priceRangeMax}
					onValueChange={(val) =>
						setPriceRangeMax(Math.max(val, priceRangeMin + 50))
					} // Ensure max > min
					minimumValue={PRICE_MIN_DEFAULT + 50}
					maximumValue={PRICE_MAX_DEFAULT}
					step={50}
					labelSuffix={` ${currencySymbol()}`}
				/>

				<Text style={styles.filterSectionTitle}>Availability</Text>
				<View style={styles.availabilityRow}>
					<Text style={styles.availabilityLabel}>Available Now</Text>
					<Switch
						trackColor={{
							false: colors.borderDefault,
							true: colors.primaryLight,
						}}
						thumbColor={
							availabilityNow
								? colors.primary
								: colors.textDisabled
						}
						ios_backgroundColor={colors.borderDefault}
						onValueChange={() => handleAvailabilityChange("now")}
						value={availabilityNow}
					/>
				</View>
				<View style={styles.availabilityRow}>
					<Text style={styles.availabilityLabel}>
						Available Today
					</Text>
					<Switch
						trackColor={{
							false: colors.borderDefault,
							true: colors.primaryLight,
						}}
						thumbColor={
							availabilityToday
								? colors.primary
								: colors.textDisabled
						}
						ios_backgroundColor={colors.borderDefault}
						onValueChange={() => handleAvailabilityChange("today")}
						value={availabilityToday}
					/>
				</View>

				<Text style={styles.filterSectionTitle}>Minimum Rating</Text>
				<StarRatingInput // Ensure StarRatingInput is themed or accepts theme props
					rating={minRating}
					onRatingChange={setMinRating}
					maxStars={5}
					starSize={36} // Slightly larger stars
					containerStyle={styles.starRatingInputContainer}
					activeColor={colors.primary} // Pass themed colors
					inactiveColor={colors.borderDefault} // Pass themed colors
				/>

				<Text style={styles.filterSectionTitle}>More Options</Text>
				<CheckboxItem
					label="Verified Owner"
					value={additionalFilters.verifiedOwner}
					onValueChange={(val) =>
						setAdditionalFilters((prev) => ({
							...prev,
							verifiedOwner: val,
						}))
					}
				/>
				<CheckboxItem
					label="Free Helmet Included"
					value={additionalFilters.freeHelmet}
					onValueChange={(val) =>
						setAdditionalFilters((prev) => ({
							...prev,
							freeHelmet: val,
						}))
					}
				/>
				<CheckboxItem
					label="Low Security Deposit"
					value={additionalFilters.lowDeposit}
					onValueChange={(val) =>
						setAdditionalFilters((prev) => ({
							...prev,
							lowDeposit: val,
						}))
					}
				/>
				<CheckboxItem
					label="Instant Booking Available"
					value={additionalFilters.instantBooking}
					onValueChange={(val) =>
						setAdditionalFilters((prev) => ({
							...prev,
							instantBooking: val,
						}))
					}
				/>
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.resetButton}
					onPress={handleResetFilters}
					activeOpacity={0.7}>
					<Text style={styles.resetButtonText}>Reset All</Text>
				</TouchableOpacity>
				<PrimaryButton // Assumed to be themed
					title="Apply Filters"
					onPress={handleApplyFilters}
					style={styles.applyButton}
					fullWidth={false}
				/>
			</View>
		</View>
	);
};

// Helper for currency symbol, can be moved to a utility or config
const currencySymbol = () => "₹"; // Or from a settings/localization context

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme main background
	},
	scrollContentContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.xxl * 2.5, // Ample space for the fixed footer
	},
	filterSectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold, // Use themed font family
		color: colors.textPrimary, // Light text for titles
		marginTop: spacing.l,
		marginBottom: spacing.m, // Increased margin
	},
	sliderContainer: {
		marginBottom: spacing.m,
		paddingVertical: spacing.s,
	},
	sliderLabelRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.s,
	},
	sliderLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text for labels
	},
	sliderValueText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.primary, // Accent color for value
	},
	sliderControlPlaceholder: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between", // Better for +/- buttons
		backgroundColor: colors.backgroundCard, // Dark card background for controls
		borderRadius: borderRadius.m,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	sliderButton: {
		padding: spacing.s, // Make touch area larger
	},
	sliderButtonText: {
		// This style is not used if using MaterialIcons
		// fontSize: typography.fontSizes.xl,
		// color: colors.primary,
	},
	sliderTrackPlaceholderText: {
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // Muted placeholder text
		marginHorizontal: spacing.m,
		fontSize: typography.fontSizes.s,
	},
	bikeTypeContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: spacing.s,
	},
	bikeTypeChipBase: {
		flexDirection: "row",
		alignItems: "center",
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
		backgroundColor: colors.backgroundCard, // Dark background for unselected chips
		borderColor: colors.borderDefault, // Border for unselected chips
	},
	bikeTypeChipIconText: {
		marginRight: spacing.xs,
		fontSize: typography.fontSizes.m,
		// Color will be inherited from bikeTypeChipTextSelected/NotSelected
	},
	bikeTypeChipTextBase: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	bikeTypeChipTextSelected: {
		color: colors.buttonPrimaryText, // Light text on primary bg
	},
	bikeTypeChipTextNotSelected: {
		color: colors.textSecondary, // Muted text for unselected
	},
	availabilityRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault, // Themed border
	},
	availabilityLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary, // Light text
	},
	starRatingInputContainer: {
		justifyContent: "flex-start",
		marginBottom: spacing.l,
		paddingVertical: spacing.s, // Add some padding around stars
	},
	checkboxItemContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	checkboxSquareBase: {
		width: 22,
		height: 22,
		borderWidth: 1.5,
		borderColor: colors.borderDefault, // Darker border for unchecked
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark background for checkbox
	},
	checkboxSquareChecked: {
		backgroundColor: colors.primary, // Primary color when checked
		borderColor: colors.primary,
	},
	// checkboxCheckText: { // Not used if using MaterialIcons
	//  color: colors.buttonPrimaryText,
	//  fontWeight: 'bold',
	//  fontSize: typography.fontSizes.s,
	// },
	checkboxLabelText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary, // Light text
		flex: 1,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m, // Consistent padding
		paddingBottom:
			Platform.OS === "ios" ? spacing.l + spacing.s : spacing.m, // More padding for home indicator
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault,
		backgroundColor: colors.backgroundCard, // Dark footer background
	},
	resetButton: {
		paddingVertical: spacing.m - (Platform.OS === "ios" ? 2 : 0), // Align with PrimaryButton better
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
	},
	resetButtonText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
		color: colors.textLink, // Make reset look like a link or secondary action
	},
	applyButton: {
		// Style for the PrimaryButton instance
		flex: 1,
		marginLeft: spacing.m,
		// PrimaryButton component handles its own fullWidth logic and theming
	},
});

export default FilterScreen;

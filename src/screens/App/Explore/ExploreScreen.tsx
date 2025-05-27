// src/screens/App/Explore/ExploreScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
	FlatList,
	ScrollView,
	StyleSheet,
	Text, // Or FlatList for better performance with many items
	TouchableOpacity,
	View,
} from "react-native";
import BikeCard from "../../../components/common/BikeCard";
import StyledTextInput from "../../../components/common/StyledTextInput"; // Assuming components are set up
import { ExploreStackParamList } from "../../../navigation/types";
import { colors, spacing, typography } from "../../../theme"; // Assuming theme is set up

// --- Placeholder for FilterChip component (we should define this properly later) ---
interface FilterChipProps {
	label: string;
	isSelected: boolean;
	onPress: () => void;
}
const FilterChip: React.FC<FilterChipProps> = ({
	label,
	isSelected,
	onPress,
}) => (
	<TouchableOpacity
		style={[
			styles.chip,
			isSelected ? styles.chipSelected : styles.chipNotSelected,
		]}
		onPress={onPress}>
		<Text
			style={
				isSelected
					? styles.chipTextSelected
					: styles.chipTextNotSelected
			}>
			{label}
		</Text>
	</TouchableOpacity>
);
// --- End Placeholder FilterChip ---

// --- Dummy Bike Data (replace with actual API data later) ---
interface Bike {
	id: string;
	imageUrl: string;
	name: string;
	rating: number;
	reviewCount: number;
	distanceInKm: number;
	pricePerHour: number;
	currencySymbol?: string;
}

const DUMMY_BIKES: Bike[] = [
	{
		id: "1",
		name: "Trek Mountain Bike",
		imageUrl: "https://via.placeholder.com/300x200.png?text=Bike+1",
		rating: 4.5,
		reviewCount: 128,
		distanceInKm: 1.2,
		pricePerHour: 75,
		currencySymbol: "₹",
	},
	{
		id: "2",
		name: "Electric Scooter Pro",
		imageUrl: "https://via.placeholder.com/300x200.png?text=Bike+2",
		rating: 4.8,
		reviewCount: 96,
		distanceInKm: 0.8,
		pricePerHour: 45,
		currencySymbol: "₹",
	},
	{
		id: "3",
		name: "Road Bike Elite",
		imageUrl: "https://via.placeholder.com/300x200.png?text=Bike+3",
		rating: 4.2,
		reviewCount: 156,
		distanceInKm: 2.1,
		pricePerHour: 95,
		currencySymbol: "₹",
	},
	{
		id: "4",
		name: "City Commuter Bike",
		imageUrl: "https://via.placeholder.com/300x200.png?text=Bike+4",
		rating: 4.0,
		reviewCount: 84,
		distanceInKm: 1.5,
		pricePerHour: 65,
		currencySymbol: "₹",
	},
];
// --- End Dummy Bike Data ---

type ExploreScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"Explore"
>;

interface ExploreScreenProps {
	navigation: ExploreScreenNavigationProp;
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] =
		useState<string>("All Bikes");
	// const [bikes, setBikes] = useState<Bike[]>(DUMMY_BIKES); // In real app, fetch from API

	const categories = [
		"All Bikes",
		"Scooter",
		"Electric",
		"Mountain",
		"Under ₹50",
		"₹50-₹100",
		"₹100+",
	]; // Example categories

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// TODO: Implement search/filter logic
	};

	const handleSelectCategory = (category: string) => {
		setSelectedCategory(category);
		// TODO: Implement filter logic based on category
	};

	const navigateToBikeDetails = (bikeId: string) => {
		navigation.navigate("BikeDetails", { bikeId });
	};

	const navigateToFilters = () => {
		navigation.navigate("Filter"); // Navigate to Filter modal
	};

	const renderBikeItem = ({ item }: { item: Bike }) => (
		<BikeCard
			imageUrl={item.imageUrl}
			name={item.name}
			rating={item.rating}
			reviewCount={item.reviewCount}
			distanceInKm={item.distanceInKm}
			pricePerHour={item.pricePerHour}
			currencySymbol={item.currencySymbol}
			onPressCard={() => navigateToBikeDetails(item.id)}
			onPressBookNow={() => {
				// For "Book Now" directly from explore, you might navigate to booking
				// or to details first. Let's assume details for now.
				navigateToBikeDetails(item.id);
				console.log("Book Now pressed for:", item.name);
			}}
			style={styles.bikeCard}
		/>
	);

	return (
		<View style={styles.container}>
			
			<View style={styles.searchSortContainer}>
				<StyledTextInput
					placeholder="Search bikes, brands, or location"
					value={searchQuery}
					onChangeText={handleSearch}
					containerStyle={styles.searchBarContainer}
					inputStyle={styles.searchInput}
					
				/>
				<TouchableOpacity
					onPress={navigateToFilters}
					style={styles.sortButton}>
					<Text style={styles.sortButtonText}>Sort/Filter</Text>
				
				</TouchableOpacity>
			</View>

		
			<View style={styles.filterChipsContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterChipsScroll}>
					{categories.map((category) => (
						<FilterChip
							key={category}
							label={category}
							isSelected={selectedCategory === category}
							onPress={() => handleSelectCategory(category)}
						/>
					))}
				</ScrollView>
			</View>

		
			<FlatList
				data={DUMMY_BIKES} // Replace with `bikes` state variable when API is connected
				renderItem={renderBikeItem}
				keyExtractor={(item) => item.id}
				numColumns={2} // For a grid layout as seen in the design
				columnWrapperStyle={styles.row} // Styles for each row in the grid
				contentContainerStyle={styles.bikeListContent}
				showsVerticalScrollIndicator={false}
				// ListHeaderComponent={
				//   // This could be where the "Explore Bikes" title and filter chips go if not sticky
				// }
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F7F7F7", // Example background
	},
	searchSortContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		backgroundColor: colors.white, // Or a different header background
		// borderBottomWidth: 1,
		// borderBottomColor: colors.borderDefault,
	},
	searchBarContainer: {
		flex: 1,
		marginBottom: 0, // Remove default margin from StyledTextInput container
	},
	searchInput: {
		// Add specific styling for search input if needed
		// backgroundColor: colors.backgroundLight, // Example
		// borderRadius: borderRadius.m,
		paddingVertical: spacing.s, // Adjust height
	},
	sortButton: {
		marginLeft: spacing.s,
		padding: spacing.s,
		// backgroundColor: colors.primaryLight,
		// borderRadius: borderRadius.m,
	},
	sortButtonText: {
		color: colors.primary,
		fontWeight: typography.fontWeights.medium,
	},
	// "Explore Bikes" title as per design - this is shown *below* the search bar in the design.
	// The navigator already provides a header. If an additional in-page title is needed:
	// screenTitleContainer: {
	//   paddingHorizontal: spacing.m,
	//   paddingTop: spacing.s,
	//   paddingBottom: spacing.m,
	// },
	// screenTitle: {
	//   fontSize: typography.fontSizes.xxl, // e.g., 22-24
	//   fontWeight: typography.fontWeights.bold,
	//   color: colors.textPrimary,
	// },
	filterChipsContainer: {
		paddingVertical: spacing.s,
		paddingLeft: spacing.m, // To align with card padding
		backgroundColor: colors.white, // Or screen background
		// borderBottomWidth: 1,
		// borderBottomColor: colors.borderDefault,
	},
	filterChipsScroll: {
		paddingRight: spacing.m, // Ensure last chip has padding
	},
	chip: {
		paddingVertical: spacing.s - 2,
		paddingHorizontal: spacing.m + 2,
		borderRadius: 20, // Pill shape
		marginRight: spacing.s,
		borderWidth: 1,
	},
	chipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	chipNotSelected: {
		backgroundColor: colors.white, // Or a light grey
		borderColor: colors.borderDefault,
	},
	chipTextSelected: {
		color: colors.white,
		fontWeight: typography.fontWeights.medium,
		fontSize: typography.fontSizes.s,
	},
	chipTextNotSelected: {
		color: colors.textSecondary,
		fontWeight: typography.fontWeights.regular,
		fontSize: typography.fontSizes.s,
	},
	row: {
		justifyContent: "space-between", // Distributes space between 2 cards in a row
		paddingHorizontal: spacing.m - spacing.s / 2, // Adjust for card margins
	},
	bikeCard: {
		width: "48%", // For 2 columns, accounting for some space between
		marginBottom: spacing.m,
		// If BikeCard itself doesn't have margin, add it here or in columnWrapperStyle/contentContainerStyle
	},
	bikeListContent: {
		paddingTop: spacing.m,
		paddingHorizontal: spacing.s / 2, // Small horizontal padding for the list itself
		// paddingBottom: spacing.l, // Ensure space at the bottom
	},
});

export default ExploreScreen;

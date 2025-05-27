// src/screens/App/Booking/BookingConfirmationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ExploreStackParamList, UserTabParamList } from '../../../navigation/types'; // UserTabParamList for navigating to other tabs
import  PrimaryButton  from '../../../components/common/PrimaryButton';
import { colors, spacing, typography, borderRadius } from '../../../theme';

// --- Dummy Data Service (replace with actual API data later) ---
interface ConfirmedBookingDetails {
  bookingId: string;
  bikeName: string;
  bikeImageUrl: string;
  rentalPeriod: string; // e.g., "Sep 15, 2:00 PM - Sep 16, 2:00 PM"
  totalAmount: string; // e.g., "$45.00" or "₹3500.00"
  pickupInstructions?: string;
}

const fetchConfirmedBookingDetails = async (bookingId: string): Promise<ConfirmedBookingDetails | null> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        bookingId,
        bikeName: 'Mountain Explorer X3', // Example data
        bikeImageUrl: 'https://via.placeholder.com/100x80.png?text=Bike+Image',
        rentalPeriod: 'Sep 15, 2:00 PM - Sep 16, 2:00 PM',
        totalAmount: '₹4500.00',
        pickupInstructions: 'Please bring a valid ID for pickup. Make sure to check the bike condition before starting your ride.',
      });
    }, 300);
  });
};
// --- End Dummy Data ---

type BookingConfirmationScreenRouteProp = RouteProp<ExploreStackParamList, 'BookingConfirmation'>;
// We need StackNavigationProp for ExploreStack to potentially reset it,
// and also access to parent navigator if we want to switch tabs.
type BookingConfirmationScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'BookingConfirmation'>;

interface BookingConfirmationScreenProps {
  route: BookingConfirmationScreenRouteProp;
  navigation: BookingConfirmationScreenNavigationProp;
}

const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [bookingDetails, setBookingDetails] = useState<ConfirmedBookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const details = await fetchConfirmedBookingDetails(bookingId);
      setBookingDetails(details);
      setLoading(false);
    };
    loadDetails();
  }, [bookingId]);

  const handleGoToMyRentals = () => {
    // This navigation is a bit more complex as it involves switching tabs
    // and potentially navigating within that tab's stack.
    // It assumes 'RentalsTab' is a route in UserTabParamList and
    // 'MyRentalsScreen' is the initial route of RentalsStackNavigator.
    navigation.getParent<StackNavigationProp<UserTabParamList>>()?.navigate('RentalsTab');
    // Or, if MyRentalsScreen is a specific screen in a stack within RentalsTab:
    // navigation.getParent<StackNavigationProp<UserTabParamList>>()?.navigate('RentalsTab', {
    //   screen: 'MyRentalsScreen', // Navigate to specific screen in nested stack
    // });

    // And also reset the current ExploreStack to its root so "back" doesn't come here
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Explore' }],
      })
    );
  };

  const handleBookAnotherBike = () => {
    // Navigate back to the Explore screen, potentially resetting the stack
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Explore' }],
      })
    );
    // Or simply: navigation.navigate('Explore'); and let the Explore screen handle its state.
    // Or: navigation.popToTop(); // If Explore is the first screen in this stack
  };

  if (loading || !bookingDetails) {
    return <View style={styles.centered}><Text>Loading confirmation...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.iconContainer}>
      
        <View style={styles.successIconBackground}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
      </View>

      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>Your bike rental is all set. Enjoy your ride!</Text>

      <View style={styles.summaryCard}>
        <View style={styles.bikeInfoRow}>
          <Image source={{ uri: bookingDetails.bikeImageUrl }} style={styles.bikeImage} />
          <View style={styles.bikeTextContainer}>
            <Text style={styles.bikeName}>{bookingDetails.bikeName}</Text>
            <Text style={styles.rentalPeriod}>{bookingDetails.rentalPeriod}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValueAmount}>{bookingDetails.totalAmount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Reference</Text>
          <Text style={styles.detailValue}>#{bookingDetails.bookingId}</Text>
        </View>
      </View>

      {bookingDetails.pickupInstructions && (
        <View style={styles.infoNoteContainer}>
          <Text style={styles.infoIcon}>ⓘ</Text>
          <Text style={styles.infoNoteText}>{bookingDetails.pickupInstructions}</Text>
        </View>
      )}

      <PrimaryButton
        title="Go to My Rentals"
        onPress={handleGoToMyRentals}
        style={styles.actionButton}
      />
    
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={handleBookAnotherBike}
      >
        <Text style={styles.secondaryButtonText}>Book Another Bike</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        You can view your booking details anytime in 'My Rentals'.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain || '#FFFFFF',
  },
  contentContainer: {
    padding: spacing.l, // e.g., 24
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.m,
    marginTop: spacing.xl,
  },
  successIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight || '#E6F7FF', // Light green
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 40,
    color: colors.primary || 'green',
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSizes.xxxl, // e.g., 28
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.l, // e.g., 16
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.white, // Or a very light grey
    borderRadius: borderRadius.l,
    padding: spacing.m,
    width: '100%',
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.borderDefault || '#EEE',
    // shadow
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
  },
  bikeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  bikeImage: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.s,
    marginRight: spacing.m,
    backgroundColor: colors.greyLighter, // Placeholder bg
  },
  bikeTextContainer: {
    flex: 1,
  },
  bikeName: {
    fontSize: typography.fontSizes.l,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
  },
  rentalPeriod: {
    fontSize: typography.fontSizes.s,
    color: colors.primaryLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault || '#F0F0F0',
  },
  detailLabel: {
    fontSize: typography.fontSizes.m,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSizes.m,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  detailValueAmount: {
    fontSize: typography.fontSizes.m,
    color: colors.primary, // Highlight amount
    fontWeight: typography.fontWeights.bold,
  },
  infoNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight || '#F0F0F0',
    padding: spacing.m,
    borderRadius: borderRadius.m,
    width: '100%',
    marginBottom: spacing.xl,
  },
  infoIcon: {
    fontSize: typography.fontSizes.l,
    color: colors.textMedium,
    marginRight: spacing.s,
  },
  infoNoteText: {
    fontSize: typography.fontSizes.s,
    color: colors.textMedium,
    flexShrink: 1,
  },
  actionButton: {
    width: '100%',
    marginBottom: spacing.m,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semiBold,
    fontSize: typography.fontSizes.m, // Match PrimaryButton text if needed
  },
  footerText: {
    fontSize: typography.fontSizes.s,
    color: colors.primaryLight,
    textAlign: 'center',
    marginTop: spacing.m,
  },
});

export default BookingConfirmationScreen;
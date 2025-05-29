// src/store/slices/bookingSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as authService from "../../services/authService"; // For fetching user details (if not already in authSlice)
import * as bookingService from "../../services/bookingService"; // You'll need to create this service
import * as userBikeService from "../../services/userBikeService"; // For fetching bike details
import  User  from "./authSlice";
export interface PriceCalculationParams {
	bikeId: string;
	startTime: string;
	endTime: string;
	promoCode?: string;
}

export interface PriceCalculationResponse {
	bikeId: string;
	bikeName: string;
	startTime: string;
	endTime: string;
	durationHours: number;
	originalAmount: number;
	promoApplied: {
		code: string;
		description: string;
		discountApplied: number;
	} | null;
	promoIdForNextStep: string | null;
	discountAmount: number;
	taxesAndFees: number;
	finalAmount: number;
	currency: string;
}

export interface CreateBookingParams {
	bikeId: string;
	startTime: string;
	endTime: string;
	promoCodeId: string | null; // ID of the promo code, not the code string itself
	finalAmountFromClient: number; // The final amount calculated and agreed by client
}

export interface CreateBookingResponse {
	message: string;
	bookingId: string;
	bookingReference: string;
	razorpayOrderId?: string; // Optional, only if payment is required
	razorpayKeyId?: string;
	amount?: number; // Amount in paisa for Razorpay
	currency?: string;
	userName?: string;
	userEmail?: string;
	userContact?: string;
	bookingDetails?: any; // For free bookings
}

interface BookingProcessState {
	bikeSummary: Bike | null;
	userInfo: User | null; // Assuming User type from authSlice is sufficient
	priceDetails: PriceCalculationResponse | null;
	createdBookingInfo: CreateBookingResponse | null;

	isLoadingBike: boolean;
	isLoadingUser: boolean;
	isCalculatingPrice: boolean;
	isCreatingBooking: boolean;

	errorBike: string | null;
	errorUser: string | null;
	errorPrice: string | null;
	errorBooking: string | null;
}

const initialState: BookingProcessState = {
	bikeSummary: null,
	userInfo: null,
	priceDetails: null,
	createdBookingInfo: null,
	isLoadingBike: false,
	isLoadingUser: false,
	isCalculatingPrice: false,
	isCreatingBooking: false,
	errorBike: null,
	errorUser: null,
	errorPrice: null,
	errorBooking: null,
};

// Thunk to fetch bike summary for booking
export const fetchBikeSummaryForBooking = createAsyncThunk<
	Bike | null,
	string, // bikeId
	{ rejectValue: string }
>("booking/fetchBikeSummary", async (bikeId, thunkAPI) => {
	console.log(
		"bookingSlice: fetchBikeSummaryForBooking thunk started for bikeId:",
		bikeId
	); // <<< ADD THIS
	try {
		const bike = await userBikeService.getBikeDetailsAPI(bikeId);
		console.log(
			"bookingSlice: fetchBikeSummaryForBooking API response:",
			bike
		); // <<< ADD THIS
		return bike;
	} catch (error: any) {
		console.error(
			"bookingSlice: fetchBikeSummaryForBooking thunk error:",
			error.message
		); // <<< ADD THIS
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch bike summary"
		);
	}
});
// Thunk to fetch current user info (if not readily available or need fresh data)
// Alternatively, you can select this from the `authSlice` directly in the component.
// For this example, let's assume we might want to fetch it or ensure it's fresh.
export const fetchUserInfoForBooking = createAsyncThunk<
	User | null,
	string, // Auth token
	{ rejectValue: string }
>("booking/fetchUserInfo", async (token, thunkAPI) => {
	try {
		const user = await authService.getLoggedInUserProfile(token);
		return user;
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch user information"
		);
	}
});

// Thunk to calculate booking price
export const calculateBookingPriceThunk = createAsyncThunk<
	PriceCalculationResponse,
	PriceCalculationParams & { token: string | null },
	{ rejectValue: string }
>("booking/calculatePrice", async (params, thunkAPI) => {
	try {
		if (!params.token) {
			return thunkAPI.rejectWithValue("Authentication token is missing.");
		}
		// You need to create bookingService.calculatePrice
		const response = await bookingService.calculatePriceAPI(
			params,
			params.token
		);
		return response.data; // Assuming API returns { success: true, data: PriceCalculationResponse }
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to calculate price"
		);
	}
});

// Thunk to create booking (initiate payment)
export const createBookingThunk = createAsyncThunk<
	CreateBookingResponse,
	CreateBookingParams & { token: string | null },
	{ rejectValue: string }
>("booking/createBooking", async (params, thunkAPI) => {
	try {
		if (!params.token) {
			return thunkAPI.rejectWithValue("Authentication token is missing.");
		}
		// You need to create bookingService.createBooking
		const response = await bookingService.createBookingAPI(
			params,
			params.token
		);
		return response; // Directly return the backend response structure
	} catch (error: any) {
		// If the error has a response from the server with a message or errors array
		if (error.response && error.response.data) {
			const errorData = error.response.data;
			const message =
				errorData.message ||
				(errorData.errors && errorData.errors[0]?.msg);
			return thunkAPI.rejectWithValue(
				message || "Failed to create booking"
			);
		}
		return thunkAPI.rejectWithValue(
			error.message || "Failed to create booking"
		);
	}
});

const bookingSlice = createSlice({
    name: "bookingProcess",
    initialState,
    reducers: {
        clearBookingState: (state) => {
            Object.assign(state, initialState);
        },
        clearBookingErrors: (state) => {
            state.errorBike = null;
            state.errorUser = null;
            state.errorPrice = null;
            state.errorBooking = null;
        },
        setPriceDetails: (
            state,
            action: PayloadAction<PriceCalculationResponse | null>
        ) => {
            state.priceDetails = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Bike Summary
            .addCase(fetchBikeSummaryForBooking.pending, (state) => {
                console.log("bookingSlice: fetchBikeSummaryForBooking.pending");
                state.isLoadingBike = true;
                state.errorBike = null;
            })
            .addCase(
                fetchBikeSummaryForBooking.fulfilled,
                (state, action: PayloadAction<Bike | null>) => { // Ensure 'Bike' type is correctly imported/defined
                    console.log(
                        "bookingSlice: fetchBikeSummaryForBooking.fulfilled, payload:",
                        action.payload
                    );
                    state.isLoadingBike = false;
                    state.bikeSummary = action.payload;
                }
            )
            .addCase(fetchBikeSummaryForBooking.rejected, (state, action) => {
                console.error(
                    "bookingSlice: fetchBikeSummaryForBooking.rejected, error:",
                    action.payload
                );
                state.isLoadingBike = false;
                state.errorBike =
                    action.payload || "Failed to load bike details.";
            })
            // Fetch User Info
            .addCase(fetchUserInfoForBooking.pending, (state) => {
                state.isLoadingUser = true;
                state.errorUser = null;
            })
            .addCase(
                fetchUserInfoForBooking.fulfilled,
                (state, action: PayloadAction<User | null>) => { // Ensure 'User' type is correctly imported/defined
                    state.isLoadingUser = false;
                    state.userInfo = action.payload;
                }
            )
            .addCase(fetchUserInfoForBooking.rejected, (state, action) => {
                state.isLoadingUser = false;
                state.errorUser =
                    action.payload || "Failed to load user details.";
            })
            // Calculate Price
            .addCase(calculateBookingPriceThunk.pending, (state) => {
                state.isCalculatingPrice = true;
                state.errorPrice = null;
            })
            .addCase(
                calculateBookingPriceThunk.fulfilled,
                (state, action: PayloadAction<PriceCalculationResponse>) => {
                    state.isCalculatingPrice = false;
                    state.priceDetails = action.payload;
                }
            )
            .addCase(calculateBookingPriceThunk.rejected, (state, action) => {
                state.isCalculatingPrice = false;
                state.errorPrice =
                    action.payload || "Price calculation failed.";
            })
            // Create Booking
            .addCase(createBookingThunk.pending, (state) => {
                state.isCreatingBooking = true;
                state.errorBooking = null;
            })
            .addCase(
                createBookingThunk.fulfilled,
                (state, action: PayloadAction<CreateBookingResponse>) => {
                    state.isCreatingBooking = false;
                    state.createdBookingInfo = action.payload;
                }
            )
            .addCase(createBookingThunk.rejected, (state, action) => {
                state.isCreatingBooking = false;
                state.errorBooking =
                    action.payload || "Booking creation failed.";
            });
            // Ensure there are no duplicate .addCase calls for the same action type below this point
    },
});

export const { clearBookingState, clearBookingErrors, setPriceDetails } =
	bookingSlice.actions;
export default bookingSlice.reducer;

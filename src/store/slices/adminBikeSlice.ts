// src/store/slices/adminBikeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as adminBikeService from "../../services/adminBikeService"; // We'll create this service next
import { RootState } from "../store";
// Define the Bike type based on your backend model (adjust fields as needed)
// This should mirror the structure of the bike objects returned by your backend API
export interface Bike {
	_id: string;
	model: string;
	category: string;
	pricePerHour: number;
	pricePerDay: number;
	images: Array<{ url: string; public_id: string; _id?: string }>; // Array of image objects
	location: {
		type: "Point";
		coordinates: [number, number]; // [longitude, latitude]
		address?: string;
	};
	availability: boolean;
	addedBy?: {
		// Assuming it's populated from backend
		_id: string;
		fullName: string;
		email: string;
	};
	description?: string;
	createdAt?: string; // Or Date
	updatedAt?: string; // Or Date
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalBikes: number;
	limit: number;
}

interface AdminBikeState {
	bikes: Bike[];
	bikeDetails: Bike | null;
	pagination: PaginationInfo | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: AdminBikeState = {
	bikes: [],
	bikeDetails: null,
	pagination: null,
	isLoading: false,
	error: null,
};

// Async Thunk to fetch bikes for admin
export const fetchAdminBikes = createAsyncThunk<
	{ data: Bike[]; pagination: PaginationInfo },
	{
		page?: number;
		limit?: number;
		category?: string;
		availability?: boolean;
		sortBy?: string;
	} | void,
	{ rejectValue: string; state: RootState } // <<< Add state: RootState here
>("adminBikes/fetchAdminBikes", async (params, thunkAPI) => {
	console.log("--- fetchAdminBikes Thunk: Initiated ---", params); // Log initiation
	try {
		const token = thunkAPI.getState().auth.token;
		const response = await adminBikeService.getAdminBikes(
			params || {},
			token
		);
		console.log(
			"--- fetchAdminBikes Thunk: API Response Received ---",
			response
		); // Log response
		return response;
	} catch (error: any) {
		console.error(
			"--- fetchAdminBikes Thunk: Error Caught ---",
			error.message
		); // Log error
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch bikes"
		);
	}
});
// TODO: Add thunks for addBike, updateBike, deleteBike, fetchBikeById later

const adminBikeSlice = createSlice({
	name: "adminBikes",
	initialState,
	reducers: {
		// Reducers for synchronous actions if needed
		clearAdminBikeError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
  builder
    .addCase(fetchAdminBikes.pending, (state) => {
      console.log('--- adminBikeSlice: fetchAdminBikes.pending ---'); // Optional: confirm pending
      state.isLoading = true;
      state.error = null;
    })
    .addCase(fetchAdminBikes.fulfilled, (state, action: PayloadAction<{ data: Bike[]; pagination: PaginationInfo }>) => {
      // --- ADD THESE LOGS ---
      console.log('--- adminBikeSlice: fetchAdminBikes.fulfilled --- EXECUTING');
      console.log('Fulfilled Payload:', JSON.stringify(action.payload, null, 2));
      // --- END ADD THESE LOGS ---

      state.isLoading = false;
      state.bikes = action.payload.data;
      state.pagination = action.payload.pagination;
      state.error = null;

      // --- ADD THESE LOGS TO SEE THE NEW STATE ---
      console.log('Fulfilled - New state.isLoading:', state.isLoading);
      console.log('Fulfilled - New state.bikes.length:', state.bikes.length);
      // --- END ADD THESE LOGS ---
    })
    .addCase(fetchAdminBikes.rejected, (state, action: PayloadAction<string | undefined>) => {
      console.log('--- adminBikeSlice: fetchAdminBikes.rejected ---', action.payload); // Optional: confirm rejected
      state.isLoading = false;
      state.error = action.payload || 'An unknown error occurred';
    });
},
});

export const { clearAdminBikeError } = adminBikeSlice.actions;
export default adminBikeSlice.reducer;

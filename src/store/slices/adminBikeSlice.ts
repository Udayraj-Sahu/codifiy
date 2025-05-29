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
export interface AdminBikeFormData {
	// FormData will be used for the actual API call,
	// but the thunk might receive a structured object first.
	model: string;
	category: string;
	pricePerHour: string; // Keep as string for form input, convert before API if needed
	pricePerDay: string;
	longitude: string;
	latitude: string;
	address?: string;
	availability?: boolean;
	description?: string;
	bikeImages?: File[]; // For new images
	imagesToDeletePublicIds?: string[]; // For images to remove
}

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
export const addAdminBike = createAsyncThunk<
	Bike,
	FormData,
	{ rejectValue: string; state: RootState }
>("adminBikes/addAdminBike", async (bikeFormData, thunkAPI) => {
	console.log("adminBikeSlice: addAdminBike thunk started");
	try {
		const token = thunkAPI.getState().auth.token; // Token is accessed here
		console.log("adminBikeSlice: Token in addAdminBike:", token); // Your log shows this is null
		if (!token) {
			// This is the message you are seeing, or similar if you modified it
			return thunkAPI.rejectWithValue(
				"Token not found in Redux state for addAdminBike."
			);
		}
		const newBike = await adminBikeService.addBikeAPI(bikeFormData, token);
		// ...
		return newBike;
	} catch (error: any) {
		// ...
		return thunkAPI.rejectWithValue(
			error.response?.data?.message ||
				error.message ||
				"Failed to add bike"
		);
	}
});
export const updateAdminBike = createAsyncThunk<
	Bike,
	{ bikeId: string; bikeFormData: FormData },
	{ rejectValue: string; state: RootState }
>("adminBikes/updateAdminBike", async ({ bikeId, bikeFormData }, thunkAPI) => {
	try {
		const token = thunkAPI.getState().auth.token;
		const updatedBike = await adminBikeService.updateBikeAPI(
			bikeId,
			bikeFormData,
			token
		);
		// thunkAPI.dispatch(fetchAdminBikes()); // Re-fetch all bikes or update locally
		return updatedBike;
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to update bike"
		);
	}
});
// TODO: Add thunks for addBike, updateBike, deleteBike, fetchBikeById later
export const deleteAdminBike = createAsyncThunk<
	string, // Return the bikeId of the deleted bike on success
	string, // Argument: bikeId to delete
	{ rejectValue: string; state: RootState }
>("adminBikes/deleteAdminBike", async (bikeId, thunkAPI) => {
	try {
		const token = thunkAPI.getState().auth.token;
		await adminBikeService.deleteBikeAPI(bikeId, token);
		// thunkAPI.dispatch(fetchAdminBikes()); // Re-fetch bikes after deletion
		return bikeId; // Return bikeId to identify which bike was removed in the reducer
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to delete bike"
		);
	}
});

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
				console.log("--- adminBikeSlice: fetchAdminBikes.pending ---"); // Optional: confirm pending
				state.isLoading = true;
				state.error = null;
			})
			.addCase(
				fetchAdminBikes.fulfilled,
				(
					state,
					action: PayloadAction<{
						data: Bike[];
						pagination: PaginationInfo;
					}>
				) => {
					// --- ADD THESE LOGS ---
					console.log(
						"--- adminBikeSlice: fetchAdminBikes.fulfilled --- EXECUTING"
					);
					console.log(
						"Fulfilled Payload:",
						JSON.stringify(action.payload, null, 2)
					);
					// --- END ADD THESE LOGS ---

					state.isLoading = false;
					state.bikes = action.payload.data;
					state.pagination = action.payload.pagination;
					state.error = null;

					// --- ADD THESE LOGS TO SEE THE NEW STATE ---
					console.log(
						"Fulfilled - New state.isLoading:",
						state.isLoading
					);
					console.log(
						"Fulfilled - New state.bikes.length:",
						state.bikes.length
					);
					// --- END ADD THESE LOGS ---
				}
			)
			.addCase(
				fetchAdminBikes.rejected,
				(state, action: PayloadAction<string | undefined>) => {
					console.log(
						"--- adminBikeSlice: fetchAdminBikes.rejected ---",
						action.payload
					); // Optional: confirm rejected
					state.isLoading = false;
					state.error = action.payload || "An unknown error occurred";
				}
			)
			// addAdminBike cases
			.addCase(addAdminBike.pending, (state) => {
				state.isLoading = true; // Or a specific isLoadingForAdd flag
				state.error = null;
			})
			.addCase(
				addAdminBike.fulfilled,
				(state, action: PayloadAction<Bike>) => {
					state.isLoading = false;
					// Add the new bike to the list or rely on a re-fetch
					state.bikes.unshift(action.payload); // Add to the beginning
					if (state.pagination) state.pagination.totalBikes += 1;
				}
			)
			.addCase(addAdminBike.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload || "Failed to add bike.";
			})

			// updateAdminBike cases
			.addCase(updateAdminBike.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(
				updateAdminBike.fulfilled,
				(state, action: PayloadAction<Bike>) => {
					state.isLoading = false;
					const index = state.bikes.findIndex(
						(bike) => bike._id === action.payload._id
					);
					if (index !== -1) {
						state.bikes[index] = action.payload;
					}
					if (state.bikeDetails?._id === action.payload._id) {
						state.bikeDetails = action.payload;
					}
				}
			)
			.addCase(updateAdminBike.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload || "Failed to update bike.";
			})

			// deleteAdminBike cases
			.addCase(deleteAdminBike.pending, (state) => {
				state.isLoading = true; // Or a specific isLoadingForDelete flag
				state.error = null;
			})
			.addCase(
				deleteAdminBike.fulfilled,
				(state, action: PayloadAction<string>) => {
					state.isLoading = false;
					state.bikes = state.bikes.filter(
						(bike) => bike._id !== action.payload
					);
					if (state.pagination) state.pagination.totalBikes -= 1;
				}
			)
			.addCase(deleteAdminBike.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload || "Failed to delete bike.";
			});
	},
});

export const { clearAdminBikeError } = adminBikeSlice.actions;
export default adminBikeSlice.reducer;

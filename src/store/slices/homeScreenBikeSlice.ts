// src/store/slices/homeScreenBikeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as userBikeService from "../../services/userBikeService";
import { Bike, PaginationInfo } from "./adminBikeSlice"; // Re-using Bike type

// Parameters for fetching bikes
interface FetchBikesThunkParams {
    page?: number;
    limit?: number;
    category?: string;
    availability?: boolean;
    sortBy?: string;
}

interface FetchNearbyBikesThunkParams {
    longitude: number;
    latitude: number;
    maxDistance?: number;
    limit?: number;
}

interface HomeScreenBikeState {
    nearbyBikes: Bike[];
    popularPicks: Bike[];
    // You might have separate pagination for different lists if needed
    // paginationNearby: PaginationInfo | null;
    // paginationPopular: PaginationInfo | null;
    isLoadingNearby: boolean;
    isLoadingPopular: boolean;
    errorNearby: string | null;
    errorPopular: string | null;
}

const initialState: HomeScreenBikeState = {
    nearbyBikes: [],
    popularPicks: [],
    // paginationNearby: null,
    // paginationPopular: null,
    isLoadingNearby: false,
    isLoadingPopular: false,
    errorNearby: null,
    errorPopular: null,
};

export const fetchNearbyBikes = createAsyncThunk<
    Bike[], // Return type: array of bikes
    FetchNearbyBikesThunkParams,
    { rejectValue: string }
>("homeScreenBikes/fetchNearby", async (params, thunkAPI) => {
    try {
        // Assuming getNearbyBikesApi returns Bike[] directly
        const bikes = await userBikeService.getNearbyBikesApi(params);
        return bikes;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(
            error.message || "Failed to fetch nearby bikes"
        );
    }
});

export const fetchPopularPicks = createAsyncThunk<
    { data: Bike[]; pagination: PaginationInfo }, // Assuming general getBikes returns this structure
    FetchBikesThunkParams,
    { rejectValue: string }
>("homeScreenBikes/fetchPopularPicks", async (params, thunkAPI) => {
    try {
        const response = await userBikeService.getBikes(params);
        return response; // { data: Bike[], pagination: PaginationInfo }
    } catch (error: any) {
        return thunkAPI.rejectWithValue(
            error.message || "Failed to fetch popular picks"
        );
    }
});

const homeScreenBikeSlice = createSlice({
    name: "homeScreenBikes",
    initialState,
    reducers: {
        clearHomeScreenBikeErrors: (state) => {
            state.errorNearby = null;
            state.errorPopular = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Nearby Bikes
            .addCase(fetchNearbyBikes.pending, (state) => {
                state.isLoadingNearby = true;
                state.errorNearby = null;
            })
            .addCase(fetchNearbyBikes.fulfilled, (state, action: PayloadAction<Bike[]>) => {
                state.isLoadingNearby = false;
                state.nearbyBikes = action.payload;
            })
            .addCase(fetchNearbyBikes.rejected, (state, action) => {
                state.isLoadingNearby = false;
                state.errorNearby = action.payload || "An unknown error occurred";
            })
            // Popular Picks
            .addCase(fetchPopularPicks.pending, (state) => {
                state.isLoadingPopular = true;
                state.errorPopular = null;
            })
            .addCase(fetchPopularPicks.fulfilled, (state, action: PayloadAction<{ data: Bike[]; pagination: PaginationInfo }>) => {
                state.isLoadingPopular = false;
                state.popularPicks = action.payload.data;
                // state.paginationPopular = action.payload.pagination; // If you need separate pagination
            })
            .addCase(fetchPopularPicks.rejected, (state, action) => {
                state.isLoadingPopular = false;
                state.errorPopular = action.payload || "An unknown error occurred";
            });
    },
});

export const { clearHomeScreenBikeErrors } = homeScreenBikeSlice.actions;
export default homeScreenBikeSlice.reducer;
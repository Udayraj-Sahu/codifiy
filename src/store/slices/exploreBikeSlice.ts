// src/store/slices/exploreBikeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as userBikeService from "../../services/userBikeService";
import { Bike, PaginationInfo } from "./adminBikeSlice";

export interface FetchExploreBikesParams {
    page?: number;
    limit?: number;
    category?: string;
    availability?: boolean;
    sortBy?: string;
    model?: string;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
}

interface ExploreBikeState {
    bikes: Bike[];
    bikeDetails: Bike | null; // For single bike details
    pagination: PaginationInfo | null;
    isLoading: boolean; // For list loading
    isLoadingDetails: boolean; // For single bike loading
    error: string | null; // For list error
    errorDetails: string | null; // For single bike error
    currentFilters: FetchExploreBikesParams;
}

const initialState: ExploreBikeState = {
    bikes: [],
    bikeDetails: null,
    pagination: null,
    isLoading: false,
    isLoadingDetails: false,
    error: null,
    errorDetails: null,
    currentFilters: { page: 1, limit: 10 },
};

export const fetchExploreBikes = createAsyncThunk<
    { data: Bike[]; pagination: PaginationInfo },
    FetchExploreBikesParams,
    { rejectValue: string }
>("exploreBikes/fetchExploreBikes", async (params, thunkAPI) => {
    try {
        const response = await userBikeService.getBikes(params);
        return response;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(
            error.message || "Failed to fetch bikes for explore screen"
        );
    }
});

export const fetchBikeDetailsById = createAsyncThunk<
    Bike | null, // Bike object or null if not found
    string, // bikeId as string
    { rejectValue: string }
>("exploreBikes/fetchBikeDetailsById", async (bikeId, thunkAPI) => {
    try {
        const bike = await userBikeService.getBikeDetailsAPI(bikeId);
        return bike;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(
            error.message || "Failed to fetch bike details"
        );
    }
});


const exploreBikeSlice = createSlice({
    name: "exploreBikes",
    initialState,
    reducers: {
        clearExploreBikeError: (state) => {
            state.error = null;
            state.errorDetails = null;
        },
        setExploreFilters: (state, action: PayloadAction<FetchExploreBikesParams>) => {
            state.currentFilters = { ...state.currentFilters, ...action.payload, page: 1 };
            state.bikes = [];
            state.pagination = null;
        },
        resetExploreFilters: (state) => {
            state.currentFilters = { page: 1, limit: 10 };
            state.bikes = [];
            state.pagination = null;
            state.bikeDetails = null; // Also clear details on full filter reset
        },
        clearBikeDetails: (state) => { // Action to clear details when leaving the screen
            state.bikeDetails = null;
            state.isLoadingDetails = false;
            state.errorDetails = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // For fetching list of bikes
            .addCase(fetchExploreBikes.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchExploreBikes.fulfilled, (state, action: PayloadAction<{ data: Bike[]; pagination: PaginationInfo }>) => {
                state.isLoading = false;
                if (action.meta.arg.page === 1 || !action.meta.arg.page) {
                    state.bikes = action.payload.data;
                } else {
                    const newBikes = action.payload.data.filter(
                        newBike => !state.bikes.some(existingBike => existingBike._id === newBike._id)
                    );
                    state.bikes = [...state.bikes, ...newBikes];
                }
                state.pagination = action.payload.pagination;
                state.currentFilters.page = action.payload.pagination.currentPage;
            })
            .addCase(fetchExploreBikes.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "An unknown error occurred";
            })
            // For fetching single bike details
            .addCase(fetchBikeDetailsById.pending, (state) => {
                state.isLoadingDetails = true;
                state.errorDetails = null;
                state.bikeDetails = null; // Clear previous details
            })
            .addCase(fetchBikeDetailsById.fulfilled, (state, action: PayloadAction<Bike | null>) => {
                state.isLoadingDetails = false;
                state.bikeDetails = action.payload;
            })
            .addCase(fetchBikeDetailsById.rejected, (state, action) => {
                state.isLoadingDetails = false;
                state.errorDetails = action.payload || "An unknown error occurred";
            });
    },
});

export const { clearExploreBikeError, setExploreFilters, resetExploreFilters, clearBikeDetails } = exploreBikeSlice.actions;
export default exploreBikeSlice.reducer;
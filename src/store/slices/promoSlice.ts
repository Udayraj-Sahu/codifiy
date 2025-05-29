// src/store/slices/promoSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as promoService from "../../services/promoService";
import { PriceCalculationParams, PriceCalculationResponse } from "./bookingSlice"; // For applyPromoCode response
import { RootState } from "../store";


// This interface should match the structure of promo codes fetched for display
export interface PromoOffer {
    // From backend: getAvailablePromoCodesForUser returns:
    // code, description, discountType, discountValue, minBookingValue, maxDiscountAmount
    // We need an 'id' for FlatList keys, can use 'code' if unique, or add one.
    id: string; // Use promo.code as id if it's unique
    code: string;
    description: string;
    validityText?: string; // Backend doesn't directly provide this, construct if needed or omit
    discountType?: string;
    discountValue?: number;
    minBookingValue?: number;
    maxDiscountAmount?: number;
}

interface PromoState {
    availablePromos: PromoOffer[];
    appliedPromoDetails: PriceCalculationResponse | null; // Stores the full price calculation after applying a promo
    isLoading: boolean;
    error: string | null;
    isApplying: boolean; // For when a specific promo is being applied/validated
    applyError: string | null;
}

const initialState: PromoState = {
    availablePromos: [],
    appliedPromoDetails: null,
    isLoading: false,
    error: null,
    isApplying: false,
    applyError: null,
};

// Thunk to fetch available promo codes
export const fetchAvailablePromos = createAsyncThunk<
    PromoOffer[],
    void, // No params needed for this specific thunk, token comes from state
    { rejectValue: string; state: RootState }
>("promos/fetchAvailable", async (_, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    if (!token) {
        return thunkAPI.rejectWithValue("Not authenticated to fetch promos.");
    }
    try {
        const promos = await promoService.getAvailablePromosAPI(token);
        // Map backend response to PromoOffer, ensuring 'id' field
        return promos.map(p => ({ ...p, id: p.code, validityText: "Details in app" })); // Example mapping
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message || "Failed to fetch available promos");
    }
});

// Thunk to apply a promo code (which essentially re-calculates price with the promo)
export const applyPromoAndGetPrice = createAsyncThunk<
    PriceCalculationResponse,
    PriceCalculationParams, // bikeId, startTime, endTime, promoCode (string)
    { rejectValue: string; state: RootState }
>("promos/applyPromo", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    if (!token) {
        return thunkAPI.rejectWithValue("Not authenticated to apply promo.");
    }
    try {
        const priceDetails = await promoService.applyPromoCodeAPI(params, token);
        return priceDetails;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message || "Failed to apply promo code");
    }
});


const promoSlice = createSlice({
    name: "promos",
    initialState,
    reducers: {
        clearPromoErrors: (state) => {
            state.error = null;
            state.applyError = null;
        },
        clearAppliedPromo: (state) => {
            state.appliedPromoDetails = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Available Promos
            .addCase(fetchAvailablePromos.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAvailablePromos.fulfilled, (state, action: PayloadAction<PromoOffer[]>) => {
                state.isLoading = false;
                state.availablePromos = action.payload;
            })
            .addCase(fetchAvailablePromos.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Failed to load available promos.";
            })
            // Apply Promo and Get Price
            .addCase(applyPromoAndGetPrice.pending, (state) => {
                state.isApplying = true;
                state.applyError = null;
                state.appliedPromoDetails = null; // Clear previous attempt
            })
            .addCase(applyPromoAndGetPrice.fulfilled, (state, action: PayloadAction<PriceCalculationResponse>) => {
                state.isApplying = false;
                state.appliedPromoDetails = action.payload;
            })
            .addCase(applyPromoAndGetPrice.rejected, (state, action) => {
                state.isApplying = false;
                state.applyError = action.payload || "Failed to apply promo.";
            });
    },
});

export const { clearPromoErrors, clearAppliedPromo } = promoSlice.actions;
export default promoSlice.reducer;
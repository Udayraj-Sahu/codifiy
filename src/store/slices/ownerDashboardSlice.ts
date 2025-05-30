// src/store/slices/ownerDashboardSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as ownerService from "../../services/ownerService"; // Changed service name if you combined them
import { RootState } from "../store";
import { colors } from "../../theme";

// Data structure for KPIs from backend (raw)
export interface KpiStatsDataRaw { // Raw data from backend
    totalBikes?: number;
    activeBookings?: number;
    pendingDocuments?: number;
    registeredUsers?: number;
}
// Data structure for display
export interface KpiCardDisplayData {
    id: string;
    label: string;
    value: string | number;
    iconPlaceholder: string;
    backgroundColor?: string;
    iconColor?: string;
}

// Data structure for Activity Items (closer to what backend might send directly)
export interface ActivityItemData {
    id: string; // or _id from MongoDB
    type: string; // e.g., 'NEW_USER', 'DOC_SUBMITTED', 'NEW_BOOKING'
    message: string;
    timestamp: string; // ISO date string from backend
    relatedDetails?: { // Optional structured data for navigation/display
        userId?: string;
        userName?: string;
        documentId?: string;
        bookingId?: string;
        bikeName?: string;
    };
    // These will be derived in the component or selector for display:
    // iconPlaceholder?: string;
    // formattedTimestamp?: string;
    // onPress?: () => void;
}

export interface OwnerDashboardError extends Error { data?: any; }

interface OwnerDashboardState {
    kpiStats: KpiStatsDataRaw; // Store raw stats
    recentActivity: ActivityItemData[];
    isLoadingKpis: boolean;
    isLoadingActivity: boolean;
    errorKpis: string | null;
    errorActivity: string | null;
}

const initialState: OwnerDashboardState = {
    kpiStats: {},
    recentActivity: [],
    isLoadingKpis: false,
    isLoadingActivity: false,
    errorKpis: null,
    errorActivity: null,
};

export const fetchOwnerKpiStatsThunk = createAsyncThunk<
    KpiStatsDataRaw,
    void,
    { rejectValue: string; state: RootState }
>("ownerDashboard/fetchKpiStats", async (_, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await ownerService.getOwnerDashboardStatisticsAPI(token);
        return response.data; // Service now returns { success, data: KpiStatsDataRaw }
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to fetch dashboard statistics");
    }
});

export const fetchOwnerRecentActivityThunk = createAsyncThunk<
    ActivityItemData[],
    { limit?: number },
    { rejectValue: string; state: RootState }
>("ownerDashboard/fetchRecentActivity", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await ownerService.getOwnerRecentActivityAPI(token, params.limit || 5);
        // The service returns { success, data: [ActivityItemData...] }
        return response.data;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to fetch recent activity");
    }
});

const ownerDashboardSlice = createSlice({
    name: "ownerDashboard",
    initialState,
    reducers: {
        clearOwnerDashboardErrors: (state) => {
            state.errorKpis = null;
            state.errorActivity = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // KPI Stats
            .addCase(fetchOwnerKpiStatsThunk.pending, (state) => {
                state.isLoadingKpis = true;
                state.errorKpis = null;
            })
            .addCase(fetchOwnerKpiStatsThunk.fulfilled, (state, action: PayloadAction<KpiStatsDataRaw>) => {
                state.isLoadingKpis = false;
                state.kpiStats = action.payload;
            })
            .addCase(fetchOwnerKpiStatsThunk.rejected, (state, action) => {
                state.isLoadingKpis = false;
                state.errorKpis = action.payload;
            })
            // Recent Activity
            .addCase(fetchOwnerRecentActivityThunk.pending, (state) => {
                state.isLoadingActivity = true;
                state.errorActivity = null;
            })
            .addCase(fetchOwnerRecentActivityThunk.fulfilled, (state, action: PayloadAction<ActivityItemData[]>) => {
                state.isLoadingActivity = false;
                state.recentActivity = action.payload;
            })
            .addCase(fetchOwnerRecentActivityThunk.rejected, (state, action) => {
                state.isLoadingActivity = false;
                state.errorActivity = action.payload;
            });
    },
});

export const { clearOwnerDashboardErrors } = ownerDashboardSlice.actions;
export default ownerDashboardSlice.reducer;
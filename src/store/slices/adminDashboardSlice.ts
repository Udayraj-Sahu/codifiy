// src/store/slices/adminDashboardSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as adminDashboardService from "../../services/adminDashboardService";
import { RootState } from "../store";
import { colors } from "../../theme"; // For default KPI colors if needed

// Data structure for KPIs
export interface KpiStatsData {
    totalBikes?: number;
    activeBookings?: number;
    pendingDocuments?: number; // Changed from 'Pending Bookings' to match typical admin concerns
    registeredUsers?: number;
    // Add other stats as your backend provides them
}

// Data structure for Activity Items (matches what was in AdminDashboardScreen)
export interface ActivityItemData {
    id: string;
    iconPlaceholder: string; // This will likely be derived on frontend based on activity type
    description: string;
    timestamp: string; // Formatted string or ISO date from backend
    type?: string; // e.g., 'NEW_USER', 'NEW_BOOKING', 'DOC_APPROVED' from backend
    // Add related IDs or user info if backend provides them
    relatedInfo?: {
        userId?: string;
        userName?: string;
        documentId?: string;
        bookingId?: string;
    };
}


interface AdminDashboardState {
    kpiStats: KpiStatsData; // Store as an object
    recentActivity: ActivityItemData[];
    isLoadingKpis: boolean;
    isLoadingActivity: boolean;
    errorKpis: string | null;
    errorActivity: string | null;
}

const initialState: AdminDashboardState = {
    kpiStats: {}, // Initialize as empty object
    recentActivity: [],
    isLoadingKpis: false,
    isLoadingActivity: false,
    errorKpis: null,
    errorActivity: null,
};

// Thunk to fetch KPI statistics
export const fetchAdminKpiStatsThunk = createAsyncThunk<
    KpiStatsData,
    void,
    { rejectValue: string; state: RootState }
>("adminDashboard/fetchKpiStats", async (_, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const stats = await adminDashboardService.getAdminDashboardStatisticsAPI(token);
        return stats;
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message || "Failed to fetch admin dashboard statistics");
    }
});

// Thunk to fetch recent activity
export const fetchAdminRecentActivityThunk = createAsyncThunk<
    ActivityItemData[],
    { limit?: number },
    { rejectValue: string; state: RootState }
>("adminDashboard/fetchRecentActivity", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const activities = await adminDashboardService.getAdminRecentActivityAPI(token, params.limit || 5);
        // Map backend activity data to frontend ActivityItemData if structures differ
        return activities.map(act => ({
            ...act,
            id: act.id || act._id, // Ensure 'id' or map from '_id'
            iconPlaceholder: deriveIconFromActivityType(act.type), // Helper function to get icon
            timestamp: formatActivityTimestamp(act.timestamp), // Helper function to format timestamp
        }));
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message || "Failed to fetch admin recent activity");
    }
});

// Helper functions (can be moved to a utils file)
const deriveIconFromActivityType = (type?: string): string => {
    switch (type) {
        case "NEW_USER": return "👤";
        case "NEW_BOOKING": return "➕🗓️";
        case "BOOKING_CONFIRMED": return "✔️🗓️";
        case "BOOKING_CANCELLED": return "❌🗓️";
        case "DOC_SUBMITTED": return "📄⬆️";
        case "DOC_APPROVED": return "✔️📄";
        case "DOC_REJECTED": return "❌📄";
        case "BIKE_ADDED": return "➕🚲";
        default: return "ℹ️";
    }
};

const formatActivityTimestamp = (isoDate: string): string => {
    if (!isoDate) return "Just now";
    try {
        const date = new Date(isoDate);
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 5) return "Just now";
        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        const diffMinutes = Math.round(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return "A while ago";
    }
};


const adminDashboardSlice = createSlice({
    name: "adminDashboard",
    initialState,
    reducers: {
        clearAdminDashboardErrors: (state) => {
            state.errorKpis = null;
            state.errorActivity = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // KPI Stats
            .addCase(fetchAdminKpiStatsThunk.pending, (state) => {
                state.isLoadingKpis = true;
                state.errorKpis = null;
            })
            .addCase(fetchAdminKpiStatsThunk.fulfilled, (state, action: PayloadAction<KpiStatsData>) => {
                state.isLoadingKpis = false;
                state.kpiStats = action.payload;
            })
            .addCase(fetchAdminKpiStatsThunk.rejected, (state, action) => {
                state.isLoadingKpis = false;
                state.errorKpis = action.payload;
            })
            // Recent Activity
            .addCase(fetchAdminRecentActivityThunk.pending, (state) => {
                state.isLoadingActivity = true;
                state.errorActivity = null;
            })
            .addCase(fetchAdminRecentActivityThunk.fulfilled, (state, action: PayloadAction<ActivityItemData[]>) => {
                state.isLoadingActivity = false;
                state.recentActivity = action.payload;
            })
            .addCase(fetchAdminRecentActivityThunk.rejected, (state, action) => {
                state.isLoadingActivity = false;
                state.errorActivity = action.payload;
            });
    },
});

export const { clearAdminDashboardErrors } = adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;
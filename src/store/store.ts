// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";

import adminBikeReducer from "./slices/adminBikeSlice";
import adminDashboardReducer from "./slices/adminDashboardSlice";
import authReducer from "./slices/authSlice";
import bookingProcessReducer from "./slices/bookingSlice";
import documentReducer from "./slices/documentSlice";
import exploreBikeReducer from "./slices/exploreBikeSlice"; // Your existing import
import homeScreenBikeReducer from "./slices/homeScreenBikeSlice";
import notificationReducer from "./slices/notificationSlice";
import ownerDashboardReducer from "./slices/ownerDashboardSlice";
import ownerUserManagementReducer from "./slices/ownerUserManagementSlice";
import promoReducer from "./slices/promoSlice";
import walletReducer from "./slices/walletSlice";
// --- ADD THESE DEBUG LOGS ---
console.log("--- DEBUGGING Redux Store Setup ---");
console.log("Type of imported adminBikeReducer:", typeof adminBikeReducer);
console.log("Value of imported adminBikeReducer:", adminBikeReducer);
console.log("------------------------------------");
// --- END DEBUG LOGS ---

export const store = configureStore({
	reducer: {
		auth: authReducer,
		adminBikes: adminBikeReducer,
		homeScreenBikes: homeScreenBikeReducer,
		exploreBikes: exploreBikeReducer,
		documents: documentReducer,
		notifications: notificationReducer,
		promos: promoReducer,
		bookingProcess: bookingProcessReducer,
		ownerDashboard: ownerDashboardReducer,
		ownerUserManagement: ownerUserManagementReducer,
		adminDashboard: adminDashboardReducer,
		wallet: walletReducer, // This line assumes adminBikeReducer is a valid function
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

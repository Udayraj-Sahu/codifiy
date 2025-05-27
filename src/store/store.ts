// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import adminBikeReducer from './slices/adminBikeSlice'; // Your existing import

// --- ADD THESE DEBUG LOGS ---
console.log('--- DEBUGGING Redux Store Setup ---');
console.log('Type of imported adminBikeReducer:', typeof adminBikeReducer);
console.log('Value of imported adminBikeReducer:', adminBikeReducer);
console.log('------------------------------------');
// --- END DEBUG LOGS ---

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminBikes: adminBikeReducer, // This line assumes adminBikeReducer is a valid function
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
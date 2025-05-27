// src/store/slices/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store"; // Import expo-secure-store
import * as authService from "../../services/authService";

const TOKEN_KEY = "user_token"; // Key for storing the token
const USER_KEY = "user_data"; // Key for storing user data (optional, but can be useful)

// ... (User, LoginCredentials, SignupCredentials, AuthResponse, AuthState, initialState interfaces remain the same) ...
interface User {
	id: string;
	fullName: string;
	email: string;
	role: "User" | "Admin" | "Owner";
}

interface LoginCredentials {
	email: string;
	password: string;
}

interface SignupCredentials {
	fullName: string;
	email: string;
	password: string;
}
interface AuthResponse {
	user: User;
	token: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean; // For login/signup process
	isRestoringToken: boolean; // For app startup token check
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: false,
	isRestoringToken: true, // Start with true as we'll check token on load
	error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk<
	AuthResponse,
	LoginCredentials,
	{ rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
	try {
		const response = await authService.login(
			credentials.email,
			credentials.password
		);
		await SecureStore.setItemAsync(TOKEN_KEY, response.token);
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user)); // Store user data
		return response;
	} catch (error: any) {
		// ... (error handling)
		let errorMessage = "Login failed. Please try again.";
		if (
			error.response &&
			error.response.data &&
			error.response.data.message
		) {
			errorMessage = error.response.data.message;
		} else if (error.message) {
			errorMessage = error.message;
		}
		return rejectWithValue(errorMessage);
	}
});

// Async thunk for signup
export const signupUser = createAsyncThunk<
	AuthResponse,
	SignupCredentials,
	{ rejectValue: string }
>("auth/signup", async (credentials, { rejectWithValue }) => {
	try {
		const response = await authService.signup(
			credentials.fullName,
			credentials.email,
			credentials.password
		);
		await SecureStore.setItemAsync(TOKEN_KEY, response.token);
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user)); // Store user data
		return response;
	} catch (error: any) {
		// ... (error handling)
		let errorMessage = "Signup failed. Please try again.";
		if (
			error.response &&
			error.response.data &&
			error.response.data.message
		) {
			errorMessage = error.response.data.message;
		} else if (error.message) {
			errorMessage = error.message;
		}
		return rejectWithValue(errorMessage);
	}
});

// --- New: Async Thunk to Restore Token ---
export const restoreToken = createAsyncThunk<
	AuthResponse | null,
	void,
	{ rejectValue: string }
>("auth/restoreToken", async (_, { rejectWithValue }) => {
	try {
		const token = await SecureStore.getItemAsync(TOKEN_KEY);
		if (token) {
			// Token found, now verify it with the backend and get user profile
			const userProfile = await authService.getLoggedInUserProfile(token); // Call the new service
			if (userProfile) {
				return { token, user: userProfile }; // Return token and fresh user profile
			}
			// If userProfile is not returned or an error occurs in getLoggedInUserProfile, it will be caught
		}
		// No token found in SecureStore, or getLoggedInUserProfile failed implicitly before throwing
		await SecureStore.deleteItemAsync(TOKEN_KEY); // Clean up if token was there but /me failed
		// await SecureStore.deleteItemAsync(USER_KEY); // If you were storing user data
		return null;
	} catch (error: any) {
		// This catch block handles errors from SecureStore.getItemAsync
		// or errors re-thrown from authService.getLoggedInUserProfile (via handleResponse)
		console.error("Restore token failed:", error.message);
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		// await SecureStore.deleteItemAsync(USER_KEY);
		return rejectWithValue(
			error.message || "Session expired or invalid. Please login again."
		);
	}
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		// setCredentials can be used by loginUser.fulfilled and signupUser.fulfilled
		setCredentials(state, action: PayloadAction<AuthResponse>) {
			state.user = action.payload.user;
			state.token = action.payload.token;
			state.isAuthenticated = true;
			state.isLoading = false; // Reset loading from login/signup
			state.isRestoringToken = false; // Explicitly set if needed here
			state.error = null;
		},
		clearCredentials(state) {
			state.user = null;
			state.token = null;
			state.isAuthenticated = false;
			state.error = null;
			state.isRestoringToken = false;
			SecureStore.deleteItemAsync(TOKEN_KEY);
			// SecureStore.deleteItemAsync(USER_KEY);
		},
	},
	extraReducers: (builder) => {
		builder
			// Login cases
			.addCase(loginUser.pending, (state) => {
				/* ... */ state.isLoading = true;
				state.error = null;
			})
			.addCase(
				loginUser.fulfilled,
				(state, action: PayloadAction<AuthResponse>) => {
					state.isLoading = false;
					state.isAuthenticated = true;
					state.user = action.payload.user;
					state.token = action.payload.token;
					state.error = null;
					state.isRestoringToken = false;
					// SecureStore saving is now handled within the loginUser thunk itself
				}
			)
			.addCase(loginUser.rejected, (state, action) => {
				/* ... */ state.isLoading = false;
				state.error = null;
				state.isAuthenticated = false;
				state.isRestoringToken = false;
			})
			// Signup cases
			.addCase(signupUser.pending, (state) => {
				/* ... */ state.isLoading = true;
				state.error = null;
			})
			.addCase(
				signupUser.fulfilled,
				(state, action: PayloadAction<AuthResponse>) => {
					state.isLoading = false;
					state.isAuthenticated = true;
					state.user = action.payload.user;
					state.token = action.payload.token;
					state.error = null;
					state.isRestoringToken = false;
					// SecureStore saving is now handled within the signupUser thunk itself
				}
			)
			.addCase(signupUser.rejected, (state, action) => {
				/* ... */ state.isLoading = false;
				state.error = null;
				state.isAuthenticated = false;
				state.isRestoringToken = false;
			})
			// Restore Token cases
			.addCase(restoreToken.pending, (state) => {
				state.isRestoringToken = true;
			})
			.addCase(
				restoreToken.fulfilled,
				(state, action: PayloadAction<AuthResponse | null>) => {
					if (action.payload) {
						state.user = action.payload.user;
						state.token = action.payload.token;
						state.isAuthenticated = true;
					} else {
						// No valid session found or restored
						state.user = null;
						state.token = null;
						state.isAuthenticated = false;
					}
					state.isRestoringToken = false;
					state.error = null; // Clear any previous errors
				}
			)
			.addCase(restoreToken.rejected, (state, action) => {
				state.isRestoringToken = false;
				state.isAuthenticated = false;
				state.user = null;
				state.token = null;
				state.error = action.payload || "Failed to restore session.";
				// Token is already cleared in the thunk on failure
			});
	},
});

export const logoutUser = createAsyncThunk(
	"auth/logout",
	async (_, { dispatch }) => {
		// No backend call needed for stateless JWT logout usually.
		// We just clear credentials on the client side.
		dispatch(clearCredentials());
		// If you had a backend endpoint to call for logout (e.g., to blacklist a token),
		// you would do it here with await authService.logoutBackend();
		return undefined; // Or some other indication of success if needed
	}
);

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

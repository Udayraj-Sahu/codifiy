// src/store/slices/ownerUserManagementSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as ownerUserService from "../../services/ownerUserService";
import { RootState } from "../store";
import { PaginationInfo } from "./adminBikeSlice"; // Re-use for pagination
import { User } from "./authSlice"; // Re-use User type from authSlice

export interface FetchUsersParamsOwner
	extends ownerUserService.FetchUsersParams {}

interface OwnerUserManagementState {
	users: User[];
	pagination: PaginationInfo | null;
	isLoading: boolean;
	error: string | null;
	isUpdatingRole: boolean;
	updateRoleError: string | null;
	currentFilters: FetchUsersParamsOwner; // To store applied filters
}

const initialState: OwnerUserManagementState = {
	users: [],
	pagination: null,
	isLoading: false,
	error: null,
	isUpdatingRole: false,
	updateRoleError: null,
	currentFilters: { page: 1, limit: 15, role: "all" }, // Default filters
};

export const fetchUsersForOwnerThunk = createAsyncThunk<
	{ data: User[]; pagination: PaginationInfo }, // This is what the thunk will return on success
	FetchUsersParamsOwner,
	{ rejectValue: string; state: RootState }
>("ownerUserManagement/fetchUsers", async (params, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		// Update current filters in state before fetching
		thunkAPI.dispatch(
			ownerUserManagementSlice.actions.setCurrentFilters(params)
		);
		const response = await ownerUserService.getUsersForOwnerAPI(
			params,
			token
		);
		// The service now returns the full API response { success, data, pagination }
		// The thunk should return the part needed by the reducer.
		return { data: response.data, pagination: response.pagination };
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch users for owner"
		);
	}
});

export const updateUserRoleByOwnerThunk = createAsyncThunk<
	User, // Returns the updated user object
	{ userId: string; newRole: "User" | "Owner" | "Admin" },
	{ rejectValue: string; state: RootState }
>(
	"ownerUserManagement/updateUserRole",
	async ({ userId, newRole }, thunkAPI) => {
		const token = thunkAPI.getState().auth.token;
		try {
			const response = await ownerUserService.updateUserRoleByOwnerAPI(
				userId,
				newRole,
				token
			);
			return response.data; // The service returns { success, data: updatedUser }, so we take data
		} catch (error: any) {
			return thunkAPI.rejectWithValue(
				error.message || "Failed to update user role"
			);
		}
	}
);

const ownerUserManagementSlice = createSlice({
	name: "ownerUserManagement",
	initialState,
	reducers: {
		clearOwnerUserManagementErrors: (state) => {
			state.error = null;
			state.updateRoleError = null;
		},
		setCurrentFilters: (
			state,
			action: PayloadAction<FetchUsersParamsOwner>
		) => {
			// Merge new filters, reset page if filters other than page change
			const { page, ...restOfNewFilters } = action.payload;
			const { page: oldPage, ...restOfOldFilters } = state.currentFilters;

			let newPage = page === undefined ? oldPage : page;

			// If filters other than page have changed, reset to page 1
			if (
				JSON.stringify(restOfNewFilters) !==
				JSON.stringify(restOfOldFilters)
			) {
				newPage = 1;
			}

			state.currentFilters = {
				...state.currentFilters,
				...action.payload,
				page: newPage,
			};
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Users
			.addCase(fetchUsersForOwnerThunk.pending, (state, action) => {
				// Only set isLoading true if it's a first page load or a filter change (page 1)
				if (
					action.meta.arg.page === 1 ||
					action.meta.arg.page === undefined
				) {
					state.isLoading = true;
				}
				state.error = null;
			})
			.addCase(fetchUsersForOwnerThunk.fulfilled, (state, action) => {
				state.isLoading = false;
				// If it's the first page or filters changed, replace users.
				// For simple pagination (not infinite scroll), always replace.
				state.users = action.payload.data;
				state.pagination = action.payload.pagination;
				// Update current page from response
				if (action.payload.pagination?.currentPage) {
					state.currentFilters.page =
						action.payload.pagination.currentPage;
				}
			})
			.addCase(fetchUsersForOwnerThunk.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload;
			})
			// Update User Role
			.addCase(updateUserRoleByOwnerThunk.pending, (state) => {
				state.isUpdatingRole = true;
				state.updateRoleError = null;
			})
			.addCase(
				updateUserRoleByOwnerThunk.fulfilled,
				(state, action: PayloadAction<User>) => {
					state.isUpdatingRole = false;
					const index = state.users.findIndex(
						(user) => user.id === action.payload.id
					);
					if (index !== -1) {
						state.users[index] = action.payload;
					}
				}
			)
			.addCase(updateUserRoleByOwnerThunk.rejected, (state, action) => {
				state.isUpdatingRole = false;
				state.updateRoleError = action.payload;
			});
	},
});

export const { clearOwnerUserManagementErrors, setCurrentFilters } =
	ownerUserManagementSlice.actions;
export default ownerUserManagementSlice.reducer;

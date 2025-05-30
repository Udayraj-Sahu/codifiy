// src/store/slices/notificationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as notificationService from "../../services/notificationService";
import { RootState } from "../store";

// Matches the structure from your NotificationsScreen (and backend model)
export interface NotificationData {
	_id: string; // Changed from id to _id to match MongoDB
	user: string;
	title: string;
	body: string;
	data?: any;
	isRead: boolean;
	readAt?: string;
	type?: string;
	createdAt: string; // from timestamps
	updatedAt: string; // from timestamps
	// iconPlaceholder and detailsLinkText might be derived on client or part of 'data'
}

export interface NotificationPaginationInfo {
	currentPage: number;
	totalPages: number;
	totalNotifications: number;
	limit: number;
}

interface NotificationState {
	notifications: NotificationData[];
	pagination: NotificationPaginationInfo | null;
	unreadCount: number;
	isLoading: boolean;
	isLoadingMore: boolean; // For pagination
	error: string | null;
}

const initialState: NotificationState = {
	notifications: [],
	pagination: null,
	unreadCount: 0,
	isLoading: false,
	isLoadingMore: false,
	error: null,
};

interface FetchNotificationsParams {
	page?: number;
	limit?: number;
}

export const fetchUserNotificationsThunk = createAsyncThunk<
	{
		data: NotificationData[];
		pagination: NotificationPaginationInfo;
		unreadCount: number;
	},
	FetchNotificationsParams | void, // page can be optional
	{ rejectValue: string; state: RootState }
>("notifications/fetchUserNotifications", async (params, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	const page = params?.page || 1;
	const limit = params?.limit || 15;
	console.log(
		`notificationSlice: fetchUserNotificationsThunk started for page ${page}, token available: ${!!token}`
	);
	try {
		const response = await notificationService.getUserNotificationsAPI(
			token,
			page,
			limit
		);
		console.log(
			"notificationSlice: API call successful, response:",
			response
		); // <<< ADD
		return {
			data: response.data,
			pagination: response.pagination as NotificationPaginationInfo, // Cast if structure matches
			unreadCount: response.unreadCount || 0,
		};
	} catch (error: any) {
		console.error(
			"notificationSlice: fetchUserNotificationsThunk error:",
			error.message
		);
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch notifications"
		);
	}
});

export const markNotificationAsReadThunk = createAsyncThunk<
	NotificationData, // Returns the updated notification
	string, // notificationId
	{ rejectValue: string; state: RootState }
>("notifications/markAsRead", async (notificationId, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const response = await notificationService.markNotificationAsReadAPI(
			notificationId,
			token
		);
		return response.data; // Assuming backend returns { success: true, data: updatedNotification }
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to mark notification as read"
		);
	}
});

export const markAllNotificationsAsReadThunk = createAsyncThunk<
	{ acknowledged: boolean; modifiedCount: number },
	void,
	{ rejectValue: string; state: RootState }
>("notifications/markAllAsRead", async (_, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const response =
			await notificationService.markAllNotificationsAsReadAPI(token);
		return response.data; // Assuming backend returns { success: true, data: { acknowledged, modifiedCount } }
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to mark all notifications as read"
		);
	}
});

const notificationSlice = createSlice({
	name: "notifications",
	initialState,
	reducers: {
		clearNotificationError: (state) => {
			state.error = null;
		},
		resetNotifications: (state) => {
			state.notifications = [];
			state.pagination = null;
			state.unreadCount = 0;
			state.isLoading = false;
			state.isLoadingMore = false;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch User Notifications
			.addCase(fetchUserNotificationsThunk.pending, (state, action) => {
				if (action.meta.arg?.page && action.meta.arg.page > 1) {
					state.isLoadingMore = true;
				} else {
					state.isLoading = true;
				}
				state.error = null;
			})
			.addCase(fetchUserNotificationsThunk.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isLoadingMore = false;
				if (action.payload.pagination.currentPage === 1) {
					state.notifications = action.payload.data;
				} else {
					// Basic duplicate check before appending
					const newNotifications = action.payload.data.filter(
						(newNotif) =>
							!state.notifications.some(
								(existingNotif) =>
									existingNotif._id === newNotif._id
							)
					);
					state.notifications.push(...newNotifications);
				}
				state.pagination = action.payload.pagination;
				state.unreadCount = action.payload.unreadCount;
			})
			.addCase(fetchUserNotificationsThunk.rejected, (state, action) => {
				state.isLoading = false;
				state.isLoadingMore = false;
				state.error = action.payload;
			})
			// Mark Notification As Read
			.addCase(
				markNotificationAsReadThunk.fulfilled,
				(state, action: PayloadAction<NotificationData>) => {
					const index = state.notifications.findIndex(
						(n) => n._id === action.payload._id
					);
					if (index !== -1) {
						if (
							!state.notifications[index].isRead &&
							action.payload.isRead
						) {
							// if it was unread and now is read
							state.unreadCount = Math.max(
								0,
								state.unreadCount - 1
							);
						}
						state.notifications[index] = action.payload;
					}
					// If currentDocumentDetails in exploreSlice was related to this notification, update it too (more advanced)
				}
			)
			// Mark All Notifications As Read
			.addCase(
				markAllNotificationsAsReadThunk.fulfilled,
				(state, action) => {
					state.notifications.forEach((n) => (n.isRead = true));
					state.unreadCount = 0;
				}
			);
	},
});

export const { clearNotificationError, resetNotifications } =
	notificationSlice.actions;
export default notificationSlice.reducer;

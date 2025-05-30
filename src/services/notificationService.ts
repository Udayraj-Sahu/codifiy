// src/services/notificationService.ts
import {
	NotificationData,
	NotificationPaginationInfo,
} from "../store/slices/notificationSlice"; // Types from slice

const API_BASE_URL_NOTIFICATIONS = "http://172.20.10.2:5000/api/notifications"; // Adjust IP if needed

interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	count?: number;
	total?: number;
	pagination?: NotificationPaginationInfo;
	unreadCount?: number;
}

const handleNotificationApiResponse = async (
	response: Response
): Promise<any> => {
	const contentType = response.headers.get("content-type");
	let data;
	if (contentType && contentType.indexOf("application/json") !== -1) {
		data = await response.json();
	} else {
		const textResponse = await response.text();
		if (!response.ok) {
			console.error(
				"Server returned non-JSON error (notificationService):",
				textResponse
			);
			throw new Error(
				`Server error: ${response.status} - ${
					textResponse || "Unknown error"
				}`
			);
		}
		return { message: textResponse };
	}

	if (!response.ok) {
		const errorMessage =
			data?.message ||
			data?.errors?.[0]?.msg ||
			"Notification API request failed.";
		const error: any = new Error(errorMessage);
		error.data = data;
		throw error;
	}
	return data; // Backend might return { success: true, data: ..., pagination: ..., unreadCount: ... }
};

export const getUserNotificationsAPI = async (
	token: string | null,
	page: number = 1,
	limit: number = 15
): Promise<ApiResponse<NotificationData[]>> => {
	if (!token) throw new Error("Authentication token not provided.");
	const url = `<span class="math-inline">\{API\_BASE\_URL\_NOTIFICATIONS\}/me?page\=</span>{page}&limit=${limit}`;
	console.log("notificationService: Fetching notifications from URL:", url); // <<< ADD
	console.log(
		"notificationService: Using token:",
		token ? token.substring(0, 20) + "..." : "NO TOKEN"
	); // <<< ADD (log part of token)
	const response = await fetch(
		`${API_BASE_URL_NOTIFICATIONS}/me?page=${page}&limit=${limit}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		}
	);
	console.log("notificationService: Response status:", response.status); // <<< ADD
	const responseData = await handleNotificationApiResponse(response);
	console.log("notificationService: Parsed response data:", responseData);
	return responseData;
};

export const markNotificationAsReadAPI = async (
	notificationId: string,
	token: string | null
): Promise<ApiResponse<NotificationData>> => {
	// Backend should return the updated notification
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(
		`${API_BASE_URL_NOTIFICATIONS}/${notificationId}/read`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		}
	);
	return handleNotificationApiResponse(response);
};

export const markAllNotificationsAsReadAPI = async (
	token: string | null
): Promise<ApiResponse<{ acknowledged: boolean; modifiedCount: number }>> => {
	// Backend might return a summary
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(
		`${API_BASE_URL_NOTIFICATIONS}/mark-all-read`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		}
	);
	return handleNotificationApiResponse(response);
};

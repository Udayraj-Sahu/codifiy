// src/services/adminDashboardService.ts
import {
	ActivityItemData,
	KpiStatsData,
} from "../store/slices/adminDashboardSlice"; // Types from slice

// Adjust IP for your setup (e.g., 10.0.2.2 for Android emulator if backend is on localhost)
const API_BASE_URL_ADMIN_DASHBOARD = "http://10.0.2.2:5000/api/admin/dashboard";

interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

const handleAdminDashboardApiResponse = async (
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
				"Server returned non-JSON error (adminDashboardService):",
				textResponse
			);
			throw new Error(
				`Server error: ${response.status} - ${
					textResponse || "Unknown error"
				}`
			);
		}
		return { success: true, message: textResponse };
	}

	if (!response.ok || (data && data.success === false)) {
		const errorMessage =
			data?.message ||
			data?.errors?.[0]?.msg ||
			"Admin Dashboard API request failed.";
		const error: Error & { data?: any } = new Error(errorMessage);
		error.data = data;
		throw error;
	}
	return data.data; // Assuming backend wraps actual data in a 'data' property and has a 'success' flag
};

export const getAdminDashboardStatisticsAPI = async (
	token: string | null
): Promise<KpiStatsData> => {
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(`${API_BASE_URL_ADMIN_DASHBOARD}/statistics`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	// Expected backend response: { success: true, data: { totalBikes: 10, activeBookings: 5, ... } }
	return handleAdminDashboardApiResponse(response);
};

export const getAdminRecentActivityAPI = async (
	token: string | null,
	limit: number = 5
): Promise<ActivityItemData[]> => {
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(
		`${API_BASE_URL_ADMIN_DASHBOARD}/recent-activity?limit=${limit}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		}
	);
	// Expected backend response: { success: true, data: [ActivityItemData, ...] }
	return handleAdminDashboardApiResponse(response);
};

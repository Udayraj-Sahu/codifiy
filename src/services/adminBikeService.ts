// src/services/adminBikeService.ts
import { Bike, PaginationInfo } from "../store/slices/adminBikeSlice"; // Import types
// To get the token

// Adjust this to your backend URL.
// Remember: Android Emulator uses 10.0.2.2 for host machine's localhost.
// iOS Simulator can use localhost. Physical device needs your computer's network IP.
const ADMIN_API_BASE_URL = "http://172.20.10.2:5000/api"; // EXAMPLE for Android Emulator
// const ADMIN_API_BASE_URL = 'http://localhost:5001/api'; // EXAMPLE for iOS

interface FetchAdminBikesParams {
	page?: number;
	limit?: number;
	category?: string;
	availability?: boolean;
	sortBy?: string;
}

// Helper to get token - ensure your auth slice stores the token
// const getToken = () => {
// 	return store.getState().auth.token;
// };

// Helper to handle API responses (similar to authService)
const handleAdminResponse = async (response: Response): Promise<any> => {
	const contentType = response.headers.get("content-type");
	let data;
	if (contentType && contentType.indexOf("application/json") !== -1) {
		data = await response.json();
	} else {
		if (!response.ok)
			throw new Error("Server returned non-JSON error or no content");
		return {};
	}

	if (!response.ok) {
		let errorMessage = "An API error occurred.";
		if (data && data.errors && data.errors.length > 0) {
			errorMessage = data.errors
				.map((err: { msg: string }) => err.msg)
				.join(", ");
		} else if (data && data.message) {
			errorMessage = data.message;
		} else if (response.statusText) {
			errorMessage = response.statusText;
		}
		const error: any = new Error(errorMessage);
		error.response = response;
		error.data = data;
		throw error;
	}
	return data;
};

export const getAdminBikes = async (
	params: FetchAdminBikesParams,
	token: string | null // <<< Add token as a parameter
): Promise<{ data: Bike[]; pagination: PaginationInfo }> => {
	const queryParams = new URLSearchParams();

	if (params.page) queryParams.append("page", params.page.toString());
	if (params.limit) queryParams.append("limit", params.limit.toString());
	if (params.category) queryParams.append("category", params.category);
	if (params.availability !== undefined)
		queryParams.append("availability", String(params.availability));
	if (params.sortBy) queryParams.append("sortBy", params.sortBy);

	const headers: HeadersInit = {
		// Define headers type
		"Content-Type": "application/json",
	};
	// Add Authorization header only if token is present (for public vs protected endpoints)
	// Our GET /api/bikes is currently public, but admin actions will need it.
	// For consistency in an "adminBikeService", it's often good to expect a token.
	// Let's assume admin actions should be protected. If GET /api/bikes is public,
	// then the token isn't strictly needed for *that one call* but good for others.
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(
		`${ADMIN_API_BASE_URL}/bikes?${queryParams.toString()}`,
		{
			method: "GET",
			headers: headers, // Use the constructed headers
		}
	);
	return handleAdminResponse(response);
};

// TODO: Add service functions for addBike, updateBike, deleteBike, getBikeById later
// These will need to handle FormData for image uploads.

export const addBikeAPI = async (
	bikeData: FormData,
	token: string | null // <<< Receives token here
): Promise<Bike> => {
	if (!token) {
		// <<< THIS IS LIKELY WHERE THE ERROR IS THROWN
		throw new Error("Authentication token not provided.");
	}
	const response = await fetch(`${ADMIN_API_BASE_URL}/bikes`, {
		// POST to /api/bikes
		method: "POST",
		headers: {
			// 'Content-Type': 'multipart/form-data' is automatically set by browser/fetch when FormData is used
			Authorization: `Bearer ${token}`,
		},
		body: bikeData,
	});
	return handleAdminResponse(response); // This should parse the created bike
};

// Function to update an existing bike (Admin)
export const updateBikeAPI = async (
	bikeId: string,
	bikeData: FormData, // Use FormData for potential image updates
	token: string | null
): Promise<Bike> => {
	if (!token) {
		throw new Error("Authentication token not provided.");
	}
	const response = await fetch(
		`<span class="math-inline">\{ADMIN\_API\_BASE\_URL\}/bikes/</span>{bikeId}`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: bikeData,
		}
	);
	return handleAdminResponse(response);
};

// Function to delete a bike (Admin)
export const deleteBikeAPI = async (
	bikeId: string,
	token: string | null
): Promise<{ success: boolean; msg?: string }> => {
	// Backend returns { msg: "..." }
	if (!token) {
		throw new Error("Authentication token not provided.");
	}
	const response = await fetch(
		`<span class="math-inline">\{ADMIN\_API\_BASE\_URL\}/bikes/</span>{bikeId}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	// handleAdminResponse might need adjustment if delete doesn't return a bike object
	// or create a specific handler for delete responses.
	// For now, assuming it returns a success message.
	if (!response.ok) {
		const errorData = await response
			.json()
			.catch(() => ({ msg: "Failed to delete bike" }));
		throw new Error(
			errorData.msg || `HTTP error! status: ${response.status}`
		);
	}
	return response.json(); // Expects { success: true, msg: "..." }
};

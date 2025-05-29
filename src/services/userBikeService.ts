// src/services/userBikeService.ts
import { Bike, PaginationInfo } from "../store/slices/adminBikeSlice"; // Re-using Bike type for now

// Adjust this to your backend URL.
// const API_BASE_URL = "http://10.0.2.2:5001/api"; // Android Emulator
const API_BASE_URL = "http://172.20.10.2:5000/api"; // Your current setup

interface FetchBikesParams {
    page?: number;
    limit?: number;
    category?: string;
    availability?: boolean;
    sortBy?: string;
    ids?: string[];
    search?: string; // For generic search
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
}

interface FetchNearbyBikesParams {
    longitude: number;
    latitude: number;
    maxDistance?: number;
    limit?: number;
}

const handleBikeResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server returned non-JSON error:", errorText);
            throw new Error(
                `Server returned status ${response.status}: ${errorText || "Non-JSON error or no content"}`
            );
        }
        return {};
    }

    if (!response.ok) {
        let errorMessage = "An API error occurred while fetching bikes.";
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

export const getBikes = async (
    params: FetchBikesParams
): Promise<{ data: Bike[]; pagination: PaginationInfo }> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.category) queryParams.append("category", params.category);
    if (params.availability !== undefined) {
        queryParams.append("availability", String(params.availability));
    }
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.search) queryParams.append("search", params.search); // For generic search
    if (params.priceMin !== undefined) queryParams.append("priceMin", params.priceMin.toString());
    if (params.priceMax !== undefined) queryParams.append("priceMax", params.priceMax.toString());
    if (params.minRating !== undefined) queryParams.append("minRating", params.minRating.toString());
    
    const response = await fetch(
        `${API_BASE_URL}/bikes?${queryParams.toString()}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    return handleBikeResponse(response);
};

export const getNearbyBikesApi = async (
    params: FetchNearbyBikesParams
): Promise<Bike[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append("longitude", params.longitude.toString());
    queryParams.append("latitude", params.latitude.toString());
    if (params.maxDistance) queryParams.append("maxDistance", params.maxDistance.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
        `${API_BASE_URL}/bikes/nearby?${queryParams.toString()}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const data = await handleBikeResponse(response);
    return Array.isArray(data) ? data : [];
};

/**
 * Fetches details for a single bike by its ID.
 */
export const getBikeDetailsAPI = async (bikeId: string): Promise<Bike | null> => {
    // The backend for getBikeById in bikeController.js returns the bike object directly, not nested in {data: ...}
    const response = await fetch(
        `${API_BASE_URL}/bikes/${bikeId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    // handleBikeResponse expects a certain structure, if /api/bikes/:id returns the bike directly,
    // we might need a slightly different handler or adjust this.
    // For now, let's assume it returns the bike object directly upon success.
    if (!response.ok) {
        // Simplified error handling for this specific case
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as Bike; // Assuming the backend returns the bike object directly
};
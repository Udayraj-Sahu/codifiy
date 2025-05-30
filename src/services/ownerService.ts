// src/services/ownerService.ts
import { User } from "../store/slices/authSlice";
import { PaginationInfo } from "../store/slices/adminBikeSlice";
import { KpiStatsDataRaw, ActivityItemData, OwnerDashboardError } from "../store/slices/ownerDashboardSlice"; // Import ActivityItemData

const API_BASE_URL_OWNER = "http://172.20.10.2:5000/api/owner"; // Main owner route
const API_BASE_URL_OWNER_USERS = `${API_BASE_URL_OWNER}/users`;
const API_BASE_URL_OWNER_DASHBOARD = `${API_BASE_URL_OWNER}/dashboard`;


interface ApiListResponse<T> {
    success: boolean;
    data: T[];
    pagination?: PaginationInfo; // Make pagination optional for non-paginated lists like activity
    message?: string;
}
interface ApiDetailResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}


const handleOwnerApiResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        if (!response.ok) {
            console.error("Server returned non-JSON error (ownerService):", textResponse);
            throw new Error(`Server error: ${response.status} - ${textResponse || "Unknown error"}`);
        }
        return { success: true, message: textResponse };
    }

    if (!response.ok || (data && data.success === false)) {
        const errorMessage = data?.message || data?.errors?.[0]?.msg || "Owner API request failed.";
        const error: Error & { data?: any; status?: number } = new Error(errorMessage);
        error.data = data;
        error.status = response.status;
        throw error;
    }
    // For list APIs, backend might send { success: true, data: [...], pagination: ... }
    // For detail APIs, backend might send { success: true, data: {...} }
    return data; // Return the full response structure { success, data, pagination?, message? }
};


// --- User Management APIs (from previous step) ---
export interface FetchUsersParams { /* ... */ page?: number; limit?: number; role?: 'User' | 'Owner' | 'Admin' | 'all'; search?: string; sortBy?: string;}
export const getUsersForOwnerAPI = async (params: FetchUsersParams, token: string | null): Promise<ApiListResponse<User>> => {
    // ... (implementation as before)
    if (!token) throw new Error("Authentication token not provided.");
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.role && params.role !== 'all') queryParams.append("role", params.role);
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);

    const response = await fetch(`${API_BASE_URL_OWNER_USERS}?${queryParams.toString()}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return handleOwnerApiResponse(response);
};
export const updateUserRoleByOwnerAPI = async (userIdToUpdate: string, newRole: 'User' | 'Owner' | 'Admin', token: string | null): Promise<ApiDetailResponse<User>> => {
    // ... (implementation as before)
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_OWNER_USERS}/${userIdToUpdate}/role`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", },
        body: JSON.stringify({ role: newRole }),
    });
    return handleOwnerApiResponse(response);
};

// --- Dashboard APIs ---
export const getOwnerDashboardStatisticsAPI = async (token: string | null): Promise<ApiDetailResponse<KpiStatsDataRaw>> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_OWNER_DASHBOARD}/statistics`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return handleOwnerApiResponse(response);
};

export const getOwnerRecentActivityAPI = async (token: string | null, limit: number = 5): Promise<ApiListResponse<ActivityItemData>> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_OWNER_DASHBOARD}/recent-activity?limit=${limit}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return handleOwnerApiResponse(response); // Returns { success: true, data: [ActivityItemData...] }
};
// src/services/ownerUserService.ts
import { User } from "../store/slices/authSlice"; // Re-use User type from authSlice
import { PaginationInfo } from "../store/slices/adminBikeSlice"; // Re-use for pagination

// Adjust IP for your setup (e.g., 10.0.2.2 for Android emulator if backend is on localhost)
const API_BASE_URL_OWNER_USERS = "http://172.20.10.2:5000/api/owner/users";

export interface FetchUsersParams {
    page?: number;
    limit?: number;
    role?: 'User' | 'Owner' | 'Admin' | 'all'; // 'all' or undefined for no role filter
    search?: string; // Search by name or email
    sortBy?: string; // e.g., 'createdAt:desc'
}

// Expected structure from backend for a list of users
interface ApiUserListResponse {
    success: boolean;
    data: User[];
    pagination: PaginationInfo;
    message?: string;
}

// Expected structure from backend when a single user is returned (e.g., after update)
interface ApiUserDetailResponse {
    success: boolean;
    data: User;
    message?: string;
}

const handleOwnerUserApiResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        if (!response.ok) {
            console.error("Server returned non-JSON error (ownerUserService):", textResponse);
            throw new Error(`Server error: ${response.status} - ${textResponse || "Unknown error"}`);
        }
        // For non-JSON success, you might return the text or a specific structure
        return { success: true, message: textResponse }; // Adjust as needed
    }

    if (!response.ok || (data && data.success === false)) {
        const errorMessage = data?.message || data?.errors?.[0]?.msg || "Owner User Management API request failed.";
        const error: Error & { data?: any, status?: number } = new Error(errorMessage);
        error.data = data;
        error.status = response.status;
        throw error;
    }
    return data; // This will be the full response object like { success: true, data: ..., pagination: ... }
};

export const getUsersForOwnerAPI = async (
    params: FetchUsersParams,
    token: string | null
): Promise<ApiUserListResponse> => {
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
    return handleOwnerUserApiResponse(response); // Returns the full { success, data, pagination } object
};

export const updateUserRoleByOwnerAPI = async (
    userIdToUpdate: string,
    newRole: 'User' | 'Owner' | 'Admin',
    token: string | null
): Promise<ApiUserDetailResponse> => { // Expects the updated user detail in response
    if (!token) throw new Error("Authentication token not provided.");

    const response = await fetch(`${API_BASE_URL_OWNER_USERS}/${userIdToUpdate}/role`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
    });
    return handleOwnerUserApiResponse(response); // Returns the full { success, data: updatedUser } object
};

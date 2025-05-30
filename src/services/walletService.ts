// src/services/walletService.ts
import {
    WalletData,
    TransactionData,
    AddMoneyInitiateResponse,
    AddMoneyVerifyParams,
    AddMoneyVerifyResponse,
    WalletPaginationInfo,
} from "../store/slices/walletSlice"; // Types from the slice we'll create

const API_BASE_URL_WALLET = "http://172.20.10.2:5000/api/wallet"; // Adjust IP if needed

interface ApiWalletResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
interface ApiTransactionListResponse {
    success: boolean;
    data: TransactionData[];
    pagination: WalletPaginationInfo;
    message?: string;
}

const handleWalletApiResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        if (!response.ok) {
            console.error("Server returned non-JSON error (walletService):", textResponse);
            throw new Error(`Server error: ${response.status} - ${textResponse || "Unknown error"}`);
        }
        return { success: true, message: textResponse };
    }

    if (!response.ok || (data && data.success === false)) {
        const errorMessage = data?.message || data?.errors?.[0]?.msg || "Wallet API request failed.";
        const error: Error & { data?: any; status?: number } = new Error(errorMessage);
        error.data = data;
        error.status = response.status;
        throw error;
    }
    return data; // This returns the full { success: true, data: ..., ... } structure
};

export const getUserWalletAPI = async (token: string | null): Promise<ApiWalletResponse<WalletData>> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_WALLET}/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return handleWalletApiResponse(response); // Expects { success: true, data: WalletData }
};

export const initiateAddMoneyAPI = async (
    amount: number, // Amount in primary currency unit (e.g., INR)
    currency: string = 'INR',
    token: string | null
): Promise<ApiWalletResponse<AddMoneyInitiateResponse>> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_WALLET}/me/add-money/initiate`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, currency }), // Backend expects amount in primary unit
    });
    // Expects { success: true, data: { razorpayOrderId, amount (paisa), currency, razorpayKeyId } }
    return handleWalletApiResponse(response);
};

export const verifyAddMoneyPaymentAPI = async (
    params: AddMoneyVerifyParams,
    token: string | null
): Promise<ApiWalletResponse<AddMoneyVerifyResponse>> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_WALLET}/me/add-money/verify`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    // Expects { success: true, data: { message, updatedBalance } }
    return handleWalletApiResponse(response);
};

export const getWalletTransactionsAPI = async (
    token: string | null,
    page: number = 1,
    limit: number = 10
): Promise<ApiTransactionListResponse> => {
    if (!token) throw new Error("Authentication token not provided.");
    const response = await fetch(`${API_BASE_URL_WALLET}/me/transactions?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return handleWalletApiResponse(response); // Expects { success: true, data: TransactionData[], pagination: ... }
};

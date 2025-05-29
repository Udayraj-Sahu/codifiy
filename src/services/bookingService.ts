// src/services/bookingService.ts
import { PriceCalculationParams, PriceCalculationResponse, CreateBookingParams, CreateBookingResponse } from "../store/slices/bookingSlice";

const API_BASE_URL = "http://172.20.10.2:5000/api/bookings"; // Your backend booking API endpoint

const handleBookingResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        if (!response.ok) {
            console.error("Server returned non-JSON error:", textResponse);
            throw new Error(
                `Server returned status ${response.status}: ${textResponse || "Non-JSON error or no content"}`
            );
        }
        return { message: textResponse }; // Or handle as appropriate
    }

    if (!response.ok) {
        let errorMessage = "An API error occurred.";
        if (data && data.errors && data.errors.length > 0) {
            errorMessage = data.errors.map((err: { msg: string }) => err.msg).join(", ");
        } else if (data && data.message) {
            errorMessage = data.message;
        } else if (response.statusText) {
            errorMessage = response.statusText;
        }
        const error: any = new Error(errorMessage);
        error.response = response; // Attach full response
        error.data = data; // Attach parsed data
        error.status = response.status;
        throw error;
    }
    return data; // Backend usually returns { success: boolean, data: ... } or just data
};


export const calculatePriceAPI = async (
    params: PriceCalculationParams,
    token: string
): Promise<{ success: boolean, data: PriceCalculationResponse }> => {
    const response = await fetch(`${API_BASE_URL}/calculate-price`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });
    return handleBookingResponse(response);
};

export const createBookingAPI = async (
    params: CreateBookingParams,
    token: string
): Promise<CreateBookingResponse> => {
    const response = await fetch(`${API_BASE_URL}`, { // POST to /api/bookings
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });
    return handleBookingResponse(response); // This will be the structure from your backend controller
};

export const verifyPaymentAPI = async (
    paymentData: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
        bookingId: string;
    },
    token: string
): Promise<any> => { // Define a specific response type if needed
    const response = await fetch(`${API_BASE_URL}/verify-payment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
    });
    return handleBookingResponse(response);
};
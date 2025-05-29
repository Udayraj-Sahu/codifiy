// src/services/promoService.ts
import { PriceCalculationResponse, PriceCalculationParams } from "../store/slices/bookingSlice"; // For applyPromoCode response
import { PromoOffer } from "../store/slices/promoSlice"; // We will define this in promoSlice

const API_BASE_URL = "http://172.20.10.2:5000/api/promocodes"; // Your backend promo API endpoint

const handlePromoResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const textResponse = await response.text();
        if (!response.ok) {
            console.error("Server returned non-JSON error (promoService):", textResponse);
            throw new Error(
                `Server returned status ${response.status}: ${textResponse || "Non-JSON error or no content"}`
            );
        }
        return { message: textResponse }; // Or handle as appropriate
    }

    if (!response.ok) {
        let errorMessage = "An API error occurred with promo codes.";
        if (data && data.errors && data.errors.length > 0) {
            errorMessage = data.errors.map((err: { msg: string }) => err.msg).join(", ");
        } else if (data && data.message) {
            errorMessage = data.message;
        } else if (response.statusText) {
            errorMessage = response.statusText;
        }
        const error: any = new Error(errorMessage);
        error.response = response;
        error.data = data;
        error.status = response.status;
        throw error;
    }
    return data;
};

/**
 * Fetches available promo codes for the current user.
 */
export const getAvailablePromosAPI = async (token: string): Promise<PromoOffer[]> => {
    const response = await fetch(`${API_BASE_URL}/available`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const result = await handlePromoResponse(response);
    // The backend for /available returns { success: true, data: userSpecificPromos }
    // where userSpecificPromos is an array of objects matching PromoOffer structure.
    return result.data || [];
};

/**
 * Applies a promo code and returns the calculated price details.
 * This reuses the calculatePriceAPI from bookingService for consistency,
 * as applying a promo directly impacts the price calculation.
 * If you have a dedicated backend endpoint just to validate a promo without full price calc,
 * you can create a separate function for that.
 */
export const applyPromoCodeAPI = async (
    params: PriceCalculationParams, // Contains bikeId, startTime, endTime, promoCode string
    token: string
): Promise<PriceCalculationResponse> => { // Expects the full price calculation response
    const bookingServiceBaseUrl = "http://172.20.10.2:5000/api/bookings"; // booking service URL
    const response = await fetch(`${bookingServiceBaseUrl}/calculate-price`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });
    const result = await handlePromoResponse(response);
    // Backend /calculate-price returns { success: true, data: PriceCalculationResponse }
    if (result.success && result.data) {
        if (params.promoCode && !result.data.promoApplied) {
             // If a promo code was sent but not applied in the response, it means it was invalid.
             // The backend /calculate-price should ideally return an error or specific message for this.
             // For now, we'll throw an error if the frontend expects a discount but doesn't get one.
            throw new Error(`Promo code "${params.promoCode}" is invalid or not applicable.`);
        }
        return result.data;
    } else {
        throw new Error(result.message || "Failed to apply promo code and calculate price.");
    }
};
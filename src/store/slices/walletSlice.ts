// src/store/slices/walletSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as walletService from "../../services/walletService";
import { RootState } from "../store";

// Basic Wallet Data (from backend /me endpoint)
export interface WalletData {
    _id: string;
    user: string;
    balance: number; // Smallest currency unit (e.g., paisa)
    currency: string; // e.g., 'INR'
    createdAt: string;
    updatedAt: string;
}

// Response from backend when initiating add money
export interface AddMoneyInitiateResponse {
    razorpayOrderId: string;
    amount: number; // Amount in smallest currency unit (e.g., paisa) for Razorpay
    currency: string;
    razorpayKeyId: string; // Your Razorpay Key ID
    // transactionId?: string; // Optional: ID of a pending transaction record created
}

// Params for verifying payment
export interface AddMoneyVerifyParams {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    // transactionId?: string; // Correlate with the pending transaction
}

// Response from backend after verifying add money
export interface AddMoneyVerifyResponse {
    message: string;
    updatedBalance: number; // New balance in smallest currency unit
}

// For Transaction History
export interface TransactionData {
    _id: string;
    user: string;
    wallet: string;
    type: 'credit' | 'debit';
    amount: number; // Smallest currency unit
    currency: string;
    status: 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded';
    description: string;
    paymentGatewayTransactionId?: string;
    razorpayOrderId?: string;
    relatedBooking?: string; // Booking ID
    createdAt: string;
    updatedAt: string;
}

export interface WalletPaginationInfo {
    currentPage: number;
    totalPages: number;
    totalTransactions: number; // Renamed for clarity
    limit: number;
}

interface WalletState {
    walletData: WalletData | null;
    transactions: TransactionData[];
    pagination: WalletPaginationInfo | null;
    addMoneyProcess: {
        orderResponse: AddMoneyInitiateResponse | null;
        isInitiating: boolean;
        isVerifying: boolean;
        initiateError: string | null;
        verifyError: string | null;
    };
    isLoadingWallet: boolean;
    isLoadingTransactions: boolean;
    errorWallet: string | null;
    errorTransactions: string | null;
}

const initialState: WalletState = {
    walletData: null,
    transactions: [],
    pagination: null,
    addMoneyProcess: {
        orderResponse: null,
        isInitiating: false,
        isVerifying: false,
        initiateError: null,
        verifyError: null,
    },
    isLoadingWallet: false,
    isLoadingTransactions: false,
    errorWallet: null,
    errorTransactions: null,
};

export const fetchUserWalletThunk = createAsyncThunk<
    WalletData,
    void,
    { rejectValue: string; state: RootState }
>("wallet/fetchUserWallet", async (_, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await walletService.getUserWalletAPI(token);
        return response.data; // Service returns { success, data: WalletData }
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to fetch wallet details");
    }
});

export const initiateAddMoneyThunk = createAsyncThunk<
    AddMoneyInitiateResponse,
    { amount: number; currency?: string }, // Amount in primary currency unit
    { rejectValue: string; state: RootState }
>("wallet/initiateAddMoney", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await walletService.initiateAddMoneyAPI(params.amount, params.currency, token);
        return response.data; // Service returns { success, data: AddMoneyInitiateResponse }
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to initiate add money process");
    }
});

export const verifyAddMoneyPaymentThunk = createAsyncThunk<
    AddMoneyVerifyResponse,
    AddMoneyVerifyParams,
    { rejectValue: string; state: RootState }
>("wallet/verifyAddMoneyPayment", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await walletService.verifyAddMoneyPaymentAPI(params, token);
        // After successful verification, refresh wallet balance
        thunkAPI.dispatch(fetchUserWalletThunk());
        return response.data; // Service returns { success, data: AddMoneyVerifyResponse }
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to verify payment");
    }
});

export const fetchWalletTransactionsThunk = createAsyncThunk<
    { data: TransactionData[], pagination: WalletPaginationInfo },
    { page?: number; limit?: number },
    { rejectValue: string; state: RootState }
>("wallet/fetchTransactions", async (params, thunkAPI) => {
    const token = thunkAPI.getState().auth.token;
    try {
        const response = await walletService.getWalletTransactionsAPI(token, params.page, params.limit);
        return { data: response.data, pagination: response.pagination };
    } catch (error: any) {
        return thunkAPI.rejectWithValue(error.data?.message || error.message || "Failed to fetch wallet transactions");
    }
});


const walletSlice = createSlice({
    name: "wallet",
    initialState,
    reducers: {
        clearWalletErrors: (state) => {
            state.errorWallet = null;
            state.errorTransactions = null;
            state.addMoneyProcess.initiateError = null;
            state.addMoneyProcess.verifyError = null;
        },
        resetAddMoneyProcess: (state) => {
            state.addMoneyProcess = initialState.addMoneyProcess;
        },
        resetWalletState: () => initialState, // For logout
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Wallet
            .addCase(fetchUserWalletThunk.pending, (state) => {
                state.isLoadingWallet = true;
                state.errorWallet = null;
            })
            .addCase(fetchUserWalletThunk.fulfilled, (state, action: PayloadAction<WalletData>) => {
                state.isLoadingWallet = false;
                state.walletData = action.payload;
            })
            .addCase(fetchUserWalletThunk.rejected, (state, action) => {
                state.isLoadingWallet = false;
                state.errorWallet = action.payload;
            })
            // Initiate Add Money
            .addCase(initiateAddMoneyThunk.pending, (state) => {
                state.addMoneyProcess.isInitiating = true;
                state.addMoneyProcess.initiateError = null;
                state.addMoneyProcess.orderResponse = null;
            })
            .addCase(initiateAddMoneyThunk.fulfilled, (state, action: PayloadAction<AddMoneyInitiateResponse>) => {
                state.addMoneyProcess.isInitiating = false;
                state.addMoneyProcess.orderResponse = action.payload;
            })
            .addCase(initiateAddMoneyThunk.rejected, (state, action) => {
                state.addMoneyProcess.isInitiating = false;
                state.addMoneyProcess.initiateError = action.payload;
            })
            // Verify Add Money Payment
            .addCase(verifyAddMoneyPaymentThunk.pending, (state) => {
                state.addMoneyProcess.isVerifying = true;
                state.addMoneyProcess.verifyError = null;
            })
            .addCase(verifyAddMoneyPaymentThunk.fulfilled, (state, action: PayloadAction<AddMoneyVerifyResponse>) => {
                state.addMoneyProcess.isVerifying = false;
                // Wallet balance is refreshed by fetchUserWalletThunk dispatched in the thunk
                state.addMoneyProcess.orderResponse = null; // Clear order details after verification
            })
            .addCase(verifyAddMoneyPaymentThunk.rejected, (state, action) => {
                state.addMoneyProcess.isVerifying = false;
                state.addMoneyProcess.verifyError = action.payload;
            })
            // Fetch Wallet Transactions
            .addCase(fetchWalletTransactionsThunk.pending, (state, action) => {
                if (action.meta.arg.page === 1 || !action.meta.arg.page) {
                    state.isLoadingTransactions = true;
                } // else it's pagination, handle with a different flag if needed
                state.errorTransactions = null;
            })
            .addCase(fetchWalletTransactionsThunk.fulfilled, (state, action) => {
                state.isLoadingTransactions = false;
                if (action.payload.pagination.currentPage === 1) {
                    state.transactions = action.payload.data;
                } else {
                     const newTransactions = action.payload.data.filter(
                        newTrans => !state.transactions.some(existingTrans => existingTrans._id === newTrans._id)
                    );
                    state.transactions.push(...newTransactions);
                }
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchWalletTransactionsThunk.rejected, (state, action) => {
                state.isLoadingTransactions = false;
                state.errorTransactions = action.payload;
            });
    },
});

export const { clearWalletErrors, resetAddMoneyProcess, resetWalletState } = walletSlice.actions;
export default walletSlice.reducer;

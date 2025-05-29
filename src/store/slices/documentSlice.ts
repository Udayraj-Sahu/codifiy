// src/store/slices/documentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as documentService from "../../services/documentService";
import { RootState } from "../store";
import { PaginationInfo } from "./adminBikeSlice";

// Mirror the backend Document model structure
export interface Document {
	_id: string;
	user: string | { _id: string; fullName?: string; email?: string }; // Can be populated
	documentType: string;
	documentSide: "front" | "back" | null;
	fileUrl: string;
	public_id: string;
	status: "pending" | "approved" | "rejected";
	uploadedAt: string;
	reviewedBy?: string | { _id: string; fullName?: string; email?: string }; // Can be populated
	reviewTimestamp?: string;
	reviewComments?: string;
	createdAt: string;
	updatedAt: string;
}
interface UploadDocumentThunkParams {
	documentFile: { uri: string; name: string; type: string };
	documentType: string; // e.g., 'drivers_license'
	documentSide: "front" | "back";
}
interface UpdateDocStatusParams {
	docId: string;
	status: "approved" | "rejected";
	reviewComments?: string;
}
export interface FetchDocumentsParamsAdminOwner {
	page?: number;
	limit?: number;
	status?: "pending" | "approved" | "rejected" | "all";
	userId?: string; // Filter by specific user
	sortBy?: string; // e.g., 'createdAt:desc'
}

interface DocumentState {
	userDocuments: Document[]; // Logged-in user's own documents
	reviewDocuments: Document[]; // Documents for admin/owner review list
	currentDocumentDetails: Document | null; // For viewing a single document
	pagination: PaginationInfo | null; // For reviewDocuments list

	isLoadingUserDocs: boolean;
	isLoadingReviewDocs: boolean;
	isLoadingDetails: boolean;
	isUploading: boolean;
	isUpdatingStatus: boolean;

	errorUserDocs: string | null;
	errorReviewDocs: string | null;
	errorDetails: string | null;
	uploadError: string | null;
	errorUpdateStatus: string | null;
}

const initialState: DocumentState = {
	userDocuments: [],
	reviewDocuments: [],
	currentDocumentDetails: null,
	pagination: null,
	isLoadingUserDocs: false,
	isLoadingReviewDocs: false,
	isLoadingDetails: false,
	isUploading: false,
	isUpdatingStatus: false,
	errorUserDocs: null,
	errorReviewDocs: null,
	errorDetails: null,
	uploadError: null,
	errorUpdateStatus: null,
};

export const uploadUserDocumentThunk = createAsyncThunk<
	Document,
	UploadDocumentThunkParams,
	{ rejectValue: string; state: RootState }
>("documents/uploadUserDocument", async (params, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const newDocument = await documentService.uploadDocumentAPI(
			params,
			token
		);
		thunkAPI.dispatch(fetchUserDocumentsThunk()); // Refresh user's document list
		return newDocument;
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to upload document"
		);
	}
});

// Example thunk to fetch user's documents (you'd call this in ProfileScreen or similar)
// export const fetchUserDocumentsThunk = createAsyncThunk< ... >( ... );
export const fetchUserDocumentsThunk = createAsyncThunk<
	Document[],
	void,
	{ rejectValue: string; state: RootState }
>("documents/fetchUserDocuments", async (_, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const documents = await documentService.getUserDocumentsAPI(token);
		return documents;
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch user documents"
		);
	}
});

export const fetchDocumentsForReviewThunk = createAsyncThunk<
	{ data: Document[]; pagination: PaginationInfo },
	FetchDocumentsParamsAdminOwner,
	{ rejectValue: string; state: RootState }
>("documents/fetchForReview", async (params, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const response = await documentService.getDocumentsForReviewAPI(
			params,
			token
		);
		return response; // Expects { data: Document[], pagination: PaginationInfo }
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch documents for review"
		);
	}
});

export const updateDocumentStatusThunk = createAsyncThunk<
	Document, // Returns updated document
	UpdateDocStatusParams,
	{ rejectValue: string; state: RootState }
>(
	"documents/updateStatus",
	async ({ docId, status, reviewComments }, thunkAPI) => {
		const token = thunkAPI.getState().auth.token;
		try {
			const updatedDocument =
				await documentService.updateDocumentStatusAPI(
					docId,
					status,
					reviewComments,
					token
				);
			// After updating, refresh the list of documents for review
			const currentReviewFilters =
				thunkAPI.getState().documents.currentReviewFilters; // Assuming you store current filters
			if (currentReviewFilters) {
				thunkAPI.dispatch(
					fetchDocumentsForReviewThunk(currentReviewFilters)
				);
			}
			return updatedDocument;
		} catch (error: any) {
			return thunkAPI.rejectWithValue(
				error.message || "Failed to update document status"
			);
		}
	}
);

export const fetchDocumentDetailsByIdThunk = createAsyncThunk<
	Document,
	string, // docId
	{ rejectValue: string; state: RootState }
>("documents/fetchDetailsById", async (docId, thunkAPI) => {
	const token = thunkAPI.getState().auth.token;
	try {
		const document = await documentService.getDocumentByIdAPI(docId, token);
		return document;
	} catch (error: any) {
		return thunkAPI.rejectWithValue(
			error.message || "Failed to fetch document details"
		);
	}
});

const documentSlice = createSlice({
	name: "documents",
	initialState,
	reducers: {
		clearUploadError: (state) => {
			// Defined here
			state.uploadError = null;
		},
		clearDocumentErrors: (state) => {
			state.errorUserDocs = null;
			state.errorReviewDocs = null;
			state.errorDetails = null;
			state.uploadError = null;
			state.errorUpdateStatus = null;
		},
		clearCurrentDocumentDetails: (state) => {
			state.currentDocumentDetails = null;
		},
		// You might add setCurrentReviewFilters reducer here
	},
	extraReducers: (builder) => {
		builder
			// Upload User Document
			.addCase(uploadUserDocumentThunk.pending, (state) => {
				state.isUploading = true;
				state.uploadError = null;
			})
			.addCase(
				uploadUserDocumentThunk.fulfilled,
				(state, action: PayloadAction<Document>) => {
					state.isUploading = false;
					// The userDocuments list will be refreshed by fetchUserDocumentsThunk dispatched within this thunk
				}
			)
			.addCase(uploadUserDocumentThunk.rejected, (state, action) => {
				state.isUploading = false;
				state.uploadError = action.payload;
			})
			// Fetch User's Own Documents
			.addCase(fetchUserDocumentsThunk.pending, (state) => {
				state.isLoadingUserDocs = true;
				state.errorUserDocs = null;
			})
			.addCase(
				fetchUserDocumentsThunk.fulfilled,
				(state, action: PayloadAction<Document[]>) => {
					state.isLoadingUserDocs = false;
					state.userDocuments = action.payload;
				}
			)
			.addCase(fetchUserDocumentsThunk.rejected, (state, action) => {
				state.isLoadingUserDocs = false;
				state.errorUserDocs = action.payload;
			})
			// Fetch Documents for Review (Admin/Owner)
			.addCase(fetchDocumentsForReviewThunk.pending, (state) => {
				state.isLoadingReviewDocs = true;
				state.errorReviewDocs = null;
			})
			.addCase(
				fetchDocumentsForReviewThunk.fulfilled,
				(state, action) => {
					state.isLoadingReviewDocs = false;
					state.reviewDocuments = action.payload.data;
					state.pagination = action.payload.pagination;
				}
			)
			.addCase(fetchDocumentsForReviewThunk.rejected, (state, action) => {
				state.isLoadingReviewDocs = false;
				state.errorReviewDocs = action.payload;
			})
			// Update Document Status (Owner)
			.addCase(updateDocumentStatusThunk.pending, (state) => {
				state.isUpdatingStatus = true;
				state.errorUpdateStatus = null;
			})
			.addCase(
				updateDocumentStatusThunk.fulfilled,
				(state, action: PayloadAction<Document>) => {
					state.isUpdatingStatus = false;
					// Update in reviewDocuments list if present
					const index = state.reviewDocuments.findIndex(
						(doc) => doc._id === action.payload._id
					);
					if (index !== -1) {
						state.reviewDocuments[index] = action.payload;
					}
					// Also update currentDocumentDetails if it's the one being updated
					if (
						state.currentDocumentDetails?._id === action.payload._id
					) {
						state.currentDocumentDetails = action.payload;
					}
				}
			)
			.addCase(updateDocumentStatusThunk.rejected, (state, action) => {
				state.isUpdatingStatus = false;
				state.errorUpdateStatus = action.payload;
			})
			// Fetch Single Document Details (Admin/Owner)
			.addCase(fetchDocumentDetailsByIdThunk.pending, (state) => {
				state.isLoadingDetails = true;
				state.errorDetails = null;
				state.currentDocumentDetails = null;
			})
			.addCase(
				fetchDocumentDetailsByIdThunk.fulfilled,
				(state, action: PayloadAction<Document>) => {
					state.isLoadingDetails = false;
					state.currentDocumentDetails = action.payload;
				}
			)
			.addCase(
				fetchDocumentDetailsByIdThunk.rejected,
				(state, action) => {
					state.isLoadingDetails = false;
					state.errorDetails = action.payload;
				}
			);
	},
});

export const {
	clearDocumentErrors,
	clearCurrentDocumentDetails,
	clearUploadError, // <<< MAKE SURE IT'S EXPORTED HERE
	// setCurrentReviewFilters,
} = documentSlice.actions;
export default documentSlice.reducer;

// src/services/documentService.ts
import { PaginationInfo } from "../store/slices/adminBikeSlice"; // Re-use for pagination if needed
import {
	Document as DocumentModel,
	FetchDocumentsParamsAdminOwner,
} from "../store/slices/documentSlice"; // Adjust path

const API_BASE_URL_DOCUMENTS = "http://172.20.10.2:5000/api/documents"; // Your backend documents API endpoint

export interface UploadDocumentServiceParams {
	documentFile: { uri: string; name: string; type: string };
	documentType: string;
	documentSide: "front" | "back";
}

interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	// For paginated responses
	count?: number;
	total?: number;
	pagination?: PaginationInfo;
}

const handleDocumentApiResponse = async (response: Response): Promise<any> => {
	const contentType = response.headers.get("content-type");
	let data;
	if (contentType && contentType.indexOf("application/json") !== -1) {
		data = await response.json();
	} else {
		const textResponse = await response.text();
		if (!response.ok) {
			console.error(
				"Server returned non-JSON error (documentService):",
				textResponse
			);
			throw new Error(
				`Server returned status ${response.status}: ${
					textResponse || "Non-JSON error or no content"
				}`
			);
		}
		return { message: textResponse }; // Or handle as appropriate
	}

	if (!response.ok) {
		let errorMessage = "Document API error.";
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
		error.data = data; // Attach parsed data which might contain { message: "..." }
		throw error;
	}
	return data; // Backend returns document object directly for upload, or {data, pagination} for lists
};

export const uploadDocumentAPI = async (
	params: UploadDocumentServiceParams,
	token: string | null
): Promise<DocumentModel> => {
	// Backend POST /api/documents/me returns the new document object
	if (!token)
		throw new Error(
			"Authentication token not provided for document upload."
		);

	const formData = new FormData();
	formData.append("documentFile", {
		uri: params.documentFile.uri,
		name: params.documentFile.name,
		type: params.documentFile.type,
	} as any);
	formData.append("documentType", params.documentType);
	formData.append("documentSide", params.documentSide);

	const response = await fetch(`${API_BASE_URL_DOCUMENTS}/me`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: formData,
	});
	return handleDocumentApiResponse(response);
};

export const getUserDocumentsAPI = async (
	token: string | null
): Promise<DocumentModel[]> => {
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(`${API_BASE_URL_DOCUMENTS}/me`, {
		// GET /api/documents/me
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	// Backend returns an array of documents directly for this endpoint
	const documents = await handleDocumentApiResponse(response);
	return Array.isArray(documents) ? documents : [];
};

// For Admin/Owner to get documents for review
export const getDocumentsForReviewAPI = async (
	params: FetchDocumentsParamsAdminOwner,
	token: string | null
): Promise<ApiResponse<DocumentModel[]>> => {
	if (!token) throw new Error("Authentication token not provided.");
	const queryParams = new URLSearchParams();
	if (params.page) queryParams.append("page", String(params.page));
	if (params.limit) queryParams.append("limit", String(params.limit));
	if (params.status && params.status !== "all")
		queryParams.append("status", params.status);
	if (params.userId) queryParams.append("userId", params.userId);
	if (params.sortBy) queryParams.append("sortBy", params.sortBy);

	const response = await fetch(
		`${API_BASE_URL_DOCUMENTS}?${queryParams.toString()}`,
		{
			// GET /api/documents
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		}
	);
	return handleDocumentApiResponse(response); // Expects { data: [], pagination: {} }
};

// For Owner to update document status
export const updateDocumentStatusAPI = async (
	docId: string,
	status: "approved" | "rejected",
	reviewComments: string | undefined,
	token: string | null
): Promise<DocumentModel> => {
	// Backend PUT /api/documents/:docId/status returns updated document
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(`${API_BASE_URL_DOCUMENTS}/${docId}/status`, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ status, reviewComments }),
	});
	return handleDocumentApiResponse(response);
};

// For Admin/Owner to get a single document by ID
export const getDocumentByIdAPI = async (
	docId: string,
	token: string | null
): Promise<DocumentModel> => {
	// Backend GET /api/documents/:docId returns the document
	if (!token) throw new Error("Authentication token not provided.");
	const response = await fetch(`${API_BASE_URL_DOCUMENTS}/${docId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	return handleDocumentApiResponse(response);
};

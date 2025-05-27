// src/services/authService.ts

// For Android Emulator, use 10.0.2.2 for your host machine's localhost
// For physical device on same Wi-Fi, use your computer's network IP address (e.g., 192.168.1.X)
// For iOS simulator, localhost usually works.
const API_BASE_URL = "http://172.20.10.2:5000/api/auth"; // EXAMPLE for Android Emulator
// const API_BASE_URL = 'http://localhost:5001/api/auth'; // EXAMPLE for iOS Simulator / Web

export interface  User {
	id: string;
	fullName: string;
	email: string;
	role: "User" | "Admin" | "Owner";
}

interface AuthResponse {
	user: User;
	token: string;
}

interface ApiErrorResponse {
	// To handle potential error structures from backend
	errors?: Array<{ msg: string }>; // From express-validator
	message?: string; // General error message
}

const handleResponse = async (response: Response): Promise<any> => {
	const contentType = response.headers.get("content-type");
	let data;
	if (contentType && contentType.indexOf("application/json") !== -1) {
		data = await response.json();
	} else {
		// Handle non-JSON responses if necessary, or assume error for this app
		if (!response.ok)
			throw new Error("Server returned non-JSON error or no content");
		return {}; // Or handle as appropriate if non-JSON success is expected
	}

	if (!response.ok) {
		// Try to extract a meaningful error message
		let errorMessage = "An error occurred.";
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
		error.response = response; // Attach full response if needed
		error.data = data; // Attach parsed data if needed
		throw error;
	}
	return data;
};

export const login = async (
	email: string,
	password: string
): Promise<AuthResponse> => {
	const response = await fetch(`${API_BASE_URL}/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email, password }),
	});
	return handleResponse(response);
};

export const signup = async (
	fullName: string,
	email: string,
	password: string
): Promise<AuthResponse> => {
	const response = await fetch(`${API_BASE_URL}/signup`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ fullName, email, password }),
	});
	return handleResponse(response);
};

export const getLoggedInUserProfile = async (token: string): Promise<User> => { // Assuming /me returns the user object directly or { user: User }
  const response = await fetch(`${API_BASE_URL}/me`, { // Ensure this matches your backend route
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Send the token
    },
  });
  const data = await handleResponse(response);
  // Adjust based on what your /api/auth/me endpoint returns.
  // If it returns the user object directly:
  return data as User;
  // If it returns { user: UserData }:
  // return data.user as User;
};
// Optional: Add a function to verify token with backend if you implement that endpoint
// export const verifyTokenWithBackend = async (token: string): Promise<User> => {
//   const response = await fetch(`${API_BASE_URL}/me`, { // Assuming a /me endpoint
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//     },
//   });
//   const data = await handleResponse(response);
//   return data.user; // Assuming backend returns { user: User }
// };

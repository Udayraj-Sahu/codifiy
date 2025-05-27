// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store'; // For securely storing the auth token
import {
    login as apiLogin,
    signup as apiSignup, // We might not call signup directly from here, but it's available
    getLoggedInUserProfile,
    User as ApiUser, // Renaming to avoid conflict if we define a local User type
    AuthResponse,
} from '../services/authService'; // Adjust path to your authService.ts

// You might want a slightly different User type in your context, or use the one from authService
export interface User extends ApiUser {} // For now, let's use the same structure

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // For initial auth state check
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpAndSignIn: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>; // Combined for convenience
  signOut: () => Promise<void>;
  // verifyAuth: () => Promise<void>; // Could be explicit, or handled by bootstrap
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'userToken'; // Key for SecureStore

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app startup
    const bootstrapAsync = async () => {
      let userToken: string | null = null;
      try {
        userToken = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch (e) {
        console.error("Restoring token failed", e);
        // setIsLoading(false); // Fall through to set not authenticated
      }

      if (userToken) {
        try {
          console.log("Found token, verifying with backend...");
          const fetchedUser = await getLoggedInUserProfile(userToken); // Verify token and get user
          if (fetchedUser) {
            setUser(fetchedUser);
            setToken(userToken);
            // setIsAuthenticated(true); // This will be derived from user & token state
          } else {
            // Token might be invalid or user not found
            await SecureStore.deleteItemAsync(TOKEN_KEY); // Clear invalid token
          }
        } catch (error: any) {
          console.error("Token verification failed or user fetch error:", error.message);
          await SecureStore.deleteItemAsync(TOKEN_KEY); // Clear invalid token
        }
      }
      setIsLoading(false);
    };
    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const authResponse: AuthResponse = await apiLogin(email, password);
      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        setToken(authResponse.token);
        await SecureStore.setItemAsync(TOKEN_KEY, authResponse.token);
        return { success: true };
      }
      // Should not happen if apiLogin throws on error, but as a fallback:
      return { success: false, error: "Login failed: Invalid response from server." };
    } catch (error: any) {
      console.error("Sign in error in AuthContext:", error);
      return { success: false, error: error.message || "An unknown error occurred during sign in." };
    }
  };

  // Example: Signup and then automatically sign in
  const signUpAndSignIn = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const authResponse: AuthResponse = await apiSignup(fullName, email, password);
      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        setToken(authResponse.token);
        await SecureStore.setItemAsync(TOKEN_KEY, authResponse.token);
        return { success: true };
      }
      return { success: false, error: "Signup failed: Invalid response from server." };
    } catch (error: any) {
      console.error("Sign up error in AuthContext:", error);
      return { success: false, error: error.message || "An unknown error occurred during sign up." };
    }
  };


  const signOut = async () => {
    setUser(null);
    setToken(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Deleting token failed", e);
    }
  };

  const isAuthenticated = !!user && !!token; // Derived state

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, signIn, signUpAndSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
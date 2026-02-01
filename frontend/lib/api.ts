import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Options interface that supports both fetch-style and axios-style options
 * for backwards compatibility
 */
export interface FetchClientOptions {
  method?: string;
  body?: string | object;
  data?: unknown;
  headers?: Record<string, string>;
}

/**
 * Create configured Axios instance with interceptors
 */
function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Important: sends cookies with requests (for httpOnly JWT)
  });

  // Request interceptor - can be used for logging, adding tokens, etc.
  instance.interceptors.request.use(
    (config) => {
      // Request is already configured with credentials
      // Add any additional request modifications here if needed
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors consistently
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Return the response for successful requests
      return response;
    },
    (error: AxiosError<{ message?: string; error?: string }>) => {
      if (error.response) {
        // Server responded with an error status
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "An error occurred";
        
        const apiError = new ApiError(
          errorMessage,
          error.response.status,
          error.response.data
        );
        
        return Promise.reject(apiError);
      } else if (error.request) {
        // Request was made but no response received
        const apiError = new ApiError(
          "Network error - no response received",
          0
        );
        return Promise.reject(apiError);
      } else {
        // Error in request setup
        const apiError = new ApiError(
          error.message || "Request configuration error",
          0
        );
        return Promise.reject(apiError);
      }
    }
  );

  return instance;
}

// Create singleton instance
const apiClient = createApiClient();

/**
 * Typed fetch client using Axios
 * Maintains backwards compatibility with the previous fetch-based API
 * Supports both 'body' (fetch-style) and 'data' (axios-style) properties
 */
export async function fetchClient<T = unknown>(
  endpoint: string,
  options: FetchClientOptions = {}
): Promise<T> {
  const { method = "GET", body, data, headers } = options;

  // Handle body -> data conversion for backwards compatibility
  // If 'body' is provided (fetch-style), convert it to 'data' (axios-style)
  let requestData = data;
  if (body !== undefined && data === undefined) {
    requestData = typeof body === "string" ? JSON.parse(body) : body;
  }

  const response = await apiClient.request<T>({
    url: endpoint,
    method,
    data: requestData,
    headers,
  });

  return response.data;
}

/**
 * GET request helper
 */
export async function get<T = unknown>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await apiClient.get<T>(endpoint, { params });
  return response.data;
}

/**
 * POST request helper
 */
export async function post<T = unknown>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data);
  return response.data;
}

/**
 * PUT request helper
 */
export async function put<T = unknown>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  const response = await apiClient.put<T>(endpoint, data);
  return response.data;
}

/**
 * DELETE request helper
 */
export async function del<T = unknown>(
  endpoint: string
): Promise<T> {
  const response = await apiClient.delete<T>(endpoint);
  return response.data;
}

/**
 * Sign out user by clearing auth cookie
 */
export async function signOut(): Promise<{ message: string }> {
  return post<{ message: string }>("/api/signout");
}

/**
 * Sign in user
 */
export async function signIn(
  username: string,
  password: string
): Promise<{ message: string }> {
  return post<{ message: string }>("/api/signin", { username, password });
}

// Export the axios instance for advanced use cases
export { apiClient };

// Export axios utilities for checking error types
export const isAxiosError = axios.isAxiosError;

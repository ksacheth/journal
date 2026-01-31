const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Client-side fetch wrapper that automatically sends cookies
 * JWT token is now stored in httpOnly cookie (more secure than localStorage)
 */
export const fetchClient = async (
  endpoint: string,
  options: FetchOptions = {}
) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Important: sends cookies with requests
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || errorData.error || "An error occurred");
    // Attach status code for error handling
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Sign out user by clearing auth cookie
 */
export const signOut = async () => {
  return fetchClient("/api/signout", {
    method: "POST",
  });
};

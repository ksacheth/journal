const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const fetchClient = async (
  endpoint: string,
  options: FetchOptions = {}
) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : undefined;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "An error occurred");
  }

  return response.json();
};

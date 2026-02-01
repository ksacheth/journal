"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchClient } from "./api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook to check authentication status
 * Returns auth state and handles redirects
 */
export function useAuth({ 
  requireAuth = false, 
  redirectTo = "/signin",
  redirectIfAuth = null 
}: { 
  requireAuth?: boolean; 
  redirectTo?: string;
  redirectIfAuth?: string | null;
} = {}): AuthState {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch entries as an auth check
        // If it fails with 401, user is not authenticated
        const now = new Date();
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        await fetchClient(`/api/entries/${now.getFullYear()}-${monthStr}`);
        
        // If successful, user is authenticated
        setAuthState({ isAuthenticated: true, isLoading: false });
        
        // If we should redirect authenticated users (e.g., from /signin)
        if (redirectIfAuth) {
          router.push(redirectIfAuth);
        }
      } catch (error) {
        // Check if it's a 401 error
        const err = error as { status?: number };
        if (err.status === 401) {
          setAuthState({ isAuthenticated: false, isLoading: false });
          
          // If auth is required, redirect to login
          if (requireAuth) {
            router.push(redirectTo);
          }
        } else {
          // For other errors, assume not authenticated to be safe
          setAuthState({ isAuthenticated: false, isLoading: false });
          if (requireAuth) {
            router.push(redirectTo);
          }
        }
      }
    };

    checkAuth();
  }, [requireAuth, redirectTo, redirectIfAuth, router, pathname]);

  return authState;
}

/**
 * Higher-order component to protect pages that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/signin"
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth({ requireAuth: true, redirectTo });

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-text-secondary">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to redirect authenticated users away from auth pages
 */
export function withoutAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/entry"
): React.FC<P> {
  return function RedirectIfAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth({ redirectIfAuth: redirectTo });

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-text-secondary">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

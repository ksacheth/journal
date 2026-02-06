"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * Hook to check authentication status using NextAuth session
 * Returns auth state and handles redirects
 */
export function useAuth({
  requireAuth = false,
  redirectTo = "/signin",
  redirectIfAuth = null,
}: {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuth?: string | null;
} = {}): AuthState {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session;

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    }

    if (redirectIfAuth && isAuthenticated) {
      router.push(redirectIfAuth);
    }
  }, [
    isLoading,
    isAuthenticated,
    requireAuth,
    redirectTo,
    redirectIfAuth,
    router,
    pathname,
  ]);

  return {
    isAuthenticated,
    isLoading,
    user: session?.user,
  };
}

/**
 * Higher-order component to protect pages that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/signin",
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth({
      requireAuth: true,
      redirectTo,
    });

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-text-secondary">
              Checking authentication...
            </p>
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
  redirectTo: string = "/entry",
): React.FC<P> {
  return function RedirectIfAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth({
      redirectIfAuth: redirectTo,
    });

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-text-secondary">
              Checking authentication...
            </p>
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

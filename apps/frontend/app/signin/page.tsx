"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Sparkles } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"google" | "credentials" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleOAuthSignIn = async (provider: "google") => {
    setError(null);
    setIsLoading(provider);

    try {
      await nextAuthSignIn(provider, {
        callbackUrl: "/entry",
      });
    } catch {
      setError("Unable to sign in. Please try again.");
      setIsLoading(null);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading("credentials");

    try {
      const result = await nextAuthSignIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/username or password");
        setIsLoading(null);
      } else {
        router.push("/entry");
      }
    } catch {
      setError("Unable to sign in. Please try again.");
      setIsLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bounce-in w-full max-w-md">
        {/* Header with Icon */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="pulse-glow mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Welcome Back
          </h1>
          <p className="mt-3 text-base font-medium text-text-secondary">
            Sign in to continue your journey
          </p>
        </div>

        {/* Sign In Card */}
        <div className="card-surface p-6 sm:p-8 lg:p-10 bg-white/50 backdrop-blur-sm">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600"
            >
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading !== null}
              className="smooth-transition w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 text-base font-semibold text-text-primary shadow-sm hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading === "google" ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
              ) : (
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>
                {isLoading === "google"
                  ? "Signing in..."
                  : "Continue with Google"}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-text-tertiary">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-semibold uppercase tracking-wider text-text-tertiary"
              >
                Email or Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold uppercase tracking-wider text-text-tertiary"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading !== null}
              className="smooth-transition w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading === "credentials" ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-text-tertiary">
              Sign up is currently disabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

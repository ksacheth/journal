"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchClient } from "@/lib/api";
import { Sparkles } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await fetchClient("/api/signin", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      router.push("/entry");
    } catch (error) {
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
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

        {/* Form Card */}
        <div className="card-surface p-6 sm:p-8 lg:p-10 bg-white/50 backdrop-blur-sm">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="smooth-transition w-full rounded-xl bg-primary px-4 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
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

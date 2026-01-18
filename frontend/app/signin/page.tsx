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
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bounce-in w-full max-w-md">
        {/* Header with Icon */}
        <div className="mb-8 text-center">
          <div className="pulse-glow mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Welcome Back
          </h1>
          <p className="mt-3 text-base font-medium text-text-secondary">
            Sign in to continue your colorful journey ✨
          </p>
        </div>

        {/* Form Card */}
        <div className="card-surface p-8 sm:p-10">
          {error && (
            <div className="mb-6 rounded-xl border-2 border-primary/40 bg-primary/10 p-4 text-sm font-medium text-primary">
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
                className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/20 hover:border-accent"
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
                className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3.5 text-base font-medium text-text-primary placeholder-text-tertiary transition-all focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/20 hover:border-accent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="smooth-transition w-full rounded-xl bg-gradient-to-r from-primary via-accent to-secondary px-4 py-4 text-base font-bold text-white shadow-xl hover:shadow-glow hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing in..." : "Sign in ✨"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-text-tertiary">
              Don&apos;t have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-sm font-bold text-primary smooth-transition hover:scale-105 inline-block hover:text-accent"
            >
              Sign up →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = window.localStorage.getItem("authToken");
      if (savedToken) {
        router.push("/entry");
      }
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.message ?? "Unable to sign in.";
        throw new Error(message);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error("No token returned from server.");
      }

      window.localStorage.setItem("authToken", data.token);
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
    <div className="flex min-h-screen items-center justify-center bg-[#0E0C1B] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#050408] p-6 sm:p-8 text-white shadow-xl">
        <h1 className="text-2xl font-semibold">Journal Sign In</h1>
        <p className="mt-2 text-sm text-white/60">
          Sign in to continue.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-2"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-2"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#3617CE] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a1fc7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <div className="mt-4 text-center text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-[#3617CE] hover:underline"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

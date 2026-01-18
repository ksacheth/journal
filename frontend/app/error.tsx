"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0C1B] p-6">
      <div className="max-w-md rounded-2xl border border-white/10 bg-[#050408] p-6 text-center">
        <h2 className="text-xl font-semibold text-white">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Try again or refresh the page if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-[#3617CE] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c12a6]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

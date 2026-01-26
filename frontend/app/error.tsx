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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-lg">
        <h2 className="text-xl font-bold text-text-primary">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Try again or refresh the page if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 smooth-transition rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-hover hover:scale-105"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

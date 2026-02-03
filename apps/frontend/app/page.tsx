"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchClient } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch entries as an auth check
        const now = new Date();
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        await fetchClient(`/api/entries/${now.getFullYear()}-${monthStr}`);

        // If successful, user is authenticated, redirect to entry
        router.push("/entry");
      } catch (error) {
        // If error (401 or other), redirect to signin
        console.log("Auth check failed, redirecting to signin:", error);
        router.push("/signin");
      }
    };

    // Wrap in setTimeout to prevent synchronous errors from bubbling
    setTimeout(() => {
      checkAuth().catch((err) => {
        console.error("Unexpected error in auth check:", err);
        router.push("/signin");
      });
    }, 0);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

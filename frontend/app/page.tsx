"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/signin");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-text-tertiary">Redirecting...</div>
    </div>
  );
}
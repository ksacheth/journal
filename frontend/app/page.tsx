"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/signin");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0C1B]">
      <div className="text-white/50">Redirecting...</div>
    </div>
  );
}
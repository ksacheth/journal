"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function Signup() {
  const router = useRouter();

  // Redirect to signin - signup is disabled
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/signin");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bounce-in w-full max-w-md text-center">
        <div className="pulse-glow mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/20 text-secondary">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">
          Sign Up Disabled
        </h1>
        <p className="mt-3 text-text-secondary">
          New registrations are currently closed.
        </p>
        <p className="mt-2 text-sm text-text-tertiary">
          Redirecting to sign in...
        </p>
      </div>
    </div>
  );
}

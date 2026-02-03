"use client";

import { useEffect } from "react";

export default function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error ?? event.message;
      console.error("Global error captured", error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}

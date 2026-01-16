"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import JournalEntryModal from "@/components/JournalEntryModal";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface Entry {
  date: Date;
  mood: string;
  text: string;
  tags: string[];
  todos: Todo[];
}

export default function EntryPage() {
  const router = useRouter();
  const params = useParams();
  const monthParam = params.month as string;
  const dateParam = params.date as string;

  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse date from URL params
    if (monthParam && dateParam) {
      let year: number;
      let month: number;

      if (monthParam.includes("-")) {
        // Format: "2024-10"
        const [yearStr, monthStr] = monthParam.split("-");
        year = parseInt(yearStr, 10);
        month = parseInt(monthStr, 10) - 1;
      } else {
        // Format: "10"
        year = new Date().getFullYear();
        month = parseInt(monthParam, 10) - 1;
      }

      const day = parseInt(dateParam, 10);
      const date = new Date(year, month, day);
      setEntryDate(date);

      const fetchEntry = async (dateToFetch: Date) => {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          setEntry(null);
          setError("Sign in to view this entry.");
          setLoading(false);
          return;
        }

        try {
          const year = dateToFetch.getFullYear();
          const month = String(dateToFetch.getMonth() + 1).padStart(2, "0");
          const day = String(dateToFetch.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          const response = await fetch(`/api/entry/${dateStr}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 404) {
            setEntry(null);
            return;
          }

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const message = data.error ?? "Unable to load entry.";
            throw new Error(message);
          }

          const data = await response.json();
          setEntry({
            date: new Date(data.date),
            mood: data.mood,
            text: data.text ?? "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            todos: Array.isArray(data.todos) ? data.todos : [],
          });
        } catch (error) {
          console.error("Error fetching entry:", error);
          setEntry(null);
          setError("Unable to load entry right now.");
        } finally {
          setLoading(false);
        }
      };

      // Fetch existing entry for this date
      fetchEntry(date);
    }
  }, [monthParam, dateParam]);

  const getAuthToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      window.localStorage.getItem("authToken") ??
      process.env.NEXT_PUBLIC_AUTH_TOKEN ??
      null
    );
  };


  const handleSave = async (entryData: {
    date: Date;
    mood: string;
    text: string;
    tags: string[];
    todos: Todo[];
  }) => {
    setError(null);
    const token = getAuthToken();

    if (!token) {
      const message = "Sign in to save entries.";
      setError(message);
      throw new Error(message);
    }

    try {
      const year = entryData.date.getFullYear();
      const month = String(entryData.date.getMonth() + 1).padStart(2, "0");
      const day = String(entryData.date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const response = await fetch(`/api/entry/${dateStr}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood: entryData.mood,
          text: entryData.text,
          tags: entryData.tags,
          todos: entryData.todos,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error ?? "Unable to save entry.";
        setError(message);
        throw new Error(message);
      }

      const data = await response.json();
      setEntry({
        date: new Date(data.date),
        mood: data.mood,
        text: data.text ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        todos: Array.isArray(data.todos) ? data.todos : [],
      });

      // Navigate back to calendar after saving
      router.push(`/entry/${year}-${month}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      setError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to save entry right now."
      );
      throw error;
    }
  };

  const handleClose = () => {
    if (entryDate) {
      const monthStr = String(entryDate.getMonth() + 1).padStart(2, "0");
      const year = entryDate.getFullYear();
      router.push(`/entry/${year}-${monthStr}`);
    } else {
      router.push("/entry");
    }
  };

  if (loading || !entryDate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0C1B]">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0C1B]">
      <JournalEntryModal
        key={entryDate.toISOString()}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        initialDate={entryDate}
        initialEntry={entry ?? undefined}
        errorMessage={error ?? undefined}
      />
    </div>
  );
}

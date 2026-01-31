"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import JournalEntryModal from "@/components/JournalEntryModal";
import { useEntry, saveEntry } from "@/lib/swr-hooks";
import { storePendingMood } from "@/lib/optimisticUpdates";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface EntryData {
  date: Date;
  mood: string;
  text?: string;
  tags?: string[];
  todos?: Todo[];
}

// Parse date from URL params and return entryDate, dateStr, and any validation error
function useParsedDate(monthParam: string, dateParam: string) {
  return useMemo(() => {
    if (!monthParam || !dateParam) {
      return { entryDate: null, dateStr: null, validationError: null };
    }

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
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 0 ||
      month > 11
    ) {
      return { entryDate: null, dateStr: null, validationError: "Invalid date." };
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return { entryDate: null, dateStr: null, validationError: "Invalid date." };
    }

    const entryDate = new Date(year, month, day);

    const formattedYear = String(year);
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${formattedYear}-${formattedMonth}-${formattedDay}`;

    return { entryDate, dateStr, validationError: null };
  }, [monthParam, dateParam]);
}

export default function EntryPage() {
  const router = useRouter();
  const params = useParams();
  const monthParam = params.month as string;
  const dateParam = params.date as string;

  const { entryDate, dateStr, validationError } = useParsedDate(monthParam, dateParam);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use SWR hook to fetch entry data
  const { entry, isLoading, error: swrError } = useEntry(dateStr);

  // Compute error state from validation and SWR errors
  const error = useMemo(() => {
    if (validationError) return validationError;
    if (swrError) {
      if (swrError.status === 401) {
        return "Sign in to view this entry.";
      }
      return "Unable to load entry right now.";
    }
    return saveError;
  }, [validationError, swrError, saveError]);

  const handleSave = async (entryData: {
    date: Date;
    mood: string;
    text: string;
    tags: string[];
    todos: Todo[];
  }) => {
    setSaveError(null);

    try {
      const year = entryData.date.getFullYear();
      const month = String(entryData.date.getMonth() + 1).padStart(2, "0");
      const day = String(entryData.date.getDate()).padStart(2, "0");
      const currentDateStr = `${year}-${month}-${day}`;

      // Save entry using SWR hook
      await saveEntry(currentDateStr, {
        mood: entryData.mood,
        text: entryData.text,
        tags: entryData.tags,
        todos: entryData.todos,
      });

      // Store mood for optimistic updates
      storePendingMood(currentDateStr, entryData.mood);

      // Navigate back to calendar after saving
      router.push(`/entry/${year}-${month}`);
    } catch (error) {
      console.error("Error saving entry:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to save entry right now.";
      setSaveError(message);
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

  if (isLoading || !entryDate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <JournalEntryModal
        key={entryDate.toISOString()}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        initialDate={entryDate}
        initialEntry={entry ? {
          mood: entry.mood,
          text: entry.text || "",
          tags: entry.tags || [],
          todos: entry.todos || [],
        } : undefined}
        errorMessage={error ?? undefined}
      />
    </div>
  );
}

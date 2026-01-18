"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Entry {
  date: string;
  mood: string;
}

const monthAbbr = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const moodColors: Record<string, string> = {
  excellent: "#10B981", // green
  good: "#3B82F6", // blue
  neutral: "#F59E0B", // orange
  bad: "#F97316", // orange-red
  terrible: "#EF4444", // red
};

export default function CalendarPage() {
  const router = useRouter();
  const params = useParams();
  const monthParam = params.month as string;

  const parseMonthParam = (value?: string | null) => {
    const today = new Date();
    const fallback = { month: today.getMonth(), year: today.getFullYear() };

    if (!value) {
      return fallback;
    }

    if (value.includes("-")) {
      const [yearStr, monthStr] = value.split("-");
      if (!yearStr || !monthStr) {
        return fallback;
      }

      const parsedYear = Number.parseInt(yearStr, 10);
      const parsedMonth = Number.parseInt(monthStr, 10) - 1;

      if (!Number.isFinite(parsedYear) || Number.isNaN(parsedMonth)) {
        return fallback;
      }

      const month = Math.min(11, Math.max(0, parsedMonth));
      return { month, year: parsedYear };
    }

    const parsedMonth = Number.parseInt(value, 10) - 1;
    if (Number.isNaN(parsedMonth)) {
      return fallback;
    }

    const month = Math.min(11, Math.max(0, parsedMonth));
    return { month, year: fallback.year };
  };

  // Initialize state based on URL param to avoid flash
  const getInitialMonth = () => {
    return parseMonthParam(monthParam);
  };

  const initial = getInitialMonth();
  const [currentMonth, setCurrentMonth] = useState<number>(initial.month);
  const [currentYear, setCurrentYear] = useState<number>(initial.year);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toLocalDateKey = (value: string) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Parse month from URL (format: "2024-10" or "10")
    const { month: monthNum, year } = parseMonthParam(monthParam);

    setCurrentMonth(monthNum);
    setCurrentYear(year);

    const fetchEntries = async (year: number, month: number) => {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        setEntries([]);
        setError("Sign in to load your entries.");
        setLoading(false);
        return;
      }

      try {
        const monthStr = String(month + 1).padStart(2, "0");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/entries/${year}-${monthStr}`,
          {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = data.error ?? "Unable to load entries.";
          throw new Error(message);
        }

        const data = await response.json();
        const mappedEntries = (data.entries || []).map((entry: Entry) => ({
          date: toLocalDateKey(entry.date),
          mood: entry.mood,
        }));

        setEntries(mappedEntries);
      } catch (error) {
        console.error("Error fetching entries:", error);
        setEntries([]);
        setError("Unable to load entries right now.");
      } finally {
        setLoading(false);
      }
    };

    // Fetch entries for the month
    fetchEntries(year, monthNum);
  }, [monthParam]);

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


  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getEntryMood = (day: number): string | null => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    const entry = entries.find((e) => e.date === dateStr);
    return entry ? entry.mood : null;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dateStr = String(day).padStart(2, "0");
    router.push(`/entry/${currentYear}-${monthStr}/${dateStr}`);
  };

  const handleMonthChange = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    router.push(`/entry/${currentYear}-${monthStr}`);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#0E0C1B] p-8">
      <div className="mx-auto max-w-4xl">
        {/* Month Selector */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {monthAbbr.map((month, index) => {
              const isSelected = index === currentMonth;
              return (
                <button
                  key={index}
                  onClick={() => handleMonthChange(index)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "rounded-lg text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: "#3617CE" }
                      : { backgroundColor: "transparent" }
                  }
                >
                  {month}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => router.push("/entry")}
            className="text-white/50 hover:text-white transition-colors shrink-0 ml-2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 2V4M14 2V4M3 10H17M5 4H15C16.1046 4 17 4.89543 17 6V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V6C3 4.89543 3.89543 4 5 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Days of Week */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-white"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center text-white/50">Loading...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const mood = getEntryMood(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className="group relative aspect-square rounded-xl sm:rounded-2xl bg-[#050408] p-1 sm:p-2 text-white transition-all hover:bg-[#0a0712] hover:scale-105"
                  style={
                    today
                      ? {
                          backgroundColor: mood
                            ? moodColors[mood] || "#3617CE"
                            : "#3617CE",
                        }
                      : {}
                  }
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className="text-lg sm:text-2xl font-semibold">{day}</span>
                    {today && (
                      <span
                        className="mt-1 rounded px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.3)",
                          color: "#FFFFFF",
                        }}
                      >
                        TODAY
                      </span>
                    )}
                    {mood && !today && (
                      <div
                        className="mt-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full"
                        style={{
                          backgroundColor: moodColors[mood] || "#3617CE",
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

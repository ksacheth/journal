"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, LogOut } from "lucide-react";

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

const monthsFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const moodColors: Record<string, string> = {
  excellent: "#00FF80",
  good: "#B57EDC",
  neutral: "#EF9B0F",
  bad: "#FF9966",
  terrible: "#FF0080",
};

const moodEmojis: Record<string, string> = {
  excellent: "😄",
  good: "😊",
  neutral: "😐",
  bad: "😞",
  terrible: "😢",
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

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      router.push("/signin");
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
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

  const handleMonthChange = (direction: "prev" | "next") => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      if (currentMonth === 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    } else {
      if (currentMonth === 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    }

    const monthStr = String(newMonth + 1).padStart(2, "0");
    router.push(`/entry/${newYear}-${monthStr}`);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="bounce-in mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/entry")}
            className="smooth-transition flex items-center gap-2 rounded-xl border-2 border-accent bg-surface px-5 py-3 text-sm font-bold text-text-primary shadow-md hover:scale-105 hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:shadow-lg"
          >
            <CalendarDays className="h-5 w-5 text-accent" />
            All Months
          </button>
          
          <button
            onClick={handleSignOut}
            className="smooth-transition flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-surface px-5 py-3 text-sm font-bold text-text-primary shadow-md hover:scale-105 hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/20 hover:shadow-lg"
          >
            <LogOut className="h-5 w-5 text-primary" />
            Sign Out
          </button>
        </div>

        {/* Month Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => handleMonthChange("prev")}
            className="smooth-transition flex h-12 w-12 items-center justify-center rounded-xl border-2 border-secondary bg-surface text-secondary shadow-md hover:scale-110 hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-4xl font-bold text-transparent">
              {monthsFull[currentMonth]} {currentYear}
            </h1>
            <p className="mt-2 text-base font-medium text-text-secondary">
              <span className="inline-block rounded-full bg-gradient-to-r from-accent/20 to-primary/20 px-4 py-1">
                {entries.length} {entries.length === 1 ? "entry" : "entries"} 🎨
              </span>
            </p>
          </div>
          
          <button
            onClick={() => handleMonthChange("next")}
            className="smooth-transition flex h-12 w-12 items-center justify-center rounded-xl border-2 border-secondary bg-surface text-secondary shadow-md hover:scale-110 hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 hover:text-primary hover:shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border-2 border-primary/40 bg-primary/10 p-4 text-sm font-medium text-primary">
            {error}
          </div>
        )}

        {/* Calendar */}
        <div className="card-surface overflow-hidden p-6 sm:p-8">
          {/* Days of Week */}
          <div className="mb-6 grid grid-cols-7 gap-2">
            {daysOfWeek.map((day, i) => (
              <div
                key={day}
                className="text-center text-xs font-bold uppercase tracking-widest"
                style={{
                  color: moodColors[Object.keys(moodColors)[i % 5]],
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-lg font-bold text-transparent">Loading your colorful calendar... ✨</div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
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
                    className={`smooth-transition group relative aspect-square overflow-hidden rounded-xl border-2 p-2 ${
                      today
                        ? "pulse-glow border-primary bg-gradient-to-br from-primary/20 to-accent/20"
                        : mood
                        ? "border-border bg-surface hover:border-primary"
                        : "border-border/50 bg-surface/50 hover:border-accent"
                    } hover:scale-105 hover:shadow-lg`}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      <span
                        className={`text-base font-bold sm:text-lg ${
                          today
                            ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                            : mood
                            ? "text-text-primary"
                            : "text-text-tertiary"
                        }`}
                      >
                        {day}
                      </span>
                      {mood && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-lg">{moodEmojis[mood]}</span>
                        </div>
                      )}
                      {today && !mood && (
                        <div className="mt-1 text-xs font-bold text-primary">
                          Today
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <div
              key={mood}
              className="flex items-center gap-2 rounded-full border-2 px-4 py-2 shadow-sm"
              style={{
                borderColor: moodColors[mood],
                backgroundColor: `${moodColors[mood]}10`,
              }}
            >
              <span className="text-base">{emoji}</span>
              <span className="capitalize" style={{ color: moodColors[mood] }}>
                {mood}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

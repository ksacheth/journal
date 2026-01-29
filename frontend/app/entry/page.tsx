"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const months = [
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

export default function EntryPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear(),
  );

  const handleMonthClick = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    router.push(`/entry/${currentYear}-${monthStr}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="bounce-in mb-6 sm:mb-10 text-center">
          <div className="pulse-glow mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
            Select Month
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-lg font-medium text-text-secondary">
            Pick a month to view your journal entries
          </p>
        </div>

        {/* Year Selector */}
        <div className="mb-6 sm:mb-10 flex items-center justify-center gap-3 sm:gap-6">
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            className="smooth-transition flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-secondary/20 bg-surface text-secondary shadow-sm hover:scale-110 hover:border-primary hover:bg-primary hover:text-white"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <span className="min-w-[100px] sm:min-w-[140px] text-center text-2xl sm:text-4xl font-bold text-text-primary">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            className="smooth-transition flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-secondary/20 bg-surface text-secondary shadow-sm hover:scale-110 hover:border-primary hover:bg-primary hover:text-white"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {months.map((month, index) => {
            const isCurrentMonth =
              index === new Date().getMonth() &&
              currentYear === new Date().getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleMonthClick(index)}
                className={`smooth-transition group relative overflow-hidden rounded-xl border p-4 sm:p-8 text-center shadow-sm aspect-[3/2] sm:aspect-[4/3] ${
                  isCurrentMonth
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30 shadow-primary/20"
                    : "border-border bg-surface hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative z-10 flex h-full flex-col items-center justify-center">
                  <span
                    className={`text-base sm:text-xl font-bold ${isCurrentMonth ? "text-primary" : "text-text-primary group-hover:text-primary"} transition-colors`}
                  >
                    {month}
                  </span>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      isCurrentMonth
                        ? "bg-primary/20 text-primary"
                        : "bg-transparent text-transparent group-hover:bg-secondary/10 group-hover:text-text-tertiary"
                    }`}
                  >
                    {isCurrentMonth ? "Current" : "•"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              const now = new Date();
              const monthStr = String(now.getMonth() + 1).padStart(2, "0");
              router.push(`/entry/${now.getFullYear()}-${monthStr}`);
            }}
            className="smooth-transition inline-flex items-center gap-2 rounded-xl border border-secondary/20 bg-white px-8 py-4 text-base font-bold text-text-secondary shadow-sm hover:scale-105 hover:border-primary hover:text-primary hover:shadow-md"
          >
            <Calendar className="h-5 w-5" />
            Jump to Today
          </button>
        </div>
      </div>
    </div>
  );
}

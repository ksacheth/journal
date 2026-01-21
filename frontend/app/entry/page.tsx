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

const monthColors = [
  "from-primary to-accent",
  "from-accent to-secondary", 
  "from-secondary to-warning",
  "from-warning to-primary",
  "from-primary via-secondary to-accent",
  "from-accent via-warning to-secondary",
  "from-secondary to-primary",
  "from-warning to-accent",
  "from-primary to-secondary",
  "from-accent to-primary",
  "from-secondary via-accent to-warning",
  "from-warning via-primary to-secondary",
];

export default function EntryPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
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
          <div className="pulse-glow mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-transparent">
            Choose Your Month
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-lg font-medium text-text-secondary">
            Pick a month to explore your colorful memories 🌈
          </p>
        </div>

        {/* Year Selector */}
        <div className="mb-6 sm:mb-10 flex items-center justify-center gap-3 sm:gap-6">
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            className="smooth-transition flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border-2 border-accent bg-surface text-accent shadow-md hover:scale-110 hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:text-primary hover:shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <span className="min-w-[100px] sm:min-w-[140px] text-center text-2xl sm:text-4xl font-bold text-text-primary">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            className="smooth-transition flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border-2 border-accent bg-surface text-accent shadow-md hover:scale-110 hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:text-primary hover:shadow-lg"
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
                className={`smooth-transition group relative overflow-hidden rounded-2xl border-2 p-4 sm:p-8 text-center shadow-lg ${
                  isCurrentMonth
                    ? "border-primary pulse-glow"
                    : "border-border hover:border-primary"
                } card-hover bg-surface`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${monthColors[index]} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                <div className="relative z-10">
                  <span className="text-base sm:text-xl font-bold text-text-primary">
                    {month}
                  </span>
                  {isCurrentMonth && (
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                        Current ✨
                      </span>
                    </div>
                  )}
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
            className="smooth-transition inline-flex items-center gap-2 rounded-xl border-2 border-secondary bg-gradient-to-r from-secondary/10 to-warning/10 px-8 py-4 text-base font-bold text-text-primary shadow-lg hover:scale-105 hover:border-primary hover:from-primary/10 hover:to-accent/10 hover:shadow-xl"
          >
            <Calendar className="h-5 w-5 text-primary" />
            Jump to Today
          </button>
        </div>
      </div>
    </div>
  );
}

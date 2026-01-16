"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    new Date().getFullYear()
  );

  const handleMonthClick = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    router.push(`/entry/${currentYear}-${monthStr}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0C1B] p-4">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Select Month</h1>
          <button
            onClick={() =>
              router.push(
                `/entry/${currentYear}-${String(
                  new Date().getMonth() + 1
                ).padStart(2, "0")}`
              )
            }
            className="text-white/50 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Year Selector */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            className="text-white/50 hover:text-white transition-colors"
          >
            ←
          </button>
          <span className="text-xl font-semibold text-white">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            className="text-white/50 hover:text-white transition-colors"
          >
            →
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {months.map((month, index) => {
            const isCurrentMonth =
              index === new Date().getMonth() &&
              currentYear === new Date().getFullYear();

            return (
              <button
                key={index}
                onClick={() => handleMonthClick(index)}
                className="h-20 rounded-2xl p-3 text-center transition-all hover:scale-105"
                style={
                  isCurrentMonth
                    ? {
                        backgroundColor: "#3617CE",
                        color: "#FFFFFF",
                      }
                    : {
                        backgroundColor: "#050408",
                        color: "rgba(255, 255, 255, 0.7)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isCurrentMonth) {
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.backgroundColor = "#0a0712";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentMonth) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                    e.currentTarget.style.backgroundColor = "#050408";
                  }
                }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <span className="text-sm font-semibold">{month}</span>
                  <div className="h-5">
                    {isCurrentMonth && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: "#6D4DFF",
                          color: "#0E0C1B",
                        }}
                      >
                        CURRENT
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

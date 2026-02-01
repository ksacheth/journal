/**
 * Shared constants for the journal application
 */

// Month names (0-indexed to match JavaScript Date.getMonth())
export const MONTHS_FULL = [
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
] as const;

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const DAYS_OF_WEEK_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Mood definitions - single source of truth
export const MOODS = {
  excellent: {
    emoji: "😄",
    label: "Great",
    color: "#00FF80",
  },
  good: {
    emoji: "😊",
    label: "Good",
    color: "#B57EDC",
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    color: "#EF9B0F",
  },
  bad: {
    emoji: "😞",
    label: "Sad",
    color: "#FF9966",
  },
  terrible: {
    emoji: "😢",
    label: "Very sad",
    color: "#FF0080",
  },
} as const;

export type MoodType = keyof typeof MOODS;

// Mood values for use in validators and forms
export const MOOD_VALUES = Object.keys(MOODS) as MoodType[];

// Helper functions for mood data
export const getMoodColor = (mood: string): string => {
  return MOODS[mood as MoodType]?.color ?? "#64748b";
};

export const getMoodEmoji = (mood: string): string => {
  return MOODS[mood as MoodType]?.emoji ?? "😐";
};

export const getMoodLabel = (mood: string): string => {
  return MOODS[mood as MoodType]?.label ?? "Unknown";
};

// Derived objects for backward compatibility
export const MOOD_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(MOODS).map(([key, value]) => [key, value.color])
);

export const MOOD_EMOJIS: Record<string, string> = Object.fromEntries(
  Object.entries(MOODS).map(([key, value]) => [key, value.emoji])
);

// App theme color (single source of truth)
export const THEME_COLOR = "#8B5CF6";

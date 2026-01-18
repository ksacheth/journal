"use client";

import { useState, useEffect } from "react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    date: Date;
    mood: string;
    text: string;
    tags: string[];
    todos: Todo[];
  }) => void;
  initialDate?: Date;
  initialEntry?: {
    mood: string;
    text: string;
    tags: string[];
    todos: Todo[];
  };
  errorMessage?: string;
}

const moods = [
  { emoji: "😢", value: "terrible", label: "Very sad" },
  { emoji: "😞", value: "bad", label: "Sad" },
  { emoji: "😐", value: "neutral", label: "Neutral" },
  { emoji: "😊", value: "good", label: "Happy" },
  { emoji: "😄", value: "excellent", label: "Very happy" },
];

export default function JournalEntryModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialEntry,
  errorMessage,
}: JournalEntryModalProps) {
  const [selectedMood, setSelectedMood] = useState<string>(
    initialEntry?.mood || "good"
  );
  const [text, setText] = useState<string>(initialEntry?.text || "");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [newTag, setNewTag] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>(initialEntry?.todos || []);
  const [newTodo, setNewTodo] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentDate] = useState<Date>(
    initialDate || new Date()
  );
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date, time: Date) => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];
    const dayOfWeek = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${dayOfWeek}, ${month} ${day}, ${year} • ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      handleAddTag();
    }
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
      };
      setTodos([...todos, todo]);
      setNewTodo("");
    }
  };

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleTodoKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTodo.trim()) {
      handleAddTodo();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        date: currentDate,
        mood: selectedMood,
        text: text,
        tags: tags,
        todos: todos,
      });
      // Reset form
      setText("");
      setTags([]);
      setTodos([]);
      setSelectedMood("good");
      setIsSaving(false);
      onClose();
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving entry:", error);
    }
  };

  const handleDiscard = () => {
    setText("");
    setTags([]);
    setTodos([]);
    setSelectedMood("good");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl sm:p-8">
          {/* Header - Centered */}
          <div
            className="mb-6 text-center text-sm font-medium text-primary"
          >
            {formatDate(currentDate, currentTime)}
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {/* Mood Selector */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl sm:text-2xl transition-all duration-200 ${
                  selectedMood === mood.value
                    ? "scale-110 grayscale-0"
                    : "grayscale hover:grayscale-0 hover:scale-105 opacity-70"
                }`}
                aria-label={mood.label}
              >
                <span
                  style={
                    selectedMood === mood.value
                      ? {
                          filter: `drop-shadow(0 0 8px var(--color-primary)) drop-shadow(0 0 12px var(--color-primary))`,
                          textShadow: "0 0 8px var(--color-primary), 0 0 12px var(--color-primary)",
                        }
                      : {}
                  }
                >
                  {mood.emoji}
                </span>
              </button>
            ))}
          </div>

                    {/* Text Input Area */}
                    <div className="mb-6">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind today?"
                        className="w-full resize-none rounded-lg bg-surface p-4 text-base sm:text-sm text-white focus:outline-none focus:ring-2 h-40 sm:h-60 focus:ring-primary focus:border-primary"
                        style={
                          {
                            "--tw-placeholder-opacity": "0.5",
                          } as React.CSSProperties & { "--tw-placeholder-opacity": string }
                        }
                      />
                    </div>
          
                    {/* Todos Section */}
                    <div className="mb-6">
                      <div className="space-y-2">
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center gap-3 rounded-lg bg-surface p-3"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTodo(todo.id)}
                              className="flex h-5 w-5 items-center justify-center rounded-full border-2 bg-transparent transition-all hover:opacity-80 border-primary"
                              aria-label={`Toggle todo ${todo.text}`}
                            >
                              {todo.completed && (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M2 6L5 9L10 2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-primary"
                                  />
                                </svg>
                              )}
                            </button>
                            <span
                              className={`flex-1 text-sm text-white ${
                                todo.completed ? "line-through opacity-50" : ""
                              }`}
                              style={todo.completed ? { color: "var(--color-primary)" } : {}}
                            >
                              {todo.text}
                            </span>
                            <button
                              onClick={() => handleRemoveTodo(todo.id)}
                              className="hover:opacity-80 transition-opacity text-primary"
                              aria-label={`Remove todo ${todo.text}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={newTodo}
                          onChange={(e) => setNewTodo(e.target.value)}
                          onKeyPress={handleTodoKeyPress}
                          placeholder="Add a todo..."
                          className="w-full rounded-lg bg-surface px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          style={
                            {
                              "--tw-placeholder-opacity": "0.5",
                            } as React.CSSProperties & {
                              "--tw-placeholder-opacity": string;
                            }
                          }
                        />
                      </div>
                    </div>
          
                    {/* Tagging Section */}
                    <div className="mb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-primary">#</span>
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-primary"
                            style={{
                              backgroundColor: "rgba(54, 23, 206, 0.3)",
                            }}
                          >
                            #{tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:opacity-80 transition-opacity text-primary"
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add tag..."
                          className="flex-1 rounded-lg bg-surface px-3 py-1 text-base sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          style={
                            {
                              "--tw-placeholder-opacity": "0.5",
                            } as React.CSSProperties & {
                              "--tw-placeholder-opacity": string;
                            }
                          }
                        />
                      </div>
                    </div>
        {/* Status and Actions */}
        <div
          className="flex items-center justify-between border-t pt-6 border-primary/30"
        >
          <div
            className="flex items-center gap-2 text-sm text-primary"
          >
            {isSaving && (
              <>
                <div
                  className="h-2 w-2 animate-pulse rounded-full bg-primary"
                ></div>
                <span>Saving to cloud...</span>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleDiscard}
              className="px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity text-primary"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-primary hover:bg-primary/80"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

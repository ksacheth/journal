"use client";

import { useState, useEffect } from "react";
import { X, Hash, Plus, Check, Sparkles } from "lucide-react";

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
  { emoji: "😢", value: "terrible", label: "Very sad", color: "#FF0080" },
  { emoji: "😞", value: "bad", label: "Sad", color: "#FF9966" },
  { emoji: "😐", value: "neutral", label: "Neutral", color: "#EF9B0F" },
  { emoji: "😊", value: "good", label: "Happy", color: "#B57EDC" },
  { emoji: "😄", value: "excellent", label: "Very happy", color: "#00FF80" },
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
  const [currentDate] = useState<Date>(initialDate || new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date, time: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
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

  const selectedMoodColor = moods.find(m => m.value === selectedMood)?.color || "#B57EDC";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 backdrop-blur-md"
          onClick={handleDiscard}
        />

        {/* Modal */}
        <div className="glass-effect bounce-in relative w-full max-w-3xl rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleDiscard}
            className="smooth-transition absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-primary/30 bg-surface text-primary hover:scale-110 hover:border-primary hover:bg-primary hover:text-white hover:rotate-90"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-base font-bold uppercase tracking-wider text-transparent">
                {formatDate(currentDate, currentTime)}
              </h2>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border-2 border-primary/40 bg-primary/10 p-4 text-sm font-medium text-primary">
              {errorMessage}
            </div>
          )}

          {/* Mood Selector */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`smooth-transition flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-4xl ${
                  selectedMood === mood.value
                    ? "scale-125 shadow-xl"
                    : "opacity-50 hover:scale-110 hover:opacity-100"
                }`}
                style={{
                  borderColor: selectedMood === mood.value ? mood.color : 'transparent',
                  backgroundColor: selectedMood === mood.value ? `${mood.color}20` : 'transparent',
                  boxShadow: selectedMood === mood.value ? `0 0 30px ${mood.color}40` : 'none',
                }}
                aria-label={mood.label}
              >
                {mood.emoji}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pour your heart out... ✨"
              className="w-full resize-none rounded-2xl border-2 border-border bg-surface p-6 text-base font-medium text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/20 h-56"
              style={{
                borderColor: selectedMoodColor + '40',
              }}
            />
          </div>

          {/* Todos */}
          {todos.length > 0 && (
            <div className="mb-6 space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="smooth-transition flex items-center gap-3 rounded-xl border-2 border-accent/20 bg-surface p-4 hover:border-accent/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    className={`smooth-transition flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                      todo.completed
                        ? "border-success bg-success"
                        : "border-accent bg-transparent hover:border-success"
                    }`}
                  >
                    {todo.completed && <Check className="h-4 w-4 text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm font-medium ${
                      todo.completed
                        ? "text-text-tertiary line-through"
                        : "text-text-primary"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => handleRemoveTodo(todo.id)}
                    className="smooth-transition text-text-tertiary hover:scale-110 hover:text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleTodoKeyPress}
                placeholder="Add a task... ✓"
                className="flex-1 rounded-xl border-2 border-secondary/30 bg-surface px-4 py-3 text-sm font-medium text-text-primary placeholder-text-tertiary focus:border-secondary focus:outline-hidden focus:ring-4 focus:ring-secondary/20"
              />
              <button
                onClick={handleAddTodo}
                className="smooth-transition flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-secondary bg-gradient-to-br from-secondary to-warning text-white hover:scale-110 hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Hash className="h-5 w-5 text-accent" />
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="smooth-transition flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold shadow-sm hover:scale-105"
                  style={{
                    borderColor: moods[i % moods.length].color,
                    backgroundColor: `${moods[i % moods.length].color}15`,
                    color: moods[i % moods.length].color,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:scale-125"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a colorful tag... 🏷️"
                className="min-w-[180px] flex-1 rounded-xl border-2 border-accent/30 bg-surface px-4 py-2 text-sm font-medium text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-hidden focus:ring-4 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t-2 border-border pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-text-tertiary">
              {isSaving && (
                <>
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                  <span>Saving your colorful memories...</span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                className="smooth-transition rounded-xl border-2 border-border bg-surface px-6 py-3 text-sm font-bold text-text-secondary hover:scale-105 hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="smooth-transition rounded-xl bg-gradient-to-r from-primary via-accent to-secondary px-8 py-3 text-sm font-bold text-white shadow-lg hover:scale-105 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save Entry ✨
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

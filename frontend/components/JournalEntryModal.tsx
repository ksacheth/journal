"use client";

import { useState, useEffect } from "react";
import { X, Hash, Plus, Check, Sparkles, GripVertical } from "lucide-react";

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
  { emoji: "😢", value: "terrible", label: "Very sad", color: "#ef4444" }, // Red
  { emoji: "😞", value: "bad", label: "Sad", color: "#f97316" }, // Orange
  { emoji: "😐", value: "neutral", label: "Neutral", color: "#64748b" }, // Slate
  { emoji: "😊", value: "good", label: "Good", color: "#3b82f6" }, // Blue
  { emoji: "😄", value: "excellent", label: "Great", color: "#10b981" }, // Emerald
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
    initialEntry?.mood || "good",
  );
  const [text, setText] = useState<string>(initialEntry?.text || "");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [newTag, setNewTag] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>(initialEntry?.todos || []);
  const [newTodo, setNewTodo] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentDate] = useState<Date>(initialDate || new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);

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
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const handleTodoKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTodo.trim()) {
      handleAddTodo();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodoId(todoId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", todoId);
  };

  const handleDragOver = (e: React.DragEvent, todoId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedTodoId !== todoId) {
      setDragOverTodoId(todoId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTodoId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTodoId: string) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetTodoId) {
      setDraggedTodoId(null);
      setDragOverTodoId(null);
      return;
    }

    const sourceIndex = todos.findIndex((t) => t.id === draggedTodoId);
    const targetIndex = todos.findIndex((t) => t.id === targetTodoId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedTodoId(null);
      setDragOverTodoId(null);
      return;
    }

    const newTodos = [...todos];
    const [movedTodo] = newTodos.splice(sourceIndex, 1);
    newTodos.splice(targetIndex, 0, movedTodo);
    setTodos(newTodos);
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
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
      // Don't clear state here - component will unmount on navigation
      // Clearing causes a flash of empty content before the route changes
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    // Don't clear state here - component will unmount on navigation
    // Clearing causes a flash of empty content before the route changes
    onClose();
  };

  if (!isOpen) return null;

  const selectedMoodColor =
    moods.find((m) => m.value === selectedMood)?.color || "#818cf8";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
          onClick={handleDiscard}
        />

        {/* Modal */}
        <div className="glass-effect bounce-in relative w-full max-w-3xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl bg-white/95">
          {/* Close Button - Saves and exits */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="smooth-transition absolute right-3 top-3 sm:right-6 sm:top-6 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-secondary/20 bg-surface text-secondary hover:scale-110 hover:border-primary hover:bg-primary hover:text-white hover:rotate-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Header */}
          <div className="mb-4 sm:mb-8 text-center">
            <div className="mb-2 sm:mb-4 flex items-center justify-center gap-1 sm:gap-2">
              <Sparkles className="h-3 w-3 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-secondary text-xs sm:text-base font-bold uppercase tracking-wider">
                {formatDate(currentDate, currentTime)}
              </h2>
              <Sparkles className="h-3 w-3 sm:h-5 sm:w-5 text-accent" />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Mood Selector */}
          <div className="mb-4 sm:mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`smooth-transition flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border-2 text-2xl sm:text-4xl ${
                  selectedMood === mood.value
                    ? "scale-125 shadow-xl"
                    : "opacity-50 hover:scale-110 hover:opacity-100 grayscale hover:grayscale-0"
                }`}
                style={{
                  borderColor:
                    selectedMood === mood.value ? mood.color : "transparent",
                  backgroundColor:
                    selectedMood === mood.value
                      ? `${mood.color}15`
                      : "transparent",
                  boxShadow:
                    selectedMood === mood.value
                      ? `0 0 20px ${mood.color}30`
                      : "none",
                }}
                aria-label={mood.label}
              >
                {mood.emoji}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div className="mb-4 sm:mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How were your days... ✨"
              className="w-full resize-none rounded-xl sm:rounded-2xl border border-border bg-surface p-4 sm:p-6 text-sm sm:text-base font-medium text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/10 h-32 sm:h-56 transition-all duration-300"
              style={{
                borderColor: selectedMoodColor + "60",
              }}
            />
          </div>

          {/* Todos */}
          {todos.length > 0 && (
            <div className="mb-4 sm:mb-6 space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragOver={(e) => handleDragOver(e, todo.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  className={`smooth-transition flex items-center gap-2 sm:gap-3 rounded-xl border bg-surface p-3 sm:p-4 cursor-move ${
                    draggedTodoId === todo.id
                      ? "opacity-50 border-dashed border-primary"
                      : dragOverTodoId === todo.id
                        ? "border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                        : "border-border hover:border-accent/40 hover:shadow-sm"
                  }`}
                >
                  {/* Drag handle */}
                  <div className="text-text-tertiary cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    className={`smooth-transition flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                      todo.completed
                        ? "border-success bg-success text-white"
                        : "border-secondary/40 bg-transparent hover:border-success"
                    }`}
                  >
                    {todo.completed && <Check className="h-3.5 w-3.5" />}
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
                    className="smooth-transition text-text-tertiary hover:scale-110 hover:text-error"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleTodoKeyPress}
                placeholder="Add a task... ✓"
                className="flex-1 rounded-xl border border-border bg-surface px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-text-primary placeholder-text-tertiary focus:border-secondary focus:outline-hidden focus:ring-4 focus:ring-secondary/10"
              />
              <button
                onClick={handleAddTodo}
                className="smooth-transition flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-white hover:scale-110 hover:bg-secondary-hover shadow-md"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="smooth-transition flex items-center gap-1 sm:gap-2 rounded-full border px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold shadow-sm hover:scale-105 bg-surface"
                  style={{
                    borderColor: moods[i % moods.length].color,
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
                placeholder="Add tags... 🏷️"
                className="min-w-[120px] sm:min-w-[180px] flex-1 rounded-xl border border-dashed border-secondary/30 bg-transparent px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-hidden focus:ring-4 focus:ring-accent/10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border-t border-border pt-4 sm:pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-text-tertiary">
              {isSaving && (
                <>
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                  <span>Saving...</span>
                </>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleDiscard}
                className="smooth-transition flex-1 sm:flex-initial rounded-xl border border-border bg-surface px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-bold text-text-secondary hover:scale-105 hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="smooth-transition flex-1 sm:flex-initial rounded-xl bg-primary px-4 sm:px-8 py-2.5 sm:py-3 text-sm font-bold text-white shadow-lg hover:scale-105 hover:bg-primary-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

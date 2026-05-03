export type TaskCategory = "study" | "health" | "social" | "personal" | "general";

export interface Task {
  id: string;
  _id?: string;
  title: string;
  category: TaskCategory;
  time?: string;
  deadline?: string;
  done?: boolean;
  completed?: boolean;
  emoji?: string;
  reminderAt?: string;
}

export const CATEGORY_STYLES: Record<
  TaskCategory,
  { label: string; chip: string; tint: string; emoji: string }
> = {
  study:    { label: "Study",    chip: "bg-lavender/30 text-lavender border border-lavender/40",       tint: "bg-lavender/20", emoji: "📚" },
  health:   { label: "Health",   chip: "bg-mint/30 text-mint border border-mint/40",                   tint: "bg-mint/20",     emoji: "💪" },
  social:   { label: "Social",   chip: "bg-pink/30 text-pink border border-pink/40",                   tint: "bg-pink/20",     emoji: "🫶" },
  personal: { label: "Personal", chip: "bg-butter/30 text-butter border border-butter/40",             tint: "bg-butter/20",   emoji: "🌱" },
  general:  { label: "General",  chip: "bg-sky/30 text-sky border border-sky/40",                      tint: "bg-sky/20",      emoji: "📝" },
};

export const TASKS_SEED: Task[] = [
  { id: "t1", title: "Finish DBMS chapter 4 notes", category: "study",    time: "10:00 AM", emoji: "📚", done: false, reminderAt: "" },
  { id: "t2", title: "Morning yoga & water 💧",       category: "health",   time: "07:30 AM", emoji: "💪", done: true,  reminderAt: "" },
  { id: "t3", title: "Call grandma 💌",               category: "social",   time: "06:00 PM", emoji: "🫶", done: false, reminderAt: "" },
  { id: "t4", title: "Journal 3 wins of the day",    category: "personal", time: "09:30 PM", emoji: "🌱", done: false, reminderAt: "" },
  { id: "t5", title: "Solve 2 LeetCode mediums",     category: "study",    time: "04:00 PM", emoji: "📚", done: false, reminderAt: "" },
  { id: "t6", title: "Reply to mentor email",        category: "general",  time: "Anytime",  emoji: "📝", done: true,  reminderAt: "" },
];

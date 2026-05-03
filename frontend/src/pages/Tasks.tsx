import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Bell, Pencil, Trash2, X, Clock } from "lucide-react";
import { CATEGORY_STYLES, TASKS_SEED, type Task, type TaskCategory } from "@/lib/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { socket } from "@/socket";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, isPast } from "date-fns";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "done", label: "Done" },
  { key: "today", label: "Today" },
] as const;

type Filter = typeof FILTERS[number]["key"];

const STORAGE_KEY = "dreamline:tasks";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return TASKS_SEED;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<TaskCategory>("study");
  const [draftReminder, setDraftReminder] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Task>>({});

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Local reminder ticker (every 30s) — fires browser + toast notification when due
  useEffect(() => {
    const fired = new Set<string>();
    const tick = () => {
      const now = Date.now();
      tasks.forEach((t) => {
        if (!t.reminderAt || t.done || t.completed) return;
        const at = new Date(t.reminderAt).getTime();
        const id = (t._id || t.id) + "@" + at;
        if (at <= now && at > now - 60_000 && !fired.has(id)) {
          fired.add(id);
          toast({ title: "⏰ Reminder", description: t.title });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Dreamline reminder", { body: t.title, icon: "/favicon.ico" });
          }
        }
      });
    };
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, [tasks]);

  // Socket: server-side cron reminders + sync
  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onReminder = (r: any) => {
      toast({ title: "⏰ Reminder", description: r.message || r.title });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Dreamline reminder", { body: r.message || r.title });
      }
    };
    socket.on("task-reminder", onReminder);
    return () => { socket.off("task-reminder", onReminder); };
  }, []);

  const done = tasks.filter((t) => t.done || t.completed).length;
  const total = tasks.length;
  const remaining = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const visible = useMemo(() => {
    const today = new Date();
    return tasks.filter((t) => {
      if (filter === "todo") return !(t.done || t.completed);
      if (filter === "done") return t.done || t.completed;
      if (filter === "today") {
        if (!t.reminderAt) return false;
        const d = new Date(t.reminderAt);
        return d.toDateString() === today.toDateString();
      }
      return true;
    });
  }, [tasks, filter]);

  const toggle = (id: string) =>
    setTasks((ts) =>
      ts.map((t) => {
        if ((t._id || t.id) !== id) return t;
        const next = !(t.done || t.completed);
        socket.emit("update-task", { taskId: id, completed: next });
        return { ...t, done: next, completed: next };
      })
    );

  const add = () => {
    if (!draft.trim()) return;
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: draft.trim(),
      category: draftCat,
      time: draftReminder ? format(new Date(draftReminder), "MMM d, h:mm a") : "Anytime",
      done: false,
      emoji: CATEGORY_STYLES[draftCat].emoji,
      reminderAt: draftReminder || undefined,
    };
    setTasks((ts) => [newTask, ...ts]);
    socket.emit("create-task", {
      userId: localStorage.getItem("dreamline:name") || "me",
      title: newTask.title,
      deadline: newTask.reminderAt,
    });
    setDraft("");
    setDraftReminder("");
    toast({ title: "Quest added ✨", description: newTask.title });
  };

  const remove = (id: string) => {
    setTasks((ts) => ts.filter((t) => (t._id || t.id) !== id));
    toast({ title: "Quest removed" });
  };

  const startEdit = (t: Task) => {
    setEditingId(t._id || t.id);
    setEditDraft({ title: t.title, category: t.category, reminderAt: t.reminderAt });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setTasks((ts) =>
      ts.map((t) => {
        if ((t._id || t.id) !== editingId) return t;
        const cat = (editDraft.category as TaskCategory) || t.category;
        return {
          ...t,
          title: editDraft.title?.trim() || t.title,
          category: cat,
          emoji: CATEGORY_STYLES[cat].emoji,
          reminderAt: editDraft.reminderAt || undefined,
          time: editDraft.reminderAt ? format(new Date(editDraft.reminderAt), "MMM d, h:mm a") : t.time,
        };
      })
    );
    setEditingId(null);
    setEditDraft({});
    toast({ title: "Quest updated 💫" });
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="glass relative overflow-hidden rounded-5xl p-6 sm:p-8">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-gradient-aurora opacity-50 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              daily quests
            </span>
            <h1 className="mt-3 font-display text-6xl font-bold sm:text-7xl">
              {remaining === 0 ? "All clear ✨" : <>{remaining} left to <span className="text-gradient">crush.</span></>}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {done} done · {remaining} remaining · {pct}% of today
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex items-baseline gap-1.5 font-display text-7xl font-bold text-gradient">
              {pct}<span className="text-2xl text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div className="relative mt-6 h-3 w-full overflow-hidden rounded-full bg-muted/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-primary shadow-glow"
          />
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: total, tint: "bg-lavender/20 text-lavender border-lavender/40" },
            { label: "Done", value: done, tint: "bg-mint/20 text-mint border-mint/40" },
            { label: "Left", value: remaining, tint: "bg-pink/20 text-pink border-pink/40" },
            { label: "Streak", value: "12d", tint: "bg-butter/20 text-butter border-butter/40" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.tint}`}>
              <div className="font-display text-4xl font-bold leading-none">{s.value}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add new */}
      <section className="glass rounded-4xl p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Plus className="h-3.5 w-3.5 text-primary" /> new quest
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a tiny quest…"
            className="h-12 rounded-2xl border-border/70 bg-card/60 text-base"
          />
          <select
            value={draftCat}
            onChange={(e) => setDraftCat(e.target.value as TaskCategory)}
            className="h-12 rounded-2xl border border-border bg-card/60 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(Object.keys(CATEGORY_STYLES) as TaskCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_STYLES[c].emoji} {CATEGORY_STYLES[c].label}</option>
            ))}
          </select>
          <div className="relative">
            <Bell className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="datetime-local"
              value={draftReminder}
              onChange={(e) => setDraftReminder(e.target.value)}
              className="h-12 rounded-2xl border border-border bg-card/60 pl-9 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={add}
            className="h-12 rounded-2xl bg-gradient-primary px-6 font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="mb-4 flex items-center gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                filter === f.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === f.key && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 -z-0 rounded-full bg-gradient-primary shadow-pop" />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((t) => {
              const id = t._id || t.id;
              const style = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.general;
              const isDone = t.done || t.completed;
              const overdue = t.reminderAt && isPast(new Date(t.reminderAt)) && !isDone;
              const isEditing = editingId === id;

              return (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25 }}
                  className={`glass rounded-3xl p-4 transition-all ${overdue ? "ring-1 ring-destructive/40" : ""}`}
                >
                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto_auto_auto]">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-xl shadow-glow">
                        {CATEGORY_STYLES[(editDraft.category as TaskCategory) || t.category].emoji}
                      </span>
                      <Input
                        value={editDraft.title || ""}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        className="h-11 rounded-2xl bg-card/60"
                      />
                      <select
                        value={editDraft.category as string}
                        onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as TaskCategory })}
                        className="h-11 rounded-2xl border border-border bg-card/60 px-3 text-sm font-bold"
                      >
                        {(Object.keys(CATEGORY_STYLES) as TaskCategory[]).map((c) => (
                          <option key={c} value={c}>{CATEGORY_STYLES[c].label}</option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={editDraft.reminderAt ? new Date(editDraft.reminderAt).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setEditDraft({ ...editDraft, reminderAt: e.target.value })}
                        className="h-11 rounded-2xl border border-border bg-card/60 px-3 text-sm"
                      />
                      <Button onClick={saveEdit} className="h-11 rounded-2xl bg-gradient-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)} className="h-11 rounded-2xl">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggle(id)}
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-all ${
                          isDone ? "border-primary bg-gradient-primary text-primary-foreground shadow-pop" : "border-border hover:border-primary"
                        }`}
                      >
                        {isDone && <Check className="h-5 w-5" />}
                      </button>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-xl shadow-glow">
                        {t.emoji || style.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold ${isDone ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-wider ${style.chip}`}>
                            {style.label}
                          </span>
                          {t.reminderAt ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${overdue ? "bg-destructive/20 text-destructive" : "bg-muted/40"}`}>
                              <Clock className="h-3 w-3" />
                              {overdue ? "overdue · " : ""}
                              {formatDistanceToNow(new Date(t.reminderAt), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 font-semibold">
                              <Clock className="h-3 w-3" /> {t.time || "Anytime"}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(t)}
                        className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(id)}
                        className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {visible.length === 0 && (
            <li className="glass rounded-3xl p-10 text-center text-muted-foreground">
              Nothing here. Add a quest to begin ✨
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

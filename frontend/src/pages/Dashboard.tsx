import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Sparkles, MessageCircle, Video, Plus, Moon } from "lucide-react";
import StreakRing from "@/components/StreakRing";
import { CATEGORY_STYLES, TASKS_SEED, type Task } from "@/lib/mock";
import { socket } from "@/socket";
import { toast } from "@/hooks/use-toast";

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(TASKS_SEED);
  const username = typeof window !== "undefined" ? localStorage.getItem("dreamline:name") || "friend" : "friend";

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onNew = (t: any) => setTasks((prev) => [{ ...t, id: t.taskId || t._id || `t${Date.now()}`, category: t.category || "general" }, ...prev]);
    const onUpdated = ({ taskId, completed }: any) =>
      setTasks((prev) => prev.map((t) => (t.id === taskId || t._id === taskId ? { ...t, done: completed, completed } : t)));
    const onReminder = (r: any) =>
      toast({ title: "⏰ Reminder", description: r.message || `Don't forget: ${r.title}` });

    socket.on("new-task", onNew);
    socket.on("task-updated", onUpdated);
    socket.on("task-reminder", onReminder);
    return () => {
      socket.off("new-task", onNew);
      socket.off("task-updated", onUpdated);
      socket.off("task-reminder", onReminder);
    };
  }, []);

  const done = useMemo(() => tasks.filter((t) => t.done || t.completed).length, [tasks]);

  const toggleTask = (t: Task) => {
    const id = t._id || t.id;
    setTasks((prev) => prev.map((x) => ((x._id || x.id) === id ? { ...x, done: !(x.done || x.completed), completed: !(x.done || x.completed) } : x)));
    socket.emit("update-task", { taskId: id, completed: !(t.done || t.completed) });
  };

  const startRoom = () => {
    socket.connect();
    socket.emit("create-room", { username });
    socket.once("room-created", ({ roomId }: any) => {
      navigate(`/call?roomId=${roomId}`);
    });
    // local fallback so it works without backend
    setTimeout(() => {
      const fallback = Math.random().toString(36).slice(2, 10);
      navigate(`/call?roomId=${fallback}`);
    }, 1200);
  };

  const friends = [
    { name: "Aanya", emoji: "🌷", status: "Studying DSA", color: "bg-pink/30" },
    { name: "Kabir", emoji: "🎧", status: "Deep work", color: "bg-lavender/30" },
    { name: "Mira", emoji: "☕", status: "On break", color: "bg-butter/30" },
    { name: "Riya", emoji: "📖", status: "Reading", color: "bg-mint/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass relative overflow-hidden rounded-5xl p-8 lg:col-span-2"
        >
          <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-gradient-aurora opacity-50 blur-3xl" />
          <span className="relative inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            today's diary
          </span>
          <h1 className="relative mt-3 font-display text-6xl font-bold leading-[0.95] sm:text-7xl">
            {greet()}, <span className="text-gradient">{username}.</span>
          </h1>
          <p className="relative mt-3 max-w-lg text-muted-foreground">
            You're {done}/{tasks.length} tasks in. Tiny wins stack into beautiful weeks — keep going. 🌷
          </p>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/tasks"
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
            >
              View all quests <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={startRoom}
              className="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-sm font-bold hover:-translate-y-0.5 transition-all"
            >
              <Video className="h-4 w-4" /> Start a room
            </button>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-butter/30 px-3 py-1.5 text-sm font-bold text-butter border border-butter/40">
              <Flame className="h-4 w-4" /> 12 day streak
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass flex flex-col items-center justify-center gap-3 rounded-5xl p-6"
        >
          <StreakRing done={done} total={tasks.length} />
          <p className="text-center text-sm text-muted-foreground">
            {done === tasks.length ? "All done — go celebrate! 🎉" : `${tasks.length - done} more to crush today.`}
          </p>
        </motion.div>
      </section>

      {/* Quests */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold">Floating quests</h2>
            <p className="text-sm text-muted-foreground">Tap a card to mark it done.</p>
          </div>
          <Link to="/tasks" className="text-sm font-bold text-primary hover:underline">See all →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.slice(0, 6).map((t, i) => {
            const style = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.general;
            const isDone = t.done || t.completed;
            return (
              <motion.button
                key={t._id || t.id}
                onClick={() => toggleTask(t)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative overflow-hidden rounded-4xl p-5 text-left transition-all glass ${isDone ? "opacity-70" : ""}`}
              >
                <div className={`absolute -top-12 -right-10 h-32 w-32 rounded-full ${style.tint} blur-2xl`} />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-2xl shadow-glow">
                    {t.emoji || style.emoji}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${style.chip}`}>
                    {style.label}
                  </span>
                </div>
                <h3 className={`relative mt-4 text-lg font-bold leading-snug ${isDone ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </h3>
                <div className="relative mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>⏰ {t.time || "Anytime"}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${isDone ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {isDone ? "✓" : ""}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Friends + mood */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass rounded-5xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold">Friends online</h2>
            <Link to="/chat" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Open chat <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {friends.map((f) => (
              <motion.div
                key={f.name}
                whileHover={{ y: -4 }}
                className="rounded-3xl glass p-4 text-center cursor-pointer"
              >
                <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${f.color} text-2xl`}>{f.emoji}</div>
                <div className="mt-2 font-bold">{f.name}</div>
                <div className="text-[11px] text-muted-foreground">{f.status}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-mint">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" /> online
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass rounded-5xl p-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Moon className="h-3.5 w-3.5 text-primary" /> mood today
          </div>
          <div className="font-display text-4xl font-bold">How are you feeling?</div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {["😴", "🥲", "😌", "😊", "🤩"].map((e) => (
              <button key={e} className="aspect-square rounded-2xl bg-muted/40 text-3xl transition-all hover:bg-gradient-primary hover:scale-110">
                {e}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/tasks")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-pop"
          >
            <Plus className="h-4 w-4" /> Add today's quest
          </button>
        </div>
      </section>
    </div>
  );
}

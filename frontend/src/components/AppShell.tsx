import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ListChecks, MessageCircle, Video, BookHeart, Sparkles } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/call", label: "Webinar", icon: Video },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      {/* Dreamy background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="blob -top-40 -left-32 h-[36rem] w-[36rem] bg-primary/30 animate-blob" />
        <div className="blob top-1/3 -right-40 h-[32rem] w-[32rem] bg-secondary/25 animate-blob" style={{ animationDelay: "3s" }} />
        <div className="blob -bottom-40 left-1/3 h-[30rem] w-[30rem] bg-accent/20 animate-blob" style={{ animationDelay: "6s" }} />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 p-4 sm:p-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-col rounded-4xl glass p-5 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <BookHeart className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <div className="font-display text-2xl font-bold leading-none">Dreamline</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">study together</div>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-1.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-0 rounded-2xl bg-gradient-primary shadow-pop"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4.5 w-4.5" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl bg-gradient-aurora p-4 text-primary-foreground shadow-glow">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> Pro tip
            </div>
            <p className="mt-2 font-display text-2xl leading-tight">
              Tiny wins stack into beautiful weeks ✨
            </p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 inset-x-0 z-30 glass-strong px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <BookHeart className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-bold">Dreamline</span>
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0 pt-16 lg:pt-0" key={location.pathname}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 glass-strong rounded-3xl p-2 flex justify-around">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isActive ? "bg-gradient-primary text-primary-foreground shadow-pop" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </main>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Sparkles, BookHeart, ArrowRight, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (name) localStorage.setItem("dreamline:name", name);
      toast({
        title: mode === "signin" ? "Welcome back ✨" : "Your diary is ready 📔",
        description: "Opening your dreamy dashboard…",
      });
      navigate("/");
    }, 600);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob -top-32 -left-24 h-[30rem] w-[30rem] bg-primary/40 animate-blob" />
        <div className="blob top-1/3 -right-24 h-[28rem] w-[28rem] bg-secondary/40 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="blob -bottom-32 left-1/3 h-[26rem] w-[26rem] bg-accent/30 animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <BookHeart className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-3xl font-bold">Dreamline</span>
        </a>
        <nav className="hidden gap-6 text-sm font-semibold text-muted-foreground sm:flex">
          <a href="#" className="hover:text-foreground">Features</a>
          <a href="#" className="hover:text-foreground">Friends</a>
          <a href="#" className="hover:text-foreground">About</a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-6 lg:grid-cols-2">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> for friends, by friends
            </span>
            <h1 className="mt-5 font-display text-7xl font-bold leading-[0.9] sm:text-8xl">
              Your day,<br />
              <span className="text-gradient">written together.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Chat, video call, share screens & tick off daily quests with your favorite humans — all in one cozy little diary.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { e: "💬", t: "Live chat" },
                { e: "📹", t: "Video webinar" },
                { e: "✨", t: "Smart reminders" },
              ].map((c) => (
                <div key={c.t} className="glass rounded-3xl p-4 text-center">
                  <div className="text-3xl">{c.e}</div>
                  <div className="mt-1 text-xs font-bold text-muted-foreground">{c.t}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:justify-self-end"
        >
          <div className="glass-strong relative w-full max-w-md rounded-5xl p-8 sm:p-10 dreamy-ring">
            <div className="mb-6">
              <h2 className="font-display text-5xl font-bold">
                {mode === "signin" ? "Hey, welcome back!" : "Start your diary"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to see what your friends are up to today."
                  : "Make a cozy corner of the internet with friends."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1 text-sm font-bold">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`relative rounded-xl px-3 py-2 transition-colors ${
                    mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-pill"
                      className="absolute inset-0 -z-0 rounded-xl bg-gradient-primary shadow-pop"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{m === "signin" ? "Sign in" : "Sign up"}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Saitejasri"
                    className="h-12 rounded-2xl bg-card/80 text-base"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" required placeholder="you@diary.cute" className="h-12 rounded-2xl bg-card/80 pl-10 text-base" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" required placeholder="••••••••" className="h-12 rounded-2xl bg-card/80 pl-10 text-base" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="group h-12 w-full rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              >
                {loading ? "One sec…" : mode === "signin" ? "Open my diary" : "Create my diary"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-card">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.96h5.5c-.24 1.32-1.7 3.86-5.5 3.86-3.32 0-6.02-2.74-6.02-6.12S8.68 5.78 12 5.78c1.88 0 3.14.8 3.86 1.5l2.64-2.54C16.92 3.22 14.66 2.3 12 2.3 6.92 2.3 2.8 6.42 2.8 11.5S6.92 20.7 12 20.7c6.92 0 9.2-4.86 9.2-7.36 0-.5-.06-.88-.14-1.26H12z"/>
                </svg>
                Google
              </button>
              <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-card">
                <Github className="h-4 w-4" /> GitHub
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our <a href="#" className="font-semibold text-foreground hover:underline">Terms</a> & <a href="#" className="font-semibold text-foreground hover:underline">Privacy</a>.
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

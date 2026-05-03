import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-strong rounded-5xl p-12 text-center max-w-md dreamy-ring">
        <div className="font-display text-8xl font-bold text-gradient">404</div>
        <p className="mt-2 font-display text-3xl">Lost in the dream ✨</p>
        <p className="mt-2 text-muted-foreground">This page drifted off somewhere.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-2xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

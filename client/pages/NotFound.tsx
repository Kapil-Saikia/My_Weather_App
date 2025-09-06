import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/20 bg-white/60 p-12 text-center ring-1 ring-black/5 backdrop-blur dark:bg-black/30">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-foreground/70">Oops! Page not found</p>
      <a href="/" className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">
        Return to Home
      </a>
    </div>
  );
};

export default NotFound;

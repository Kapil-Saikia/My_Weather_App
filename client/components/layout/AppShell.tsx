import { ReactNode } from "react";
import { CloudSun, LocateFixed } from "lucide-react";
import { useEffect } from "react";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { cn } from "@/lib/utils";
import HeaderSearch from "@/components/weather/HeaderSearch";
import { reverseLookup } from "@/lib/weather";
import type { GeoLocation } from "@/lib/weather";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useEffect(() => {
    try {
      const pref = localStorage.getItem("nimbus:motion");
      if (pref !== "off") document.body.classList.add("allow-motion");
    } catch {}
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Dispatch immediately
      const initial: GeoLocation = { name: "Current location", latitude, longitude } as any;
      window.dispatchEvent(new CustomEvent<GeoLocation>("nimbus:select-location", { detail: initial } as any));
      // Background reverse‑geocode to refine label
      try {
        const best = await reverseLookup(latitude, longitude);
        if (best) {
          window.dispatchEvent(new CustomEvent<GeoLocation>("nimbus:select-location", { detail: best } as any));
        }
      } catch {}
    });
  };

  return (
    <div className={cn("min-h-screen text-foreground")}>
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/40 bg-white/60 dark:supports-[backdrop-filter]:bg-black/30 dark:bg-black/40 border-b border-white/20 safe-top safe-x">
        <div className="container flex min-h-16 items-center justify-between py-1">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sm shadow-indigo-500/30">
              <CloudSun className="h-5 w-5" />
            </span>
            <span className="text-xl">Nimbus Weather</span>
          </a>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <div className="hidden md:block w-full max-w-md">
              <HeaderSearch />
            </div>
            <InstallPrompt />
            <button
              onClick={useMyLocation}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/60 px-4 py-3 md:py-2 text-sm min-h-11 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white/80 dark:bg-black/30 dark:hover:bg-black/40"
            >
              <LocateFixed className="h-4 w-4" />
              Use my location
            </button>
          </div>
        </div>
        <div className="container md:hidden py-2">
          <HeaderSearch />
        </div>
      </header>
      <main className="container relative z-10 py-6 sm:py-10 safe-x">{children}</main>
      <footer className="mt-8 border-t border-white/20 py-8 text-center text-xs text-foreground/60 safe-bottom safe-x">
        <div className="container">
          <p>Weather data by WeatherAPI.com</p>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;

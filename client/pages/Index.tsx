import { useEffect, useState } from "react";
import SearchBar from "@/components/weather/SearchBar";
import CurrentWeather from "@/components/weather/CurrentWeather";
import React from "react";
const HourlyForecast = React.lazy(() => import("@/components/weather/HourlyForecast"));
const DailyForecast = React.lazy(() => import("@/components/weather/DailyForecast"));
const TrendTabs = React.lazy(() => import("@/components/weather/TrendTabs"));
import { fetchWeather, type GeoLocation, wmoToCategory, reverseLookup, ipGeoFallback } from "@/lib/weather";
import WeatherBackdrop from "@/components/weather/WeatherBackdrop";
import { LocateFixed } from "lucide-react";

export default function Index() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [cityLabel, setCityLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<import("@/lib/weather").WeatherData | null>(null);

  // Load last location if available
  useEffect(() => {
    const raw = localStorage.getItem("nimbus:last-location");
    if (raw) {
      try {
        const loc = JSON.parse(raw) as GeoLocation;
        if (loc?.latitude && loc?.longitude) {
          setLocation(loc);
          setCityLabel([loc.name, (loc as any).admin1, (loc as any).country].filter(Boolean).join(", "));
        }
      } catch {}
    }
  }, []);

  // Attempt geolocation on first mount
  useEffect(() => {
    const onSelect = (e: Event) => {
      const ev = e as CustomEvent<GeoLocation>;
      const loc = ev.detail;
      if (!loc) return;
      setLocation(loc);
      if (loc.name === "Current location" && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
        reverseLookup(loc.latitude, loc.longitude).then((best) => {
          if (best) {
            setCityLabel([best.name, best.admin1, best.country].filter(Boolean).join(", "));
            setLocation({ ...loc, name: best.name, admin1: best.admin1, country: best.country, timezone: best.timezone });
          }
        }).catch(() => {});
      } else {
        setCityLabel([loc.name, loc.admin1, loc.country].filter(Boolean).join(", "));
      }
    };
    window.addEventListener("nimbus:select-location", onSelect as EventListener);


    return () => window.removeEventListener("nimbus:select-location", onSelect as EventListener);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!location) return;
      try {
        setLoading(true);
        setError(null);
        const w = await fetchWeather(location.latitude, location.longitude);
        setData(w);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load weather");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location?.latitude, location?.longitude]);

  return (
    <div className="space-y-6">
      {/* Inline search + location button removed; header provides these controls across breakpoints */}

      {!data && !loading && !location && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/20 bg-white/60 p-8 text-center ring-1 ring-black/5 backdrop-blur dark:bg-black/30">
          <h1 className="text-3xl font-semibold tracking-tight">Your weather, beautifully presented</h1>
          <p className="mt-2 text-foreground/70">Search for a city or use your current location to see live conditions, hourly trends, and a 7‑day outlook.</p>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200/30 bg-red-50/60 p-4 text-red-900 ring-1 ring-black/5 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-60 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-60 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-60 animate-pulse rounded-2xl bg-white/50" />
        </div>
      )}

      {data && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0">
            <WeatherBackdrop category={wmoToCategory(data.current.weather_code, data.current.is_day)} />
          </div>
          <div className="mx-auto max-w-5xl">
            {cityLabel ? (
              <CurrentWeather cityLabel={cityLabel} data={data} />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="h-60 animate-pulse rounded-3xl bg-white/60 ring-1 ring-black/5" />
                <div className="h-60 animate-pulse rounded-3xl bg-white/60 ring-1 ring-black/5" />
                <div className="h-60 animate-pulse rounded-3xl bg-white/60 ring-1 ring-black/5" />
              </div>
            )}
            <React.Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-2xl bg-white/60 ring-1 ring-black/5" />}>
              <TrendTabs data={data} />
            </React.Suspense>
            <React.Suspense fallback={<div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/60 ring-1 ring-black/5" />}>
              <HourlyForecast data={data} />
            </React.Suspense>
            <React.Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-2xl bg-white/60 ring-1 ring-black/5" />}>
              <DailyForecast data={data} />
            </React.Suspense>
          </div>
        </>
      )}
    </div>
  );
}

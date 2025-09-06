import { codeToDescription, type WeatherData, wmoToCategory } from "@/lib/weather";
import WeatherGlyph from "@/components/weather/WeatherGlyph";

interface DailyForecastProps {
  data: WeatherData;
}

const dayFromISO = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: "short" });

export default function DailyForecast({ data }: DailyForecastProps) {
  const days = data.daily.time.map((t, i) => ({
    t,
    wmo: data.daily.weather_code[i],
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
    p: data.daily.precipitation_probability_max?.[i] ?? null,
  }));

  return (
    <section className="mt-6 rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-black/30">
      <h3 className="px-2 text-sm uppercase tracking-wider text-foreground/60">7‑day forecast</h3>
      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d, i) => (
          <li key={i} className="rounded-xl border border-white/20 bg-white/70 p-3 ring-1 ring-black/5 dark:bg-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WeatherGlyph category={wmoToCategory(d.wmo)} size={36} />
                <div>
                  <div className="text-xs text-foreground/60">{dayFromISO(d.t)}</div>
                  <div className="text-sm font-medium">{codeToDescription(d.wmo)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{Math.round(d.max)}° / {Math.round(d.min)}°</div>
                {d.p != null && <div className="text-xs text-foreground/60">{d.p}% precip</div>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

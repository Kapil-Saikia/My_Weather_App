import { type WeatherData, wmoToCategory } from "@/lib/weather";
import WeatherGlyph from "@/components/weather/WeatherGlyph";
import { cn } from "@/lib/utils";

interface HourlyForecastProps {
  data: WeatherData;
}

const hourFromISO = (s: string) => {
  if (s.includes(" ")) return s.split(" ")[1]?.slice(0,2) ?? s; // formats like YYYY-MM-DD HH:mm
  return new Date(s).toLocaleTimeString([], { hour: "2-digit" });
};

export default function HourlyForecast({ data }: HourlyForecastProps) {
  const hoursToShow = 24;
  const items = Array.from({ length: Math.min(hoursToShow, data.hourly.time.length) }, (_, i) => i);

  return (
    <section className="mt-6 rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-black/30">
      <h3 className="px-2 text-sm uppercase tracking-wider text-foreground/60">Next 24 hours</h3>
      <div className="mt-3 overflow-x-auto">
        <ol className="flex gap-2">
          {items.map((i) => (
            <li key={i} className="min-w-[68px]">
              <div className={cn(
                "rounded-xl border border-white/20 bg-white/70 p-3 text-center ring-1 ring-black/5 dark:bg-white/10",
              )}>
                <div className="text-xs text-foreground/60">{hourFromISO(data.hourly.time[i])}</div>
                <div className="mt-1 flex items-center justify-center"><span className="scale-75">
                  <WeatherGlyph category={wmoToCategory(data.hourly.weather_code[i])} size={36} />
                </span></div>
                <div className="mt-1 text-lg font-semibold">{Math.round(data.hourly.temperature_2m[i])}°</div>
                {data.hourly.precipitation_probability && (
                  <div className="mt-1 text-xs text-foreground/60">{data.hourly.precipitation_probability[i]}%</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

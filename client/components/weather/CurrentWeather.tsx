import { codeToDescription, windDirectionToText, wmoToCategory, type WeatherData } from "@/lib/weather";
import { Droplets, Sunrise, Sunset, Thermometer, Wind } from "lucide-react";
import WeatherGlyph from "@/components/weather/WeatherGlyph";

interface CurrentWeatherProps {
  cityLabel: string;
  data: WeatherData;
}

const formatTime = (value: string, tz: string) => {
  if (/am|pm/i.test(value)) return value.replace(/\s+/g, " ").trim();
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(d);
  } catch {
    return value;
  }
};


export default function CurrentWeather({ cityLabel, data }: CurrentWeatherProps) {
  const c = data.current;
  const dailyIdx = 0;
  const todayMax = data.daily.temperature_2m_max[dailyIdx];
  const todayMin = data.daily.temperature_2m_min[dailyIdx];
  const sunrise = data.daily.sunrise[dailyIdx];
  const sunset = data.daily.sunset[dailyIdx];

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="col-span-1 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-md ring-1 ring-black/5 backdrop-blur-sm dark:bg-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <WeatherGlyph category={wmoToCategory(c.weather_code, c.is_day)} />
            <div>
              <h2 className="text-sm uppercase tracking-wider text-foreground/60">Now in</h2>
              <p className="mt-1 text-2xl font-semibold leading-none">{cityLabel}</p>
              <p className="mt-1 text-sm text-foreground/60">Local time {new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit", timeZone: data.timezone }).format(new Date())}</p>
              <p className="mt-2 text-sm text-foreground/60">{codeToDescription(c.weather_code)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold tracking-tight">{Math.round(c.temperature_2m)}°</div>
            <div className="mt-1 text-sm text-foreground/60">H {Math.round(todayMax)}° · L {Math.round(todayMin)}°</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<Thermometer className="h-4 w-4" />} label="Feels like" value={`${Math.round(c.apparent_temperature ?? c.temperature_2m)}°`} />
          <Metric icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${Math.round(c.relative_humidity_2m ?? 0)}%`} />
          <Metric icon={<Wind className="h-4 w-4" />} label={`Wind ${windDirectionToText(c.wind_direction_10m)}`} value={`${Math.round(c.wind_speed_10m ?? 0)} km/h`} />
          <Metric icon={<Thermometer className="h-4 w-4" />} label="Precip" value={`${c.precipitation ?? 0} mm`} />
        </div>
      </div>

      <div className="col-span-1 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-md ring-1 ring-black/5 backdrop-blur-sm dark:bg-white/10">
        <h3 className="text-sm uppercase tracking-wider text-foreground/60">Sun</h3>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-sm"><Sunrise className="h-5 w-5" /></span>
            <div>
              <div className="text-xs text-foreground/60">Sunrise</div>
              <div className="text-lg font-medium">{formatTime(sunrise, data.timezone)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-sm"><Sunset className="h-5 w-5" /></span>
            <div>
              <div className="text-xs text-foreground/60">Sunset</div>
              <div className="text-lg font-medium">{formatTime(sunset, data.timezone)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-1 rounded-3xl border border-white/30 bg-white/70 p-6 shadow-md ring-1 ring-black/5 backdrop-blur-sm dark:bg-white/10">
        <h3 className="text-sm uppercase tracking-wider text-foreground/60">Today</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 ring-1 ring-black/5 dark:bg-white/10">Max {Math.round(todayMax)}°</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 ring-1 ring-black/5 dark:bg-white/10">Min {Math.round(todayMin)}°</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 ring-1 ring-black/5 dark:bg-white/10">Humidity {Math.round(c.relative_humidity_2m ?? 0)}%</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 ring-1 ring-black/5 dark:bg-white/10">Wind {Math.round(c.wind_speed_10m ?? 0)} km/h</span>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-white/40 bg-white/80 px-3 text-sm ring-1 ring-black/5 backdrop-blur-sm overflow-hidden text-center dark:border-white/10 dark:bg-white/10">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/70 text-foreground/70 ring-1 ring-black/5 dark:bg-white/5">
        {icon}
      </span>
      <div className="mt-1 leading-tight">
        <div className="text-[11px] uppercase tracking-wide text-foreground/60 whitespace-normal break-words">{label}</div>
        <div className="text-lg font-semibold leading-tight">{value}</div>
      </div>
    </div>
  );
}

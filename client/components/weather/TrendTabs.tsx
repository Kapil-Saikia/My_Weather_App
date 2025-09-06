import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type WeatherData } from "@/lib/weather";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props { data: WeatherData }

type SeriesKey = "temperature_2m" | "precipitation_probability" | "wind_speed_10m";

const toSeries = (data: WeatherData) => {
  return data.hourly.time.map((t, i) => ({
    t,
    temperature_2m: data.hourly.temperature_2m[i],
    precipitation_probability: data.hourly.precipitation_probability?.[i] ?? null,
    wind_speed_10m: data.hourly.wind_speed_10m?.[i] ?? null,
  }));
};

export default function TrendTabs({ data }: Props) {
  const series = toSeries(data).slice(0, 24);

  return (
    <section className="mt-6 rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-black/30">
      <Tabs defaultValue="temperature" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <TabsList className="bg-white/60 backdrop-blur dark:bg-white/10">
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="precip">Precipitation</TabsTrigger>
            <TabsTrigger value="wind">Wind</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="temperature">
          <Chart data={series} y="temperature_2m" unit="°" />
        </TabsContent>
        <TabsContent value="precip">
          <Chart data={series} y="precipitation_probability" unit="%" />
        </TabsContent>
        <TabsContent value="wind">
          <Chart data={series} y="wind_speed_10m" unit="km/h" />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Chart({ data, y, unit }: { data: ReturnType<typeof toSeries>; y: SeriesKey; unit: string }) {
  return (
    <div className="h-40 sm:h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "numeric" })} tick={{ fontSize: 12 }} interval={2} stroke="hsl(var(--foreground)/0.4)" />
          <YAxis width={30} tick={{ fontSize: 12 }} stroke="hsl(var(--foreground)/0.4)" />
          <Tooltip formatter={(v: any) => `${Math.round(v)}${unit}`} labelFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
          <Area type="monotone" dataKey={y} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

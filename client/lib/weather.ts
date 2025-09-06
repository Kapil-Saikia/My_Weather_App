import { z } from "zod";

export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string | null;
  timezone?: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, retries = 2): Promise<Response> {
  let lastErr: unknown;
  const mkRequest = (attempt: number): RequestInfo | URL => {
    if (typeof input === "string") {
      if (attempt > 0 && input.startsWith("/") && typeof window !== "undefined") {
        return new URL(input, window.location.origin).toString();
      }
    }
    return input;
  };

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const req = mkRequest(i);
      const res = await fetch(req, { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      clearTimeout(timeout);
      lastErr = e;
      if (i === retries) break;
      await wait(300 * Math.pow(2, i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to fetch");
}

export const searchLocations = async (query: string): Promise<GeoLocation[]> => {
  try {
    const res = await fetchWithRetry(`/api/weather/search?q=${encodeURIComponent(query)}`);
    return (await res.json()) as GeoLocation[];
  } catch {}

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    const r = await fetch(url.toString(), { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) return [];
    const j: any = await r.json();
    const list = j.results || [];
    return (list || []).map((it: any) => ({
      name: [it.name, it.admin1].filter(Boolean).join(', ') || it.name || 'Location',
      latitude: it.latitude,
      longitude: it.longitude,
      country: it.country || it.country_code || undefined,
      admin1: it.admin1 || null,
      timezone: it.timezone || undefined,
    }));
  } catch {
    return [];
  }
};

export const reverseLookup = async (lat: number, lon: number): Promise<GeoLocation | null> => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  } catch {}

  // Prefer server proxy first (same-origin) to avoid cross-origin failures in deployed environments
  try {
    const res = await fetchWithRetry(`/api/weather/search?q=${encodeURIComponent(`${lat},${lon}`)}`);
    if (res.ok) {
      const results = (await res.json()) as GeoLocation[];
      const best = results?.[0];
      if (best) return { ...best, latitude: lat, longitude: lon };
    }
  } catch {}

  // Fallback to direct Open‑Meteo reverse geocoding
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    let r: Response | null = null;
    try {
      r = await fetch(url.toString());
    } catch (err) {
      r = null;
    }
    clearTimeout(t);

    if (r && r.ok) {
      const json: any = await r.json();
      const best = json?.results?.[0];
      if (best) {
        return {
          name: [best.name, best.admin1].filter(Boolean).join(', ') || best.name || 'Current location',
          latitude: lat,
          longitude: lon,
          country: best.country || best.country_code,
          admin1: best.admin1 || null,
          timezone: best.timezone,
        };
      }
    }
  } catch {}

  return null;
};

export const ipGeoFallback = async (): Promise<GeoLocation | null> => {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    const r = await fetch('https://ipapi.co/json/', { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j: any = await r.json();
    if (!j || j.error) return null;
    return {
      name: [j.city, j.region].filter(Boolean).join(', ') || j.city || 'Current location',
      latitude: Number(j.latitude),
      longitude: Number(j.longitude),
      country: j.country_name || j.country,
      admin1: j.region || null,
      timezone: j.timezone,
    };
  } catch {
    return null;
  }
};

const WeatherResponse = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number().optional(),
    apparent_temperature: z.number().optional(),
    is_day: z.number().optional(),
    precipitation: z.number().optional(),
    weather_code: z.number(),
    wind_speed_10m: z.number().optional(),
    wind_direction_10m: z.number().optional(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    apparent_temperature: z.array(z.number()).optional(),
    weather_code: z.array(z.number()),
    precipitation_probability: z.array(z.number()).optional(),
    relative_humidity_2m: z.array(z.number()).optional(),
    wind_speed_10m: z.array(z.number()).optional(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
    precipitation_probability_max: z.array(z.number()).optional(),
    wind_speed_10m_max: z.array(z.number()).optional(),
  }),
});

export type WeatherData = z.infer<typeof WeatherResponse>;

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  // Try server proxy first
  try {
    const res = await fetchWithRetry(`/api/weather/forecast?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
    const json = await res.json();
    return WeatherResponse.parse(json);
  } catch (e) {
    // Fallback: call Open‑Meteo directly from client (CORS-enabled)
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
      url.searchParams.set('hourly', [
        'temperature_2m',
        'apparent_temperature',
        'weathercode',
        'precipitation_probability',
        'relativehumidity_2m',
        'wind_speed_10m',
      ].join(','));
      url.searchParams.set('daily', [
        'weathercode',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'precipitation_probability_max',
        'wind_speed_10m_max',
      ].join(','));
      url.searchParams.set('current_weather', 'true');
      url.searchParams.set('timezone', 'auto');

      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(`OM forecast failed: ${r.status}`);
      const om = await r.json();

      const hourly = {
        time: om.hourly?.time || [],
        temperature_2m: om.hourly?.temperature_2m || [],
        apparent_temperature: om.hourly?.apparent_temperature || [],
        weather_code: om.hourly?.weathercode || [],
        precipitation_probability: om.hourly?.precipitation_probability || [],
        relative_humidity_2m: om.hourly?.relativehumidity_2m || [],
        wind_speed_10m: om.hourly?.wind_speed_10m || [],
      };

      const daily = {
        time: om.daily?.time || [],
        weather_code: om.daily?.weathercode || [],
        temperature_2m_max: om.daily?.temperature_2m_max || [],
        temperature_2m_min: om.daily?.temperature_2m_min || [],
        sunrise: om.daily?.sunrise || [],
        sunset: om.daily?.sunset || [],
        precipitation_probability_max: om.daily?.precipitation_probability_max || [],
        wind_speed_10m_max: om.daily?.wind_speed_10m_max || [],
      };

      const current = {
        time: om.current_weather?.time || new Date().toISOString(),
        temperature_2m: om.current_weather?.temperature ?? (hourly.temperature_2m[0] ?? 0),
        relative_humidity_2m: om.hourly?.relativehumidity_2m?.[0] ?? undefined,
        apparent_temperature: om.hourly?.apparent_temperature?.[0] ?? undefined,
        is_day: typeof om.current_weather?.is_day === 'number' ? om.current_weather.is_day : undefined,
        precipitation: om.hourly?.precipitation?.[0] ?? 0,
        weather_code: om.current_weather?.weathercode ?? (hourly.weather_code[0] ?? 3),
        wind_speed_10m: om.current_weather?.windspeed ?? (hourly.wind_speed_10m[0] ?? 0),
        wind_direction_10m: om.current_weather?.winddirection ?? 0,
      };

      const payload = {
        latitude: om.latitude ?? lat,
        longitude: om.longitude ?? lon,
        timezone: om.timezone || 'UTC',
        current,
        hourly,
        daily,
      };

      return WeatherResponse.parse(payload);
    } catch (omErr) {
      throw e instanceof Error ? e : new Error('Failed to fetch weather');
    }
  }
};

export const codeToDescription = (code: number): string => {
  // Based on WMO weather interpretation codes
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([56, 57].includes(code)) return "Freezing drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75].includes(code)) return "Snow";
  if (code === 77) return "Snow grains";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Thunderstorm w/ hail";
  return "Unknown";
};

export type WeatherCategory = "sunny" | "clear-night" | "cloudy" | "rain" | "snow" | "thunder" | "fog";

export const wmoToCategory = (code: number, isDay?: number): WeatherCategory => {
  if (code === 0) return isDay ? "sunny" : "clear-night";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloudy";
};

export const windDirectionToText = (degrees?: number) => {
  if (degrees == null) return "";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(degrees / 22.5) % 16;
  return dirs[idx];
};

import type { RequestHandler } from "express";

const BASE_URL = process.env.WEATHERAPI_BASE_URL || "https://api.weatherapi.com/v1";
const API_KEY = process.env.WEATHERAPI_KEY;
const OM_GEOCODE = "https://geocoding-api.open-meteo.com/v1";
const OM_FORECAST = "https://api.open-meteo.com/v1/forecast";

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("WEATHERAPI_KEY not set. Falling back to Open‑Meteo for search and forecast.");
}

const toISO = (date: string, time12h: string, tzId: string) => {
  // time like "07:14 AM" -> 24h
  const [hm, ampm] = time12h.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ampm?.toUpperCase() === "PM" && h < 12) h += 12;
  if (ampm?.toUpperCase() === "AM" && h === 12) h = 0;
  const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  // best-effort: return ISO string; browser will render in local tz
  return d.toISOString();
};

const mapConditionTextToWMO = (text: string): number => {
  const t = text.toLowerCase();
  if (/(clear|sunny)/.test(t)) return 0;
  if (/(partly|cloud)/.test(t)) return 2;
  if (/(fog|mist|haze)/.test(t)) return 45;
  if (/(drizzle)/.test(t)) return 51;
  if (/(rain|shower)/.test(t)) return 61;
  if (/(snow|sleet|blizzard|flurr)/.test(t)) return 71;
  if (/(thunder)/.test(t)) return 95;
  return 3;
};

export const searchWeatherLocations: RequestHandler = async (req, res) => {
  try {
    const q = String(req.query.q || "");
    if (!q) return res.json([]);

    // If API key available, prefer WeatherAPI search
    if (API_KEY) {
      const url = new URL(`${BASE_URL}/search.json`);
      url.searchParams.set("key", API_KEY);
      url.searchParams.set("q", q);
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Search failed: ${r.status}`);
      const json = (await r.json()) as any[];
      const results = json.map((it) => ({
        name: it.name,
        latitude: it.lat,
        longitude: it.lon,
        country: it.country,
        admin1: it.region || null,
        timezone: it.tz_id,
      }));
      return res.json(results);
    }

    // Fallback: Open‑Meteo Geocoding (supports search and reverse)
    const coordsMatch = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    let url: URL;
    if (coordsMatch) {
      const lat = coordsMatch[1];
      const lon = coordsMatch[2];
      url = new URL(`${OM_GEOCODE}/reverse`);
      url.searchParams.set("latitude", lat);
      url.searchParams.set("longitude", lon);
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");
    } else {
      url = new URL(`${OM_GEOCODE}/search`);
      url.searchParams.set("name", q);
      url.searchParams.set("count", "8");
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");
    }
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Search failed: ${r.status}`);
    const json = (await r.json()) as any;
    const list = (json.results || json) as any[];
    const results = (list || []).map((it: any) => ({
      name: [it.name, it.admin1].filter(Boolean).join(", ") || it.name || "Location",
      latitude: it.latitude,
      longitude: it.longitude,
      country: it.country || it.country_code || undefined,
      admin1: it.admin1 || null,
      timezone: it.timezone || undefined,
    }));
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Search error" });
  }
};

export const getWeatherForecast: RequestHandler = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: "Invalid coordinates" });

    if (API_KEY) {
      // WeatherAPI path
      const url = new URL(`${BASE_URL}/forecast.json`);
      url.searchParams.set("key", API_KEY);
      url.searchParams.set("q", `${lat},${lon}`);
      url.searchParams.set("days", "7");
      url.searchParams.set("aqi", "no");
      url.searchParams.set("alerts", "no");

      const r = await fetch(url);
      if (!r.ok) throw new Error(`Forecast failed: ${r.status}`);
      const json: any = await r.json();

      const tz = json.location?.tz_id || "UTC";
      const current = json.current || {};
      const forecastDays = json.forecast?.forecastday || [];

      const hourly = { time: [] as string[], temperature_2m: [] as number[], apparent_temperature: [] as number[], weather_code: [] as number[], precipitation_probability: [] as number[], relative_humidity_2m: [] as number[], wind_speed_10m: [] as number[] };
      const hours = forecastDays.flatMap((d: any) => d.hour || []);
      for (let i = 0; i < Math.min(36, hours.length); i++) {
        const h = hours[i];
        hourly.time.push(h.time);
        hourly.temperature_2m.push(h.temp_c);
        hourly.apparent_temperature.push(h.feelslike_c);
        hourly.weather_code.push(mapConditionTextToWMO(h.condition?.text || ""));
        hourly.precipitation_probability.push(Number(h.chance_of_rain || h.chance_of_snow || 0));
        hourly.relative_humidity_2m.push(Number(h.humidity || 0));
        hourly.wind_speed_10m.push(Number(h.wind_kph || 0));
      }

      const daily = { time: [] as string[], weather_code: [] as number[], temperature_2m_max: [] as number[], temperature_2m_min: [] as number[], sunrise: [] as string[], sunset: [] as string[], precipitation_probability_max: [] as number[], wind_speed_10m_max: [] as number[] };
      for (const d of forecastDays) {
        daily.time.push(d.date);
        daily.weather_code.push(mapConditionTextToWMO(d.day?.condition?.text || ""));
        daily.temperature_2m_max.push(d.day?.maxtemp_c ?? 0);
        daily.temperature_2m_min.push(d.day?.mintemp_c ?? 0);
        daily.sunrise.push(d.astro?.sunrise || "06:00 AM");
        daily.sunset.push(d.astro?.sunset || "06:00 PM");
        daily.precipitation_probability_max.push(Number(d.day?.daily_chance_of_rain || d.day?.daily_chance_of_snow || 0));
        daily.wind_speed_10m_max.push(Number(d.day?.maxwind_kph || 0));
      }

      const payload = {
        latitude: lat,
        longitude: lon,
        timezone: tz,
        current: {
          time: json.current?.last_updated || new Date().toISOString(),
          temperature_2m: current.temp_c ?? 0,
          relative_humidity_2m: current.humidity ?? 0,
          apparent_temperature: current.feelslike_c ?? current.temp_c ?? 0,
          is_day: current.is_day ?? 1,
          precipitation: current.precip_mm ?? 0,
          weather_code: mapConditionTextToWMO(current.condition?.text || ""),
          wind_speed_10m: current.wind_kph ?? 0,
          wind_direction_10m: current.wind_degree ?? 0,
        },
        hourly,
        daily,
      };
      return res.json(payload);
    }

    // Fallback: Open‑Meteo
    const url = new URL(OM_FORECAST);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("hourly", [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "precipitation_probability",
      "relative_humidity_2m",
      "wind_speed_10m",
    ].join(","));
    url.searchParams.set("daily", [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","));
    url.searchParams.set("current", [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","));
    url.searchParams.set("timezone", "auto");

    const r = await fetch(url);
    if (!r.ok) throw new Error(`Forecast failed: ${r.status}`);
    const om = await r.json();

    const payload = {
      latitude: om.latitude,
      longitude: om.longitude,
      timezone: om.timezone || "UTC",
      current: {
        time: om.current?.time || new Date().toISOString(),
        temperature_2m: om.current?.temperature_2m ?? 0,
        relative_humidity_2m: om.current?.relative_humidity_2m ?? 0,
        apparent_temperature: om.current?.apparent_temperature ?? om.current?.temperature_2m ?? 0,
        is_day: om.current?.is_day ?? 1,
        precipitation: om.current?.precipitation ?? 0,
        weather_code: om.current?.weather_code ?? 3,
        wind_speed_10m: om.current?.wind_speed_10m ?? 0,
        wind_direction_10m: om.current?.wind_direction_10m ?? 0,
      },
      hourly: om.hourly || { time: [], temperature_2m: [], apparent_temperature: [], weather_code: [], precipitation_probability: [], relative_humidity_2m: [], wind_speed_10m: [] },
      daily: om.daily || { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], sunrise: [], sunset: [], precipitation_probability_max: [], wind_speed_10m_max: [] },
    };

    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Forecast error" });
  }
};

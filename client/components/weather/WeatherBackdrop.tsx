import { WeatherCategory } from "@/lib/weather";
import { memo, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  category: WeatherCategory;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function WeatherBackdropBase({ category }: Props) {
  const isMobile = useIsMobile();
  const density = isMobile ? 0.5 : 1;
  const reducedByOS = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const allowOverride = typeof document !== "undefined" && document.body?.classList.contains("allow-motion");
  const prefersReduced = reducedByOS && !allowOverride;
  const ambientCount = prefersReduced ? 0 : Math.round(20 * density);

  const content = useMemo(() => {
    const ambient = (
      <div className="ambient-particles">
        {range(ambientCount).map((i) => (
          <div key={`p-${i}`} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 6}s`, animationDuration: `${3 + Math.random() * 3}s` }} />
        ))}
      </div>
    );
    switch (category) {
      case "rain":
        return (
          <div className="weather-backdrop rain">
            {range(prefersReduced ? 0 : Math.round(80 * density)).map((i) => (
              <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s`, animationDuration: `${0.6 + Math.random() * 0.6}s` }} />
            ))}
            {ambient}
          </div>
        );
      case "snow":
        return (
          <div className="weather-backdrop snow">
            {range(prefersReduced ? 0 : Math.round(40 * density)).map((i) => (
              <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 2}s` }}>
                {"❄"}
              </div>
            ))}
            {ambient}
          </div>
        );
      case "sunny":
        return (
          <div className="weather-backdrop sunny">
            {!prefersReduced && <div className="sun" />}
            {!prefersReduced && range(8).map((i) => (
              <div key={i} className="sunray" style={{ transform: `rotate(${i * 45}deg)` }} />
            ))}
            {ambient}
          </div>
        );
      case "clear-night":
        return (
          <div className="weather-backdrop clear-night">
            {!prefersReduced && <div className="moon" />}
            {range(prefersReduced ? 0 : Math.round(30 * density)).map((i) => (
              <div key={i} className="star" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, animationDelay: `${Math.random() * 2}s` }} />
            ))}
            {ambient}
          </div>
        );
      case "thunder":
        return (
          <div className="weather-backdrop thunder">
            {range(prefersReduced ? 0 : Math.round(60 * density)).map((i) => (
              <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random()}s`, animationDuration: `${0.5 + Math.random() * 0.4}s` }} />
            ))}
            {range(prefersReduced ? 0 : 3).map((i) => (
              <div key={i} className="lightning" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 30}%`, animationDelay: `${Math.random() * 4 + 1}s` }} />
            ))}
            {ambient}
          </div>
        );
      case "fog":
        return (
          <div className="weather-backdrop fog">
            {range(prefersReduced ? 0 : 4).map((i) => (
              <div key={i} className="fog-layer" style={{ bottom: `${i * 60}px`, animationDelay: `${i * 2}s`, animationDuration: `${10 + Math.random() * 6}s`, opacity: 0.2 + Math.random() * 0.3 }} />
            ))}
            {ambient}
          </div>
        );
      default:
        return (
          <div className="weather-backdrop cloudy">
            {range(prefersReduced ? 0 : Math.round(4 * density)).map((i) => (
              <div key={i} className="cloud" style={{ top: `${10 + Math.random() * 40}%`, animationDelay: `${i * 3}s`, animationDuration: `${14 + Math.random() * 8}s` }} />
            ))}
            {ambient}
          </div>
        );
    }
  }, [category]);

  return <div aria-hidden>{content}</div>;
}

const WeatherBackdrop = memo(WeatherBackdropBase);
export default WeatherBackdrop;

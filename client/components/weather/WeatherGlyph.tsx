import { WeatherCategory } from "@/lib/weather";
import { useId } from "react";

interface Props {
  category: WeatherCategory;
  size?: number; // px
}

const stroke = "#64748b"; // slate-500
const dropFill = "#3b82f6"; // blue-500
const sunFill = "#f59e0b"; // amber-500
const moonFill = "#cbd5e1"; // slate-300
const boltFill = "#fbbf24"; // amber-400

export default function WeatherGlyph({ category, size = 44 }: Props) {
  const w = size;
  const h = size;
  const uid = useId().replace(/:/g, "");

  const cloudStops = (() => {
    switch (category) {
      case "rain":
        return ["#93c5fd", "#60a5fa", "#3b82f6"]; // light to deep blue
      case "snow":
        return ["#bae6fd", "#93c5fd", "#60a5fa"]; // icy blues
      case "thunder":
        return ["#94a3b8", "#64748b", "#475569"]; // darker slate
      case "fog":
        return ["#e5e7eb", "#d1d5db", "#cbd5e1"]; // soft grays
      case "sunny":
      case "clear-night":
        return ["#fef3c7", "#fde68a", "#fcd34d"]; // warm light
      default:
        return ["#e0e7ff", "#c7d2fe", "#a5b4fc"]; // periwinkle
    }
  })();

  const CloudBase = ({ opacity = 1 }: { opacity?: number }) => (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`cloudGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={cloudStops[0]} />
          <stop offset="50%" stopColor={cloudStops[1]} />
          <stop offset="100%" stopColor={cloudStops[2]} />
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="20" rx="8" ry="6" fill={`url(#cloudGrad-${uid})`} />
      <ellipse cx="26" cy="20" rx="10" ry="7" fill={`url(#cloudGrad-${uid})`} />
      <ellipse cx="14" cy="18" rx="5" ry="4" fill={`url(#cloudGrad-${uid})`} />
      <ellipse cx="22" cy="18" rx="6" ry="5" fill={`url(#cloudGrad-${uid})`} />
      <rect x="10" y="20" width="24" height="8" rx="4" fill={`url(#cloudGrad-${uid})`} />
      <path d="M12 28h20" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
    </g>
  );

  const Drops = ({ snow = false }: { snow?: boolean }) => (
    snow ? (
      <g>
        <circle cx="16" cy="36" r="2" fill="#60a5fa" />
        <circle cx="22" cy="38" r="2" fill="#93c5fd" />
        <circle cx="28" cy="36" r="2" fill="#60a5fa" />
      </g>
    ) : (
      <g fill={dropFill}>
        <path d="M16 34c1.2-2 1.2-2 0-4-1.2 2-1.2 2 0 4Z" />
        <path d="M22 36c1.2-2 1.2-2 0-4-1.2 2-1.2 2 0 4Z" />
        <path d="M28 34c1.2-2 1.2-2 0-4-1.2 2-1.2 2 0 4Z" />
      </g>
    )
  );

  if (category === "sunny") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <circle cx="28" cy="16" r="9" fill={sunFill} />
        <CloudBase />
      </svg>
    );
  }
  if (category === "clear-night") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <circle cx="28" cy="16" r="9" fill={moonFill} />
        <CloudBase opacity={0.85} />
      </svg>
    );
  }
  if (category === "rain") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <CloudBase />
        <Drops />
      </svg>
    );
  }
  if (category === "snow") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <CloudBase />
        <Drops snow />
      </svg>
    );
  }
  if (category === "thunder") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <CloudBase />
        <polygon points="20,30 26,30 22,38 28,38 22,46" fill={boltFill} transform="translate(-3,-4)" />
      </svg>
    );
  }
  if (category === "fog") {
    return (
      <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
        <CloudBase />
        <line x1="10" y1="32" x2="34" y2="32" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="36" x2="32" y2="36" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={w} height={h} viewBox="0 0 44 44" aria-hidden>
      <CloudBase />
    </svg>
  );
}

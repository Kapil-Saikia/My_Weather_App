import { useEffect, useMemo, useRef, useState } from "react";
import { searchLocations, type GeoLocation } from "@/lib/weather";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSelect: (loc: GeoLocation) => void;
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({ onSelect, initialQuery = "", className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    controller.current?.abort();
    controller.current = new AbortController();
    const id = setTimeout(async () => {
      try {
        const r = await searchLocations(query);
        setResults(r);
        setOpen(true);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const list = useMemo(() => results.slice(0, 8), [results]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="group flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-base shadow-sm ring-1 ring-black/5 backdrop-blur transition focus-within:bg-white/80 dark:bg-black/30 dark:focus-within:bg-black/40">
        <Search className="h-4 w-4 text-foreground/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city or place"
          className="flex-1 bg-transparent outline-none placeholder:text-foreground/50"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-foreground/60" />
        ) : query ? (
          <button aria-label="Clear" onClick={() => setQuery("")}> 
            <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
          </button>
        ) : null}
      </div>

      {open && list.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/20 bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-black/40">
          <ul className="max-h-80 divide-y divide-white/10">
            {list.map((r, idx) => (
              <li key={idx}>
                <button
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/60 dark:hover:bg-white/10"
                  onClick={() => {
                    setOpen(false);
                    onSelect(r);
                  }}
                >
                  <MapPin className="h-4 w-4 text-foreground/60" />
                  <span className="flex-1">{r.name}</span>
                  <span className="text-sm text-foreground/60">{[r.admin1, r.country].filter(Boolean).join(", ")}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

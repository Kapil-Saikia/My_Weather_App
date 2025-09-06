import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "@/components/weather/SearchBar";
import type { GeoLocation } from "@/lib/weather";

export default function HeaderSearch() {
  const navigate = useNavigate();

  const onSelect = useCallback((loc: GeoLocation) => {
    window.dispatchEvent(new CustomEvent<GeoLocation>("nimbus:select-location", { detail: loc } as any));
    navigate("/");
  }, [navigate]);

  return (
    <SearchBar onSelect={onSelect} />
  );
}

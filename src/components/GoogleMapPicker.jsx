import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Loader2, AlertCircle } from "lucide-react";
import { COLORS, BODY_FONT, MONO_FONT } from "../theme/brand";
import { BASE_LAT, BASE_LNG } from "../utils/mapPlaceholder";

// Module-level constant so its reference never changes across renders —
// passing a fresh array here would make useJsApiLoader think the requested
// libraries changed and reload the script.
const LIBRARIES = [];

// Muted, warm styling so the map matches the app's parchment/olive palette
// instead of default Google blue-and-white.
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F7F3E9" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3F4A1C" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F7F3E9" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#EFE7D6" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#DDD3BB" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C7D3A6" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F1EADA" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#B7AE93" }] },
];

const MAP_OPTIONS = {
  styles: MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
  clickableIcons: false,
};

/**
 * Controlled Google Map for picking an exact delivery location. Click
 * anywhere, or drag the marker, to set a position; every position change is
 * reverse-geocoded so the caller can show/autofill a human-readable address
 * — this is what lets a customer who doesn't know their own street name
 * still produce a usable delivery address.
 *
 * Props:
 *   lat, lng           number | null — controlled position
 *   onPositionChange    (lat, lng) => void — fired on click/drag
 *   onAddressResolved   (address: string | null) => void — fired after
 *                        reverse-geocoding the current lat/lng
 *   hasError            boolean — shows an error-colored border
 */
export default function GoogleMapPicker({ lat, lng, onPositionChange, onAddressResolved, hasError }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const geocoderRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);

  const hasPosition = lat != null && lng != null;
  const center = hasPosition ? { lat, lng } : { lat: BASE_LAT, lng: BASE_LNG };

  const handleMapClick = useCallback(
    (e) => onPositionChange(e.latLng.lat(), e.latLng.lng()),
    [onPositionChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e) => onPositionChange(e.latLng.lat(), e.latLng.lng()),
    [onPositionChange]
  );

  // Reverse-geocode on every position change, regardless of source (click,
  // drag, or an externally-driven update like "use my current location").
  useEffect(() => {
    if (!isLoaded || !hasPosition) return;
    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder();

    setGeocoding(true);
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      onAddressResolved(status === "OK" && results?.[0] ? results[0].formatted_address : null);
    });
    // onAddressResolved intentionally omitted — callers pass an inline
    // function each render, and including it would refire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, hasPosition, lat, lng]);

  if (loadError) {
    return (
      <div
        className="w-full h-56 sm:h-64 rounded-2xl flex items-center justify-center text-center px-6 text-sm"
        style={{ background: COLORS.parchment, color: COLORS.clay, fontFamily: BODY_FONT }}
      >
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" /> Map failed to load — enter coordinates manually below.
        </span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="w-full h-56 sm:h-64 rounded-2xl flex items-center justify-center"
        style={{ background: COLORS.parchment }}
      >
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.canopy }} />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border"
      style={{ borderColor: hasError ? COLORS.clay : "rgba(63,74,28,0.12)" }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={hasPosition ? 16 : 12}
        options={MAP_OPTIONS}
        onClick={handleMapClick}
      >
        {hasPosition && (
          <Marker
            position={{ lat, lng }}
            draggable
            onDragEnd={handleMarkerDragEnd}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: COLORS.canopy,
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {!hasPosition && (
        <div
          className="absolute top-2 left-2 right-2 rounded-lg px-3 py-1.5 text-[11px] text-center pointer-events-none"
          style={{ background: "rgba(247,243,233,0.9)", fontFamily: BODY_FONT, color: COLORS.canopy }}
        >
          Tap anywhere on the map to drop your pin
        </div>
      )}

      <div
        className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px] pointer-events-none"
        style={{ background: "rgba(247,243,233,0.9)", fontFamily: MONO_FONT, color: COLORS.canopy }}
      >
        <span>LAT {hasPosition ? lat.toFixed(6) : "—"}</span>
        <span>{geocoding ? "Locating address…" : `LNG ${hasPosition ? lng.toFixed(6) : "—"}`}</span>
      </div>
    </div>
  );
}
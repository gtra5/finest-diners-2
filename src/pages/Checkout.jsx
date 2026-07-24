import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  Building2,
  KeyRound,
  StickyNote,
  Navigation,
  Loader2,
  CreditCard,
  Smartphone,
  Banknote,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { initializePayment } from "../services/api";

// ── Brand tokens (matches header.jsx) ──────────────────────────────────────
const COLORS = {
  canopy: "#3F4A1C", // primary olive — headings, primary actions
  moss: "#4B5A22", // secondary olive — panels
  linen: "#F7F3E9", // page background
  parchment: "#EFE7D6", // card / input surface
  turmeric: "#C08A43", // accent — badges, focus, highlights
  clay: "#B3452B", // errors only
  cream: "#F5F0E6",
};

const DISPLAY_FONT = "'Baloo 2', sans-serif";
const BODY_FONT = "'DM Sans', sans-serif";
const MONO_FONT = "'JetBrains Mono', monospace";

// Simulated map center (Lagos) — the placeholder map is a local, brand-styled
// stand-in for a real map SDK; dragging the pin maps pixel position to a
// small lat/lng range around this center.
const BASE_LAT = 6.5244;
const BASE_LNG = 3.3792;
const COORD_RANGE = 0.012;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const pinToCoords = (xPct, yPct) => ({
  lat: (BASE_LAT + ((50 - yPct) / 50) * COORD_RANGE).toFixed(6),
  lng: (BASE_LNG + ((xPct - 50) / 50) * COORD_RANGE).toFixed(6),
});

const coordsToPin = (lat, lng) => ({
  x: clamp(50 + ((lng - BASE_LNG) / COORD_RANGE) * 50, 4, 96),
  y: clamp(50 - ((lat - BASE_LAT) / COORD_RANGE) * 50, 4, 96),
});

const formatNaira = (n) =>
  `$${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DELIVERY_FEE = 5.0; // flat fee in dollars
const TAX_RATE = 0.075; // VAT

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard, description: "Visa, Mastercard, Verve" },
  { id: "applepay", label: "Apple Pay", icon: Smartphone, description: "Face ID or Touch ID" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, description: "Pay when it arrives" },
];

// ── Contour map background — signature visual element ─────────────────────
function ContourPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="400" height="260" fill={COLORS.parchment} />
      <g fill="none" strokeWidth="1.5">
        <path
          d="M -20 210 C 60 170, 120 230, 200 190 C 280 150, 320 200, 420 160"
          stroke={COLORS.moss}
          opacity="0.18"
        />
        <path
          d="M -20 180 C 70 140, 130 195, 210 160 C 290 120, 330 165, 420 130"
          stroke={COLORS.moss}
          opacity="0.22"
        />
        <path
          d="M -20 150 C 80 110, 140 160, 220 130 C 300 95, 340 130, 420 100"
          stroke={COLORS.canopy}
          opacity="0.16"
        />
        <path
          d="M -20 90 C 60 60, 140 100, 200 65 C 270 30, 330 70, 420 40"
          stroke={COLORS.canopy}
          opacity="0.14"
        />
        <path
          d="M -20 240 C 90 220, 150 250, 240 225 C 310 205, 350 235, 420 215"
          stroke={COLORS.moss}
          opacity="0.16"
        />
      </g>
      <g stroke={COLORS.canopy} opacity="0.06" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="260" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 52} x2="400" y2={i * 52} />
        ))}
      </g>
    </svg>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, totalPrice } = useCart();
  const { getCurrentLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const [activeTab, setActiveTab] = useState("address");
  const [address, setAddress] = useState({
    street: "",
    houseNumber: "",
    aptSuite: "",
    gateCode: "",
    notes: "",
  });
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [pinPos, setPinPos] = useState({ x: 50, y: 50 });
  const [coordsWarning, setCoordsWarning] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const mapRef = useRef(null);
  const draggingRef = useRef(false);

  // ── Order totals (from the real cart) ──
  const itemsTotal = totalPrice || 0;
  const tax = itemsTotal * TAX_RATE;
  const total = itemsTotal + DELIVERY_FEE + (itemsTotal > 0 ? tax : 0);

  // ── Draggable pin ──
  const movePinTo = useCallback((clientX, clientY) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 4, 96);
    setPinPos({ x, y });
    setCoords(pinToCoords(x, y));
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const point = e.touches?.[0] ?? e;
      movePinTo(point.clientX, point.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [movePinTo]);

  const handleMapPointerDown = (e) => {
    draggingRef.current = true;
    const point = e.touches?.[0] ?? e;
    movePinTo(point.clientX, point.clientY);
  };

  const handleCoordInput = (field, value) => {
    const next = { ...coords, [field]: value };
    setCoords(next);
    const lat = parseFloat(field === "lat" ? value : next.lat);
    const lng = parseFloat(field === "lng" ? value : next.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setPinPos(coordsToPin(lat, lng));
    }
  };

  const handleUseCurrentLocation = async () => {
    const result = await getCurrentLocation();
    if (result) {
      const { latitude, longitude } = result;
      // Always use actual coordinates, don't clamp them
      setCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
      // Only clamp pin position for visual, but keep real coordinates
      setPinPos(coordsToPin(latitude, longitude));
      setErrors((prev) => ({ ...prev, coords: undefined }));
      
      // Check if coordinates are outside the map range
      const latDiff = Math.abs(latitude - BASE_LAT);
      const lngDiff = Math.abs(longitude - BASE_LNG);
      if (latDiff > COORD_RANGE || lngDiff > COORD_RANGE) {
        setCoordsWarning('Your location is outside the map area. Coordinates are accurate but pin position is approximate.');
      } else {
        setCoordsWarning(null);
      }
    }
  };

  // ── Validation ──
  const validate = () => {
    const next = {};
    if (activeTab === "address") {
      if (!address.street.trim()) next.street = "Street address is required.";
      if (!address.houseNumber.trim()) next.houseNumber = "Building or house number is required.";
    } else {
      const lat = parseFloat(coords.lat);
      const lng = parseFloat(coords.lng);
      if (coords.lat === "" || coords.lng === "" || Number.isNaN(lat) || Number.isNaN(lng)) {
        next.coords = "Drag the pin or enter valid coordinates.";
      }
    }
    if (!paymentMethod) next.payment = "Select a payment method to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    setPlaceError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      if (paymentMethod !== "cod") {
        await initializePayment(newOrderId, total, user?.email || "guest@finestdiners.com");
      }
      setOrderId(newOrderId);
      setOrderPlaced(true);
    } catch (err) {
      setPlaceError(
        err?.response?.data?.message || "Something went wrong placing your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key) =>
    errors[key] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: COLORS.clay, fontFamily: BODY_FONT }}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {errors[key]}
      </p>
    ) : null;

  const inputBase =
    "w-full rounded-xl px-4 py-2.5 text-sm bg-white/70 border outline-none transition-all focus:ring-2";

  const inputStyle = (hasError) => ({
    fontFamily: BODY_FONT,
    borderColor: hasError ? COLORS.clay : "rgba(63,74,28,0.15)",
    color: COLORS.canopy,
    "--tw-ring-color": hasError ? "rgba(179,69,43,0.25)" : "rgba(192,138,67,0.35)",
  });

  // ── Success state ──
  if (orderPlaced) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16"
      
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');`}</style>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-3xl p-8 text-center shadow-sm bg-white"
       
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: COLORS.canopy }}
          >
            <CheckCircle2 className="w-9 h-9 text-white" />
          </motion.div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
            Order Confirmed
          </h2>
          <p className="text-sm mb-1" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.75)" }}>
            Reference{" "}
            <span style={{ fontFamily: MONO_FONT, color: COLORS.canopy, fontWeight: 600 }}>{orderId}</span>
          </p>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mt-4 mb-6 text-xs font-semibold"
            style={{ background: "rgba(192,138,67,0.18)", color: COLORS.turmeric, fontFamily: DISPLAY_FONT }}
          >
            <Clock className="w-3.5 h-3.5" /> Arriving in 30–45 mins
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-semibold transition hover:opacity-90"
            style={{ background: COLORS.canopy, color: COLORS.cream, fontFamily: DISPLAY_FONT }}
          >
            Track My Order <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-16 px-4 sm:px-6 lg:px-8 bg-white" >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');`}</style>

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
            Checkout
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.6)" }}>
            Tell us exactly where to bring your order.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Main column ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Delivery location card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-3xl p-5 sm:p-6"
              style={{ background: COLORS.cream }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <h2 className="text-lg font-bold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
                  Delivery Location
                </h2>

                <div className="relative inline-flex p-1 rounded-full" style={{ background: COLORS.parchment }}>
                  {["address", "gps"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors"
                      style={{ fontFamily: DISPLAY_FONT }}
                    >
                      {activeTab === tab && (
                        <motion.div
                          layoutId="tabIndicator"
                          className="absolute inset-0 rounded-full"
                          style={{ background: COLORS.canopy }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span
                        className="relative z-10 flex items-center gap-1.5"
                        style={{ color: activeTab === tab ? COLORS.cream : COLORS.canopy }}
                      >
                        {tab === "address" ? <Home className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {tab === "address" ? "Address" : "GPS Pin"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "address" ? (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                        <Home className="w-3.5 h-3.5" /> Street Address
                      </label>
                      <input
                        className={inputBase}
                        style={inputStyle(errors.street)}
                        placeholder="12 Admiralty Way"
                        value={address.street}
                        onChange={(e) => setAddress((p) => ({ ...p, street: e.target.value }))}
                      />
                      {fieldError("street")}
                    </div>

                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                        <Building2 className="w-3.5 h-3.5" /> Building / House No.
                      </label>
                      <input
                        className={inputBase}
                        style={inputStyle(errors.houseNumber)}
                        placeholder="No. 24"
                        value={address.houseNumber}
                        onChange={(e) => setAddress((p) => ({ ...p, houseNumber: e.target.value }))}
                      />
                      {fieldError("houseNumber")}
                    </div>

                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                        <Building2 className="w-3.5 h-3.5" /> Apartment / Suite / Floor
                      </label>
                      <input
                        className={inputBase}
                        style={inputStyle()}
                        placeholder="Flat 3B, 2nd Floor"
                        value={address.aptSuite}
                        onChange={(e) => setAddress((p) => ({ ...p, aptSuite: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                        <KeyRound className="w-3.5 h-3.5" /> Gate / Access Code
                      </label>
                      <input
                        className={inputBase}
                        style={inputStyle()}
                        placeholder="Optional"
                        value={address.gateCode}
                        onChange={(e) => setAddress((p) => ({ ...p, gateCode: e.target.value }))}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                        <StickyNote className="w-3.5 h-3.5" /> Delivery Notes for the Driver
                      </label>
                      <textarea
                        rows={2}
                        className={`${inputBase} resize-none`}
                        style={inputStyle()}
                        placeholder='e.g. "Leave at the back door"'
                        value={address.notes}
                        onChange={(e) => setAddress((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="gps"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={geoLoading}
                        className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                        style={{ background: COLORS.canopy, color: COLORS.cream, fontFamily: DISPLAY_FONT }}
                      >
                        {geoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                        {geoLoading ? "Locating you…" : "Use My Current Location"}
                      </button>
                      <p className="text-xs" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.55)" }}>
                        Or drag the pin below to fine-tune
                      </p>
                    </div>

                    {geoError && (
                      <p className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: COLORS.clay, fontFamily: BODY_FONT }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {geoError}
                      </p>
                    )}

                    {coordsWarning && (
                      <p className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: COLORS.turmeric, fontFamily: BODY_FONT }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {coordsWarning}
                      </p>
                    )}

                    {/* Map placeholder */}
                    <div
                      ref={mapRef}
                      onMouseDown={handleMapPointerDown}
                      onTouchStart={handleMapPointerDown}
                      className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden cursor-crosshair select-none border"
                      style={{ borderColor: errors.coords ? COLORS.clay : "rgba(63,74,28,0.12)" }}
                    >
                      <ContourPattern />

                      {/* Pulse ring */}
                      <motion.div
                        className="absolute w-10 h-10 rounded-full pointer-events-none"
                        style={{
                          left: `${pinPos.x}%`,
                          top: `${pinPos.y}%`,
                          translateX: "-50%",
                          translateY: "-50%",
                          background: COLORS.turmeric,
                        }}
                        animate={{ scale: [1, 2.1, 1], opacity: [0.35, 0, 0.35] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                      />

                      {/* Pin */}
                      <motion.div
                        className="absolute flex items-center justify-center w-9 h-9 rounded-full shadow-lg cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${pinPos.x}%`,
                          top: `${pinPos.y}%`,
                          translateX: "-50%",
                          translateY: "-100%",
                          background: COLORS.canopy,
                        }}
                        whileTap={{ scale: 1.15 }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMapPointerDown(e);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleMapPointerDown(e);
                        }}
                      >
                        <MapPin className="w-5 h-5 text-white" fill={COLORS.canopy} />
                      </motion.div>

                      {/* Coordinate readout */}
                      <div
                        className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px]"
                        style={{ background: "rgba(247,243,233,0.85)", fontFamily: MONO_FONT, color: COLORS.canopy }}
                      >
                        <span>LAT {coords.lat || "—"}</span>
                        <span>LNG {coords.lng || "—"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                          Latitude
                        </label>
                        <input
                          className={inputBase}
                          style={{ ...inputStyle(errors.coords), fontFamily: MONO_FONT }}
                          placeholder="6.524400"
                          value={coords.lat}
                          onChange={(e) => handleCoordInput("lat", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                          Longitude
                        </label>
                        <input
                          className={inputBase}
                          style={{ ...inputStyle(errors.coords), fontFamily: MONO_FONT }}
                          placeholder="3.379200"
                          value={coords.lng}
                          onChange={(e) => handleCoordInput("lng", e.target.value)}
                        />
                      </div>
                    </div>
                    {fieldError("coords")}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Payment section */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl p-5 sm:p-6"
              style={{ background: COLORS.cream }}
            >
              <h2 className="text-lg font-bold mb-5" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, description }) => {
                  const selected = paymentMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(id);
                        setErrors((p) => ({ ...p, payment: undefined }));
                      }}
                      className="relative text-left rounded-2xl p-4 border-2 transition-all"
                      style={{
                        background: selected ? "rgba(63,74,28,0.06)" : COLORS.parchment,
                        borderColor: selected ? COLORS.canopy : "transparent",
                      }}
                    >
                      {selected && (
                        <CheckCircle2 className="absolute top-3 right-3 w-4 h-4" style={{ color: COLORS.canopy }} />
                      )}
                      <Icon className="w-5 h-5 mb-3" style={{ color: COLORS.canopy }} />
                      <p className="text-sm font-semibold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
                        {label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.55)" }}>
                        {description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {fieldError("payment")}

              <p
                className="flex items-center gap-1.5 text-xs mt-4"
                style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.5)" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Payments are encrypted and processed securely.
              </p>

              {placeError && (
                <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: COLORS.clay, fontFamily: BODY_FONT }}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {placeError}
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full mt-5 flex items-center justify-center gap-2 rounded-full py-3.5 font-bold text-base transition hover:opacity-90 disabled:opacity-70"
                style={{ background: COLORS.canopy, color: COLORS.cream, fontFamily: DISPLAY_FONT }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Placing your order…
                  </>
                ) : (
                  <>Confirm &amp; Place Order</>
                )}
              </button>
            </motion.section>
          </div>

          {/* ── Sidebar: order summary ── */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:col-span-2 rounded-3xl p-5 sm:p-6 lg:sticky lg:top-28 h-fit"
            style={{ background: COLORS.canopy }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.cream }}>
                Order Summary
              </h2>
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "rgba(192,138,67,0.25)", color: COLORS.turmeric, fontFamily: DISPLAY_FONT }}
              >
                <Clock className="w-3.5 h-3.5" /> 30–45 mins
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: BODY_FONT, color: "rgba(245,240,230,0.6)" }}>
                Your cart is empty. Add items from the menu to see them here.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 mb-5">
                {cartItems.map((item) => (
                  <li key={item.spoonacularId} className="flex items-center justify-between text-sm">
                    <span style={{ fontFamily: BODY_FONT, color: "rgba(245,240,230,0.9)" }}>
                      {item.quantity}× {item.name}
                    </span>
                    <span style={{ fontFamily: MONO_FONT, color: COLORS.cream }}>
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="h-px my-4" style={{ background: "rgba(245,240,230,0.15)" }} />

            <div className="flex flex-col gap-2.5 text-sm" style={{ fontFamily: BODY_FONT }}>
              <div className="flex items-center justify-between" style={{ color: "rgba(245,240,230,0.75)" }}>
                <span>Items total</span>
                <span style={{ fontFamily: MONO_FONT }}>{formatNaira(itemsTotal)}</span>
              </div>
              <div className="flex items-center justify-between" style={{ color: "rgba(245,240,230,0.75)" }}>
                <span>Delivery fee</span>
                <span style={{ fontFamily: MONO_FONT }}>{formatNaira(DELIVERY_FEE)}</span>
              </div>
              <div className="flex items-center justify-between" style={{ color: "rgba(245,240,230,0.75)" }}>
                <span>Tax (VAT 7.5%)</span>
                <span style={{ fontFamily: MONO_FONT }}>{formatNaira(tax)}</span>
              </div>
            </div>

            <div className="h-px my-4" style={{ background: "rgba(245,240,230,0.15)" }} />

            <div className="flex items-center justify-between">
              <span className="text-base font-bold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.cream }}>
                Total
              </span>
              <span className="text-xl font-bold" style={{ fontFamily: MONO_FONT, color: COLORS.turmeric }}>
                {formatNaira(total)}
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
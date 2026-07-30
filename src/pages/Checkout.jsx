import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  MapPin,
  Building2,
  KeyRound,
  StickyNote,
  Loader2,
  CreditCard,
  Smartphone,
  Banknote,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Navigation,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { initializePayment, createOrder, getLocationByIP } from "../services/api";
import { useGeolocation } from "../hooks/useGeolocation";
import { COLORS, DISPLAY_FONT, BODY_FONT, MONO_FONT, FONT_IMPORT_URL } from "../theme/brand";

const formatNaira = (n) =>
  `$${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DELIVERY_FEE = 5.0; // flat fee in dollars
const TAX_RATE = 0.075; // VAT

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: CreditCard, description: "Visa, Mastercard, Verve" },
  { id: "applepay", label: "Apple Pay", icon: Smartphone, description: "Face ID or Touch ID" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, description: "Pay when it arrives" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems, totalPrice, restaurantId, clearCart } = useCart();
  const { getCurrentLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Auto-fetch GPS location on mount
  useEffect(() => {
    const fetchGPSLocation = async () => {
      setLoadingLocation(true);
      setLocationError(null);
      
      // First try to get from navigation state (passed from Cart)
      if (location.state?.location) {
        const { latitude, longitude } = location.state.location;
        setCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
        setLoadingLocation(false);
        return;
      }

      // Otherwise fetch fresh GPS location
      const location = await getCurrentLocation();
      if (location) {
        setCoords({ lat: location.latitude.toFixed(6), lng: location.longitude.toFixed(6) });
      } else {
        setLocationError("Failed to get your GPS location. Please enable location access.");
      }
      setLoadingLocation(false);
    };

    fetchGPSLocation();
  }, [location.state, getCurrentLocation]);

  // ── Order totals (from the real cart) ──
  const itemsTotal = totalPrice || 0;
  const tax = itemsTotal * TAX_RATE;
  const total = itemsTotal + DELIVERY_FEE + (itemsTotal > 0 ? tax : 0);

  // Refresh GPS location
  const handleRefreshLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);
    const location = await getCurrentLocation();
    if (location) {
      setCoords({ lat: location.latitude.toFixed(6), lng: location.longitude.toFixed(6) });
    } else {
      setLocationError("Failed to get your GPS location. Please enable location access.");
    }
    setLoadingLocation(false);
  };

  // ── Validation ──
  const validate = () => {
    const next = {};
    if (!coords.lat || !coords.lng) {
      next.coords = "GPS coordinates are required for delivery.";
    }
    if (!paymentMethod) next.payment = "Select a payment method to continue.";
    setErrors(next);
    return next;
  };

  const handleConfirm = async () => {
    setPlaceError(null);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const order = await createOrder({
        restaurant: restaurantId,
        items: cartItems.map((item) => ({
          food: item.food || item.spoonacularId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        deliveryAddress: `GPS Coordinates: ${coords.lat}, ${coords.lng}`,
        paymentMethod,
        latitude: parseFloat(coords.lat),
        longitude: parseFloat(coords.lng),
      });

      if (paymentMethod !== "cod") {
        await initializePayment(order._id, total, user?.email || "guest@finestdiners.com");
      }

      clearCart();
      setOrderId(order._id);
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
        <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
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
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

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
              <div className="mb-5">
                <h2 className="text-lg font-bold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
                  Delivery Location
                </h2>
                <p className="text-xs mt-1" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.55)" }}>
                  GPS coordinates for instant driver navigation
                </p>
              </div>

              {loadingLocation && (
                <div className="mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.7)" }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Getting your GPS location...
                </div>
              )}

              {locationError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl px-3.5 py-3" style={{ background: "rgba(179,69,43,0.1)" }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: COLORS.clay }} />
                  <div>
                    <p className="text-sm" style={{ fontFamily: BODY_FONT, color: COLORS.clay }}>{locationError}</p>
                  </div>
                </div>
              )}

              {coords.lat && coords.lng && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl px-3.5 py-4" style={{ background: COLORS.parchment }}>
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: COLORS.canopy }} />
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ fontFamily: DISPLAY_FONT, color: COLORS.moss }}>
                      Your GPS Coordinates
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase mb-1" style={{ fontFamily: DISPLAY_FONT, color: "rgba(63,74,28,0.6)" }}>Latitude</p>
                        <p className="text-lg font-mono font-semibold" style={{ fontFamily: MONO_FONT, color: COLORS.canopy }}>{coords.lat}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase mb-1" style={{ fontFamily: DISPLAY_FONT, color: "rgba(63,74,28,0.6)" }}>Longitude</p>
                        <p className="text-lg font-mono font-semibold" style={{ fontFamily: MONO_FONT, color: COLORS.canopy }}>{coords.lng}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={loadingLocation}
                className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: COLORS.canopy, color: COLORS.cream, fontFamily: DISPLAY_FONT }}
              >
                {loadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {loadingLocation ? "Refreshing location…" : "Refresh GPS Location"}
              </button>

              {fieldError("coords")}
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
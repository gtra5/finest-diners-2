import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Loader2,
  CreditCard,
  Banknote,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Navigation,
} from "lucide-react";
import backgroundVectors from "../assets/backgroundVectors.webp";

import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import {
  initializePayment,
  verifyPayment,
  createOrder,
  getAddressFromCoords,
} from "../services/api";
import { openPaystackPopup } from "../services/paystack";
import { useGeolocation } from "../hooks/useGeolocation";
import {
  getCachedCoords,
  getCachedAddress,
  cacheCoords,
  cacheAddress,
} from "../utils/geo";
import TicketBand from "../components/TicketBand";

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";
const SURFACE = "#0f1410";
const BORDER = "#1e251e";

const formatNaira = (n) =>
  `$${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DELIVERY_FEE = 5.0; // flat fee in dollars
const TAX_RATE = 0.075; // VAT

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Card",
    icon: CreditCard,
    description: "Visa, Mastercard, Verve",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: Banknote,
    description: "Pay when it arrives",
  },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { cartItems, totalPrice, restaurantId, clearCart } = useCartStore();
  const {
    getCurrentLocation,
    loading: geoLoading,
    error: geoError,
  } = useGeolocation();

  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [readableAddress, setReadableAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationApprox, setLocationApprox] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Stores the raw coordinates AND looks up a human-readable address for them.
  // Reverse geocoding failure is non-fatal — the raw lat/lng is already enough
  // for the rider to navigate, the address is just a friendlier confirmation.
  // Addresses are cached per-coordinate for 24h so repeat checkouts don't burn
  // an OpenCage call every time.
  const updateCoordsAndAddress = async (latitude, longitude) => {
    setCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
    cacheCoords({ latitude, longitude });

    const cachedAddress = getCachedAddress(latitude, longitude);
    if (cachedAddress) {
      setReadableAddress(cachedAddress);
      return;
    }

    setAddressLoading(true);
    try {
      const address = await getAddressFromCoords(latitude, longitude);
      const formatted = address.formattedAddress || "";
      setReadableAddress(formatted);
      if (formatted) cacheAddress(latitude, longitude, formatted);
    } catch (err) {
      console.error(
        "[Checkout] Address lookup failed (lat/lng still valid):",
        err?.response?.data?.message || err.message,
      );
      setReadableAddress("");
    } finally {
      setAddressLoading(false);
    }
  };

  // Auto-fetch location on mount. Shows any cached fix instantly, then refines
  // with a fresh GPS/IP read in the background so the page never sits empty.
  useEffect(() => {
    // First try to get from navigation state (passed from Cart)
    if (location.state?.location) {
      const { latitude, longitude } = location.state.location;
      updateCoordsAndAddress(latitude, longitude);
      return;
    }

    // Instant paint from cache (no spinner, no permission wait).
    const cached = getCachedCoords();
    if (cached) updateCoordsAndAddress(cached.latitude, cached.longitude);

    // Then get the freshest fix available.
    const fetchGPSLocation = async () => {
      setLoadingLocation(true);
      setLocationError(null);
      setLocationApprox(false);

      const result = await getCurrentLocation();
      if (result) {
        updateCoordsAndAddress(result.latitude, result.longitude);
        if (
          result.source === "ip" ||
          (result.accuracy && result.accuracy > 1000)
        ) {
          setLocationApprox(true);
        }
      } else {
        setLocationError(
          "Could not get your location. Turn on Wi-Fi/GPS or allow browser location, then press Refresh.",
        );
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
    setLocationApprox(false);
    const location = await getCurrentLocation();
    if (location) {
      await updateCoordsAndAddress(location.latitude, location.longitude);
      if (
        location.source === "ip" ||
        (location.accuracy && location.accuracy > 1000)
      ) {
        setLocationApprox(true);
      }
    } else {
      setLocationError(
        "Could not get your location. Turn on Wi-Fi/GPS or allow browser location, then press Refresh.",
      );
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
        deliveryAddress:
          readableAddress || `GPS Coordinates: ${coords.lat}, ${coords.lng}`,
        paymentMethod,
        latitude: parseFloat(coords.lat),
        longitude: parseFloat(coords.lng),
      });

      if (paymentMethod === "cod") {
        // No payment step — clear the cart and mark the order placed.
        clearCart();
        setOrderId(order._id);
        setOrderPlaced(true);
      } else {
        // Card → open the Paystack popup. The backend already initialized the
        // transaction (access_code) from the authoritative order total, so the
        // popup charges exactly the right amount.
        const payment = await initializePayment(
          order._id,
          total,
          user?.email || "guest@finestdiners.com",
        );

        await openPaystackPopup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user?.email || "guest@finestdiners.com",
          amount: Math.round(total * 100), // server reconciles the real total
          access_code: payment.access_code,
          onSuccess: async (res) => {
            try {
              const reference =
                typeof res === "string"
                  ? res
                  : res?.transaction?.reference ||
                    res?.reference ||
                    res?.trxref;
              if (reference) await verifyPayment(reference);
            } catch (e) {
              // Verification hiccup — order still exists; let the user go track it.
              console.error(
                "verify after success failed:",
                e?.response?.data || e.message,
              );
            } finally {
              clearCart();
              setOrderId(order._id);
              setOrderPlaced(true);
            }
          },
          onCancel: () => {
            setSubmitting(false);
            setPlaceError(
              "Payment was cancelled. Your cart and order draft were kept.",
            );
          },
        });
      }
    } catch (err) {
      setPlaceError(
        err?.response?.data?.message ||
          "Something went wrong placing your order. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const fieldError = (key) =>
    errors[key] ? (
      <p
        className="mt-1.5 flex items-center gap-1 text-xs font-mono"
        style={{ color: "#b33939" }}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {errors[key]}
      </p>
    ) : null;

  // ── Success state ──
  if (orderPlaced) {
    return (
      <div
        className="min-h-screen text-white flex items-center justify-center px-6 sm:px-12 lg:px-16 pt-20 sm:pt-24 pb-8 sm:pb-10"
        style={{ background: DARK }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md border p-8 text-center"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 260,
              damping: 18,
            }}
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: OLIVE }}
          >
            <CheckCircle2 className="w-9 h-9 text-white" />
          </motion.div>
          <h2
            className="text-2xl font-black mb-2"
            style={{ fontFamily: "Arial Black, sans-serif", color: "#fff" }}
          >
            ORDER CONFIRMED
          </h2>
          <p className="text-sm font-mono mb-1" style={{ color: "#5a6a5a" }}>
            Reference{" "}
            <span style={{ color: OLIVE, fontWeight: 600 }}>{orderId}</span>
          </p>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mt-4 mb-6 text-xs font-semibold"
            style={{
              background: "rgba(107,124,47,0.15)",
              color: OLIVE_LIGHT,
              fontFamily: "Arial Black, sans-serif",
            }}
          >
            <Clock className="w-3.5 h-3.5" /> ARRIVING IN 30–45 MINS
          </div>

          <div className="mb-6 -mx-8">
            <TicketBand label="ADMIT ONE · CONFIRMED" />
          </div>

          <motion.button
            onClick={() => navigate("/orders")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 font-black tracking-tighter py-3 transition"
            style={{
              background: OLIVE,
              color: "#fff",
              fontFamily: "Arial Black, sans-serif",
              fontSize: "14px",
            }}
          >
            TRACK MY ORDER <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white px-6 sm:px-12 lg:px-16 pt-20 sm:pt-24 pb-8 sm:pb-10"
      style={{
        backgroundImage: `url(${backgroundVectors})`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[9px] tracking-[0.35em] font-semibold mb-4 uppercase"
            style={{ color: OLIVE }}
          >
            CHECKOUT
          </motion.p>
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="font-black leading-none tracking-tighter"
            style={{
              fontSize: "clamp(48px, 8vw, 72px)",
              color: DARK,
              fontFamily: "Arial Black, sans-serif",
              lineHeight: 0.9,
            }}
          >
            COMPLETE
            <br />
            <span style={{ color: OLIVE }}>ORDER.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-mono mt-3"
            style={{ color: "#5a6a5a" }}
          >
            Tell us exactly where to bring your order.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-6 sm:mb-8"
        >
          <TicketBand label="ORDER TICKET" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── Main column ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Delivery location card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="border p-5 sm:p-6"
              style={{ background: SURFACE, borderColor: BORDER, borderRadius: "20px" }}
            >
              <div className="mb-5">
                <h2
                  className="text-[9px] tracking-[0.25em] font-semibold mb-2 uppercase"
                  style={{ color: OLIVE_LIGHT }}
                >
                  DELIVERY LOCATION
                </h2>
                <p className="text-xs font-mono" style={{ color: "#5a6a5a" }}>
                  GPS coordinates for instant driver navigation
                </p>
              </div>

              {loadingLocation && (
                <div
                  className="mb-4 flex items-center gap-2 text-sm font-mono"
                  style={{ color: "#7a8a7a" }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> Getting your GPS
                  location...
                </div>
              )}

              {locationError && (
                <div
                  className="mb-4 flex items-start gap-2.5 px-3.5 py-3 border"
                  style={{
                    borderColor: "#b33939",
                    background: "rgba(179,69,43,0.1)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "#b33939" }}
                  />
                  <div>
                    <p
                      className="text-sm font-mono"
                      style={{ color: "#b33939" }}
                    >
                      {locationError}
                    </p>
                  </div>
                </div>
              )}

              {locationApprox && !locationError && (
                <div
                  className="mb-4 flex items-center gap-2 px-3.5 py-3 border"
                  style={{
                    borderColor: "#8a7a2a",
                    background: "rgba(138,122,42,0.12)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#c9b458" }}
                  />
                  <p className="text-xs font-mono" style={{ color: "#c9b458" }}>
                    Showing an approximate location. Allow browser location
                    (GPS) for precise delivery.
                  </p>
                </div>
              )}

              {coords.lat && coords.lng && (
                <div
                  className="mb-4 flex items-start gap-2.5 px-3.5 py-4"
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid",
                    borderColor: BORDER,
                  }}
                >
                  <MapPin
                    className="w-5 h-5 shrink-0 mt-0.5"
                    style={{ color: OLIVE }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                      style={{
                        color: OLIVE_LIGHT,
                        fontFamily: "Arial Black, sans-serif",
                      }}
                    >
                      YOUR GPS COORDINATES
                    </p>

                    {addressLoading ? (
                      <p
                        className="text-xs mb-3 flex items-center gap-1.5 font-mono"
                        style={{ color: "#5a6a5a" }}
                      >
                        <Loader2 className="w-3 h-3 animate-spin" /> Looking up
                        address…
                      </p>
                    ) : readableAddress ? (
                      <p
                        className="text-sm font-medium mb-3 font-mono"
                        style={{ color: "#fff" }}
                      >
                        {readableAddress}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3"
                    style={{  borderRadius: "20px" }}
                    >
                      <div>
                        <p
                          className="text-[10px] uppercase mb-1 font-mono"
                          style={{ color: "#5a6a5a", borderRadius: "20px" }}
                        >
                          LATITUDE
                        </p>
                        <p
                          className="text-lg font-mono font-semibold"
                          style={{ color: OLIVE }}
                        >
                          {coords.lat}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[10px] uppercase mb-1 font-mono"
                          style={{ color: "#5a6a5a" }}
                        >
                          LONGITUDE
                        </p>
                        <p
                          className="text-lg font-mono font-semibold"
                          style={{ color: OLIVE }}
                        >
                          {coords.lng}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handleRefreshLocation}
                disabled={loadingLocation}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 font-black tracking-tighter py-3 text-sm transition disabled:opacity-60"
                style={{
                  background: OLIVE,
                  color: "#fff",
                  fontFamily: "Arial Black, sans-serif",
                   borderRadius: "20px"
                }}
              >
                {loadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {loadingLocation
                  ? "REFRESHING LOCATION…"
                  : "REFRESH GPS LOCATION"}
              </motion.button>

              {fieldError("coords")}
            </motion.section>

            {/* Payment section */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border p-5 sm:p-6"
              style={{ background: SURFACE, borderColor: BORDER, borderRadius: "20px" }}
            >
              <h2
                className="text-[9px] tracking-[0.25em] font-semibold mb-5 uppercase"
                style={{ color: OLIVE_LIGHT }}
              >
                PAYMENT METHOD
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                {PAYMENT_METHODS.map(
                  ({ id, label, icon: Icon, description }) => {
                    const selected = paymentMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(id);
                          setErrors((p) => ({ ...p, payment: undefined }));
                        }}
                        className="relative text-left border-2 transition-all p-4"
                        style={{
                          background: selected
                            ? "rgba(107,124,47,0.15)"
                            : "#0d0d0d",
                          borderColor: selected ? OLIVE : BORDER,
                        }}
                      >
                        {selected && (
                          <CheckCircle2
                            className="absolute top-3 right-3 w-4 h-4"
                            style={{ color: OLIVE }}
                          />
                        )}
                        <Icon
                          className="w-5 h-5 mb-3"
                          style={{ color: OLIVE }}
                        />
                        <p
                          className="text-sm font-semibold"
                          style={{
                            fontFamily: "Arial Black, sans-serif",
                            color: "#fff",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-xs mt-0.5 font-mono"
                          style={{ color: "#5a6a5a" }}
                        >
                          {description}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
              {fieldError("payment")}

              <p
                className="flex items-center gap-1.5 text-xs mt-4 font-mono"
                style={{ color: "#5a6a5a" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Payments are encrypted
                and processed securely.
              </p>

              {placeError && (
                <p
                  className="mt-3 flex items-center gap-1.5 text-xs font-mono"
                  style={{ color: "#b33939" }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {placeError}
                </p>
              )}

              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-5 flex items-center justify-center gap-2 font-black tracking-tighter py-3.5 text-base transition disabled:opacity-70"
                style={{
                  background: OLIVE,
                  color: "#fff",
                  fontFamily: "Arial Black, sans-serif",
                   borderRadius: "20px"
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> PLACING YOUR
                    ORDER…
                  </>
                ) : (
                  <>CONFIRM & PLACE ORDER</>
                )}
              </motion.button>
            </motion.section>
          </div>

          {/* ── Sidebar: order summary ── */}
    <motion.aside
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.15 }}
  className="lg:col-span-2 relative overflow-hidden p-5 sm:p-6 lg:sticky lg:top-28 h-fit"
  style={{ background: OLIVE, borderColor: "#6B7C2F", borderRadius: "20px" }}
>
  {/* Background texture — clipped to the card, blended into the olive */}
  <img
    src={backgroundVectors}
    alt=""
    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    style={{
      mixBlendMode: "multiply",
      transform: "scale(2.5)",
      transformOrigin: "center",
    }}
  />

  
 

  
 
   
  
            <div className="relative flex items-center justify-between mb-5">
              <h2
                className="text-[9px] tracking-[0.25em] font-semibold uppercase"
                style={{ color: "DARK" }}
              >
                ORDER SUMMARY
              </h2>
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "rgba(107,124,47,0.15)",
                  color: OLIVE_LIGHT,
                  fontFamily: "Arial Black, sans-serif",
                }}
              >
                <Clock className="w-3.5 h-3.5" /> 30–45 MINS
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-sm font-mono" style={{ color: "#c2c4c2" }}>
                Your cart is empty. Add items from the menu to see them here.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 mb-5">
                {cartItems.map((item) => (
                  <li
                    key={item.spoonacularId}
                    className="flex items-center justify-between text-sm font-mono"
                  >
                    <span style={{ color: "#c2c4c2" }}>
                      {item.quantity}× {item.name}
                    </span>
                    <span style={{ color: "#fff" }}>
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="h-px my-4" style={{ background: "#5d645d" }} />

            <div
              className="flex flex-col gap-2.5 text-sm font-mono"
              style={{ color: "#c2c4c2" }}
            >
              <div className="flex items-center justify-between">
                <span>Items total</span>
                <span style={{ color: "#fff" }}>{formatNaira(itemsTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery fee</span>
                <span style={{ color: "#fff" }}>
                  {formatNaira(DELIVERY_FEE)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax (VAT 7.5%)</span>
                <span style={{ color: "#fff" }}>{formatNaira(tax)}</span>
              </div>
            </div>

            <div className="h-px my-4" style={{ background: "#5d645d" }} />

            <div className="flex items-center justify-between">
              <span
                className="text-base font-black"
                style={{ fontFamily: "Arial Black, sans-serif", color: "#fff" }}
              >
                TOTAL
              </span>
              <span
                className="text-xl font-black font-mono"
                style={{ color: OLIVE_LIGHT }}
              >
                {formatNaira(total)}
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

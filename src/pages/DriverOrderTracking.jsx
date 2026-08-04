import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

import { getOrder } from "../services/api";
import { useOrderLiveLocation } from "../hooks/useOrderLiveLocation";
import { coordsToPin } from "../utils/mapPlaceholder";

const OLIVE = "#6B7C2F";
const OLIVE_DIM = "#3a4419";
const OLIVE_LIGHT = "#D4E2B9";
const DARK = "#050A0A";
const SURFACE = "#0f1410";
const BORDER = "#1e251e";

// A driver opens this page for one assigned order (e.g. /driver/orders/:orderId).
// This is a starting point, not a full driver dashboard — plug it into
// whatever routing/order-list screen you build for drivers.
export default function DriverOrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { location, trackingEnded, error: trackingError } = useOrderLiveLocation(orderId);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.response?.data?.message || "Couldn't load this order.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const pinPos = location ? coordsToPin(location.latitude, location.longitude) : null;

  const secondsAgo = location?.updatedAt
    ? Math.max(0, Math.round((Date.now() - new Date(location.updatedAt).getTime()) / 1000))
    : null;
  const isStale = secondsAgo != null && secondsAgo > 30;

  return (
    <div className="min-h-screen text-white px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-10" style={{ background: DARK }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[9px] tracking-[0.35em] font-semibold mb-3 sm:mb-4 uppercase"
            style={{ color: OLIVE }}
          >
            DRIVER PORTAL
          </motion.p>
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="font-black leading-none tracking-tighter"
            style={{
              fontSize: "clamp(48px, 8vw, 72px)",
              color: "#fff",
              fontFamily: "Arial Black, sans-serif",
              lineHeight: 0.9,
            }}
          >
            LIVE
            <br />
            <span style={{ color: OLIVE }}>TRACKING.</span>
          </motion.h1>
          {order && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-mono mt-3"
              style={{ color: "#5a6a5a" }}
            >
              Order {order._id} — {order.customer?.name || "Customer"}
            </motion.p>
          )}
        </motion.div>

        {loadError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm font-mono"
            style={{ color: "#b33939" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
          </motion.div>
        )}

        {trackingError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-sm font-mono"
            style={{ color: "#b33939" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" /> {trackingError}
          </motion.div>
        )}

        {trackingEnded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ background: "rgba(107,124,47,0.15)", color: OLIVE, fontFamily: "Arial Black, sans-serif" }}
          >
            <CheckCircle2 className="w-4 h-4" /> This order is complete — tracking has ended.
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden border"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          {pinPos ? (
            <>
              <motion.div
                className="absolute w-10 h-10 rounded-full pointer-events-none"
                style={{
                  left: `${pinPos.x}%`,
                  top: `${pinPos.y}%`,
                  translateX: "-50%",
                  translateY: "-50%",
                  background: OLIVE_LIGHT,
                }}
                animate={{ scale: [1, 2.1, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <div
                className="absolute flex items-center justify-center w-9 h-9 rounded-full shadow-lg"
                style={{
                  left: `${pinPos.x}%`,
                  top: `${pinPos.y}%`,
                  translateX: "-50%",
                  translateY: "-100%",
                  background: OLIVE,
                }}
              >
                <Navigation className="w-5 h-5 text-white" fill={OLIVE} />
              </div>

              <div
                className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px]"
                style={{ background: SURFACE, fontFamily: "monospace", color: OLIVE_LIGHT, borderColor: BORDER, border: "1px solid" }}
              >
                <span>
                  LAT {location.latitude.toFixed?.(6) ?? location.latitude} · LNG{" "}
                  {location.longitude.toFixed?.(6) ?? location.longitude}
                </span>
                <span
                  className="flex items-center gap-1"
                  style={{ color: isStale ? "#b33939" : OLIVE_LIGHT }}
                >
                  <Clock className="w-3 h-3" />
                  {secondsAgo != null ? `${secondsAgo}s ago` : "—"}
                </span>
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-sm text-center px-6 font-mono"
              style={{ color: "#5a6a5a" }}
            >
              Waiting for the customer's location…
            </div>
          )}
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 border"
            style={{ background: SURFACE, borderColor: BORDER }}
          >
            <p className="text-[9px] tracking-[0.25em] font-semibold mb-2 uppercase" style={{ color: OLIVE_LIGHT }}>
              DELIVERY ADDRESS
            </p>
            <p className="text-sm font-mono" style={{ color: "#fff" }}>
              {order.deliveryAddress}
            </p>
            {order.notes && (
              <p className="text-xs font-mono mt-2" style={{ color: "#5a6a5a" }}>
                Note: {order.notes}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
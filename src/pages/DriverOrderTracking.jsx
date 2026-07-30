import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

import { getOrder } from "../services/api";
import { useOrderLiveLocation } from "../hooks/useOrderLiveLocation";
import { COLORS, DISPLAY_FONT, BODY_FONT, MONO_FONT, FONT_IMPORT_URL } from "../theme/brand";
import { coordsToPin } from "../utils/mapPlaceholder";

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
    <div className="min-h-screen pt-10 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
            Live Delivery Tracking
          </h1>
          {order && (
            <p className="text-sm mt-1" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.6)" }}>
              Order {order._id} — {order.customer?.name || "Customer"}
            </p>
          )}
        </div>

        {loadError && (
          <p className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.clay, fontFamily: BODY_FONT }}>
            <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
          </p>
        )}

        {trackingError && (
          <p className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.clay, fontFamily: BODY_FONT }}>
            <AlertCircle className="w-4 h-4 shrink-0" /> {trackingError}
          </p>
        )}

        {trackingEnded && (
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ background: "rgba(63,74,28,0.06)", color: COLORS.canopy, fontFamily: DISPLAY_FONT }}
          >
            <CheckCircle2 className="w-4 h-4" /> This order is complete — tracking has ended.
          </div>
        )}

        <div
          className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden"
          style={{ background: COLORS.parchment }}
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
                  background: COLORS.turmeric,
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
                  background: COLORS.canopy,
                }}
              >
                <Navigation className="w-5 h-5 text-white" fill={COLORS.canopy} />
              </div>

              <div
                className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px]"
                style={{ background: "rgba(247,243,233,0.9)", fontFamily: MONO_FONT, color: COLORS.canopy }}
              >
                <span>
                  LAT {location.latitude.toFixed?.(6) ?? location.latitude} · LNG{" "}
                  {location.longitude.toFixed?.(6) ?? location.longitude}
                </span>
                <span
                  className="flex items-center gap-1"
                  style={{ color: isStale ? COLORS.clay : COLORS.canopy }}
                >
                  <Clock className="w-3 h-3" />
                  {secondsAgo != null ? `${secondsAgo}s ago` : "—"}
                </span>
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-sm text-center px-6"
              style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.55)" }}
            >
              Waiting for the customer's location…
            </div>
          )}
        </div>

        {order && (
          <div className="rounded-2xl p-4" style={{ background: COLORS.cream }}>
            <p className="text-sm font-semibold mb-1" style={{ fontFamily: DISPLAY_FONT, color: COLORS.canopy }}>
              Delivery Address
            </p>
            <p className="text-sm" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.75)" }}>
              {order.deliveryAddress}
            </p>
            {order.notes && (
              <p className="text-xs mt-2" style={{ fontFamily: BODY_FONT, color: "rgba(63,74,28,0.55)" }}>
                Note: {order.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
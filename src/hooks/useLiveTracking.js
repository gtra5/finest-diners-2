import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

// Must match ACTIVE_STATUSES in backend/sockets/orderTracking.js.
const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery"];

// Streams the customer's live position into the order's tracking room while
// the order is active. Mount this on whatever screen shows "Track My Order"
// (the order-detail/tracking page) — not in Checkout, since there's no real
// order (or status) to track until after it's placed.
//
// Usage: useLiveTracking(order._id, order.status);
export const useLiveTracking = (orderId, status) => {
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!orderId || !ACTIVE_STATUSES.includes(status)) return undefined;
    if (!navigator.geolocation) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => socket.emit("join_order_room", { orderId });
    socket.on("connect", join);
    if (socket.connected) join();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Light client-side gate on top of the server's own throttle —
        // watchPosition can fire far more often than we need and this
        // saves battery/data without affecting tracking accuracy.
        const now = Date.now();
        if (now - lastSentRef.current < 3000) return;
        lastSentRef.current = now;

        socket.emit("location:update", {
          orderId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {}, // a missed tick isn't worth surfacing — the last known point still stands
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      socket.off("connect", join);
      socket.emit("leave_order_room", { orderId });
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [orderId, status]);
};
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../services/socket";

// Cooldown between map re-renders. watchPosition on the customer's phone can
// fire several times per second; the map only needs to move once every second.
const LOCATION_THROTTLE_MS = 1000;

// Driver/admin side: joins an order's tracking room as a read-only listener
// and returns the customer's latest known location as it streams in.
//
// Usage: const { location, trackingEnded, error } = useOrderLiveLocation(orderId);
export const useOrderLiveLocation = (orderId) => {
  const [location, setLocation] = useState(null);
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [error, setError] = useState(null);

  // Throttle re-renders of the map to at most one location update per second
  // instead of re-rendering on every socket event.
  const lastUpdateRef = useRef(0);
  const throttledSetLocation = (payload) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < LOCATION_THROTTLE_MS) return;
    lastUpdateRef.current = now;
    setLocation(payload);
  };

  useEffect(() => {
    if (!orderId) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => socket.emit("join_order_room", { orderId });

    // The snapshot emitted on join is the last known point — apply it
    // immediately (it's one payload, not a stream).
    const onCurrent = (payload) => {
      if (payload.orderId === orderId) setLocation(payload);
    };
    const onUpdate = (payload) => {
      if (payload.orderId === orderId) throttledSetLocation(payload);
    };
    const onEnded = (payload) => {
      if (payload.orderId === orderId) setTrackingEnded(true);
    };
    const onError = (payload) => setError(payload.message);

    socket.on("connect", join);
    socket.on("location:current", onCurrent);
    socket.on("location:update", onUpdate);
    socket.on("tracking:ended", onEnded);
    socket.on("tracking:error", onError);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      socket.off("location:current", onCurrent);
      socket.off("location:update", onUpdate);
      socket.off("tracking:ended", onEnded);
      socket.off("tracking:error", onError);
      socket.emit("leave_order_room", { orderId });
    };
  }, [orderId]);

  return { location, trackingEnded, error };
};

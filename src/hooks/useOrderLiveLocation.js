import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

// Driver/admin side: joins an order's tracking room as a read-only listener
// and returns the customer's latest known location as it streams in.
//
// Usage: const { location, trackingEnded, error } = useOrderLiveLocation(orderId);
export const useOrderLiveLocation = (orderId) => {
  const [location, setLocation] = useState(null);
  const [trackingEnded, setTrackingEnded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => socket.emit("join_order_room", { orderId });

    const onCurrent = (payload) => {
      if (payload.orderId === orderId) setLocation(payload);
    };
    const onUpdate = (payload) => {
      if (payload.orderId === orderId) setLocation(payload);
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
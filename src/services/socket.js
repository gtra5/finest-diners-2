import { io } from "socket.io-client";

// Same env var already used for REST calls in api.js.
const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("VITE_API_URL is not set. Add it to your .env file.");
}

// The REST API is mounted under /api (see server.js), but Socket.IO attaches
// directly to the bare HTTP server — strip a trailing /api so we connect to
// the right host. Set VITE_SOCKET_URL explicitly if your setup differs
// (e.g. different ports in local dev).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || baseURL.replace(/\/api\/?$/, "");

let socket = null;

// Lazily creates a single shared socket, authenticated the same way as
// every REST call. `autoConnect: false` — nothing opens a connection until
// a hook that actually needs live tracking calls socket.connect().
export const getSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    // A function (not a plain object) so the token is read fresh on every
    // (re)connect attempt — picks up login/logout/token refresh automatically.
    auth: (cb) => cb({ token: localStorage.getItem("token") }),
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
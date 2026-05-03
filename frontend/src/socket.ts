import { io, Socket } from "socket.io-client";

// Backend URL — change via VITE_SOCKET_URL if needed
const URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
  "http://localhost:3001";

export const SERVER_URL = URL;

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

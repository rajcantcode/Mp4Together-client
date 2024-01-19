import { useMemo } from "react";
import io from "socket.io-client";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export const socket = io(baseUrl);

export const joinSocketRoom = (room, socket, username) => {
  socket.emit("join", { room, username });
};

export const sendMessage = (room, msgObj, socket) => {
  socket.emit("sent-message", { room, msgObj });
};

// Other socket-related functions...

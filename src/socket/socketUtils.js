import io from "socket.io-client";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const socketObj = {
  socket: null,
};

export const getSocket = () => {
  if (socketObj.socket) {
    return socketObj.socket;
  }
  const socket = io(baseUrl, {
    withCredentials: true,
  });
  socketObj.socket = socket;
  socket.on("disconnect", (reason) => {
    socketObj.socket = null;
    console.log("Socket disconnected");
  });
  return socket;
};

export const joinSocketRoom = (room, socket, username) => {
  socket.emit("join", { room, username });
};

export const sendMessage = (room, msgObj, socket) => {
  socket.emit("sent-message", { room, msgObj });
};

// Other socket-related functions...

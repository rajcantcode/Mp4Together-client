import io from "socket.io-client";

const baseUrl = import.meta.env.VITE_BACKEND_URL;
const sfuServerUrl = import.meta.env.VITE_SFU_SERVER_URL;

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

const sfuSocketObj = {
  socket: null,
};

export const getSfuSocket = () => {
  if (sfuSocketObj.socket) {
    return sfuSocketObj.socket;
  }
  const sfuSocket = io(sfuServerUrl, { withCredentials: true });
  sfuSocketObj.socket = sfuSocket;
  sfuSocket.on("connect", () => {
    console.log("sfu socket connected, " + sfuSocket.id);
  });
  sfuSocket.on("disconnect", (reason) => {
    sfuSocketObj.socket = null;
    console.log("Sfu socket disconnected");
  });
  sfuSocket.on("close", (reason) => {
    console.log("sfuSocket closed");
    console.log(reason);
  });
  return sfuSocket;
};

export const joinSocketRoom = (room, socket, username) => {
  socket.emit("join", { room, username });
};

export const sendMessage = (room, msgObj, socket) => {
  socket.emit("sent-message", { room, msgObj });
};

// Other socket-related functions...

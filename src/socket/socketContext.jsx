// Currently not used anywhere in project

import { useContext, useEffect, useState, createContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const joinSocketRoom = (room, socket, username) => {
  socket.emit("join", { room, username });
};

export const sendMessage = (room, msgObj, socket) => {
  socket.emit("sent-message", { room, msgObj });
};

export const SocketProvider = ({ children }) => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const connection = io(baseUrl, {
      withCredentials: true,
    });
    connection.on("connect_error", () => {
      console.log("Connection issue :(");
    });
    setSocket(connection);
    return () => {
      connection.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;

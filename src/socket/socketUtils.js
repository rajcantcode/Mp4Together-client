export const joinSocketRoom = (room, socket, username, guest) => {
  socket.emit("join", { room, username, guest });
};

export const sendMessage = (room, msgObj, socket, username) => {
  socket.emit("sent-message", { room, msgObj, username });
};

// Other socket-related functions...

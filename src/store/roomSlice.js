import { createSlice } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

export const roomSlice = createSlice({
  name: "roomInfo",
  initialState: {
    roomId: "",
    socketRoomId: "",
    members: [],
    admins: [],
    isRoomValid: true,
    isSocketRoomValid: true,
  },
  reducers: {
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },
    setSocketRoomId: (state, action) => {
      state.socketRoomId = action.payload;
    },
    setRoomValidity: (state, action) => {
      state.isRoomValid = action.payload;
    },
    setSocketRoomValidity: (state, action) => {
      state.isSocketRoomValid = action.payload;
    },
    setRoomMembers: (state, action) => {
      state.members = [...action.payload];
    },
    setRoomAdmins: (state, action) => {
      state.admins = [...action.payload];
    },
    addNewMember: (state, action) => {
      state.members.push(action.payload);
    },
    addNewAdmin: (state, action) => {
      state.admins.push(action.payload);
    },
  },
});

export const {
  setRoomId,
  setSocketRoomId,
  setRoomValidity,
  setSocketRoomValidity,
  setRoomMembers,
  setRoomAdmins,
  addNewMember,
  addNewAdmin,
} = roomSlice.actions;
export default roomSlice.reducer;

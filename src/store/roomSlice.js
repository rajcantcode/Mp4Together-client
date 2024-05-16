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
    membersMicState: {},
    membersMuteState: {},
    kickSnackbarInfo: { show: false, title: "", color: "neutral" },
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
    setRoomMembersMicState: (state, action) => {
      if (Array.isArray(action.payload)) {
        const [username, status] = action.payload;
        state.membersMicState[username] = status;
        return;
      } else {
        state.membersMicState = { ...action.payload };
      }
    },
    setRoomMembersMuteState: (state, action) => {
      if (Array.isArray(action.payload)) {
        const [username, status] = action.payload;
        state.membersMuteState[username] = status;
        return;
      } else {
        state.membersMuteState = { ...action.payload };
      }
    },
    setKickSnackbarInfo: (state, action) => {
      state.kickSnackbarInfo = { ...action.payload };
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
  setRoomMembersMicState,
  setRoomMembersMuteState,
  setKickSnackbarInfo,
} = roomSlice.actions;
export default roomSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: "userInfo",
  initialState: {
    username: "",
    email: "",
    userRoomId: "",
    userSocketRoomId: "",
    isAdmin: false,
    isGuest: false,
  },
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setUserRoomId: (state, action) => {
      state.userRoomId = action.payload;
    },
    setUserSocketRoomId: (state, action) => {
      state.userSocketRoomId = action.payload;
    },
    setIsAdmin: (state, action) => {
      state.isAdmin = action.payload;
    },
    setIsGuest: (state, action) => {
      state.isGuest = action.payload;
    },
  },
});

export const {
  setUsername,
  setEmail,
  setUserRoomId,
  setUserSocketRoomId,
  setIsAdmin,
  setIsGuest,
} = userSlice.actions;
export default userSlice.reducer;

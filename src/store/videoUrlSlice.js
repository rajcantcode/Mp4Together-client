// Slice for video URLs
import { createSlice } from "@reduxjs/toolkit";

export const videoUrlSlice = createSlice({
  name: "videoUrl",
  initialState: {
    videoUrl: "",
    videoId: "",
    startTime: 0,
    videoUrlValidity: false,
  },
  reducers: {
    setVideoUrl: (state, action) => {
      state.videoUrl = action.payload;
    },
    setVideoId: (state, action) => {
      state.videoId = action.payload;
    },
    setVideoStartTime: (state, action) => {
      state.startTime = action.payload;
    },
    setVideoUrlValidity: (state, action) => {
      state.videoUrlValidity = action.payload;
    },
  },
});

export const {
  setVideoUrl,
  setVideoId,
  setVideoStartTime,
  setVideoUrlValidity,
} = videoUrlSlice.actions;
export default videoUrlSlice.reducer;

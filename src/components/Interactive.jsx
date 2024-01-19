// This file will contain the video element, chat element and voice chat components
import React from "react";
import { Box } from "@mui/material";
import VideoPlayer from "./VideoPlayer";
import ChatBox from "./ChatBox";
import { useSelector } from "react-redux";

const Interactive = () => {
  const { videoUrlValidity } = useSelector((state) => state.videoUrl);
  return (
    <Box
      id="interactivity-container"
      sx={{ width: "100%", display: { xs: "block", md: "flex" } }}
    >
      <Box
        id="video-container"
        sx={{
          width: { xs: "100%", md: "65%" },
          height: { xs: "180px", md: "420px" },
          backgroundColor: "orange",
        }}
      >
        {videoUrlValidity && <VideoPlayer />}
      </Box>
      <Box
        id="chat-container"
        sx={{
          width: { xs: "100%", md: "35%" },
          height: {
            xs: `calc(100vh - (56px + 100px + 180px))`,
            md: `calc(100vh - (64px + 100px))`,
          },
        }}
      >
        <ChatBox />
      </Box>
    </Box>
  );
};
export default Interactive;

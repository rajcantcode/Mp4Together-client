import * as React from "react";
import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { useSelector, useDispatch } from "react-redux";
import {
  setVideoId,
  setVideoUrlValidity,
  setVideoStartTime,
  setVideoUrl,
} from "../store/videoUrlSlice";
import { getSocket } from "../socket/socketUtils.js";
import axios, { AxiosError } from "axios";
import { resetVideoSlice } from "../../services/helpers";
import { useParams } from "react-router-dom";
import MemberList from "./MemberList.jsx";

export default function LinkInput() {
  const socket = getSocket();
  const [inpVideoUrl, setInpVideoUrl] = useState("");
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  const { roomId } = useParams();
  const { socketRoomId } = useSelector((state) => state.roomInfo);
  const dispatch = useDispatch();
  const [isServerError, setIsServerError] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState("");

  useEffect(() => {
    const handleNewVideoUrl = ({ videoUrl, videoId, startTime }) => {
      dispatch(setVideoUrl(videoUrl));
      dispatch(setVideoId(videoId));
      dispatch(setVideoStartTime(startTime));
      dispatch(setVideoUrlValidity(true));
    };
    socket.on("transmit-new-video-url", handleNewVideoUrl);
    return () => {
      socket.off("transmit-new-video-url", handleNewVideoUrl);
    };
  }, [socket]);
  // useEffect(() => {
  //   console.log("isAdmin useEffect from LinkInput: ", isAdmin);
  // }, [isAdmin]);

  const handleSnackbarClose = () => {
    setIsServerError(false);
  };
  const validateVideoUrl = async (url) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL;

      const urlRegex =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/|youtube\.com\/(?:[^\/\n\s]+\/)?live\/)([a-zA-Z0-9_-]+)(?:[?&]t=([a-zA-Z0-9_-]+))?/;

      if (!urlRegex.test(url)) throw new Error("Invalid youtube url");

      const regexArr = url.match(urlRegex);
      const videoId = regexArr[1];

      await axios.get(
        `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`
      );

      // Create a noCookie url for ifreme-embed
      const noCookieUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

      // Check if the URL is a live video URL
      const isLiveVideo = url.includes("/live/");
      // Set startTime to 0 for live videos
      const startTime = isLiveVideo
        ? 0
        : url.includes("t=")
        ? url.split("t=")[1]
        : 0;

      if (isAdmin) {
        // Make post request to the server to save new url in db
        const response = await axios(
          `${baseUrl}/room/${roomId}?videoUrl=${noCookieUrl}`,
          {
            withCredentials: true,
            method: "post",
            validateStatus: function (status) {
              // Consider any status code less than 500 as a success
              return status >= 200 && status < 500;
            },
          }
        );
        const resData = response.data;
        if (response.status !== 200) {
          throw new Error(resData.msg);
        }
        // send socket message that new video Url has been set
        socket.emit("newVideoUrl", {
          videoUrl: noCookieUrl,
          socketRoomId,
          videoId,
          startTime,
          username,
          mainRoomId: roomId,
        });
      }
      dispatch(setVideoUrl(noCookieUrl));
      dispatch(setVideoId(videoId));
      dispatch(setVideoStartTime(startTime));
      dispatch(setVideoUrlValidity(true));
    } catch (error) {
      console.error(error);
      resetVideoSlice(dispatch);
      if (error instanceof AxiosError && error.code === "ERR_BAD_REQUEST") {
        // Display toast that the URL is invalid
        setIsServerError(true);
        setServerErrorMessage("No such Video exists");
        return;
      }
      if (error instanceof Error) {
        // Display toast with message received from server
        setIsServerError(true);
        setServerErrorMessage(error.message);
        return;
      }
      console.error(error);
    }
  };

  return (
    <>
      <Stack
        component="form"
        direction="row"
        alignItems={"center"}
        justifyContent={"space-evenly"}
        sx={{
          width: "100%",
          height: "100px",
          backgroundColor: "orange",
          position: "relative",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const textfieldEl = e.target.firstChild.children[1].firstChild;
          textfieldEl.value = "";
          validateVideoUrl(inpVideoUrl);
        }}
      >
        <Tooltip title={!isAdmin ? "Only admins can change the video" : ""}>
          <TextField
            id="outlined-basic"
            label={
              isAdmin
                ? "Enter the link of youtube video"
                : "If you feel your video is not in sync with others, just pause and play once"
            }
            disabled={!isAdmin}
            variant="outlined"
            autoComplete="off"
            sx={{
              minWidth: { md: "85%", xs: "70%" },
              margin: "20px 0",
              cursor: "pointer",
            }}
            onChange={(e) => {
              setInpVideoUrl(e.target.value);
            }}
          />
        </Tooltip>
        <Button
          type="submit"
          variant="contained"
          disabled={!isAdmin}
          sx={{
            minWidth: "40px",
            height: "40px",
            margin: "20px 0",
            padding: 0,
          }}
        >
          <ArrowForwardIcon />
        </Button>
      </Stack>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
        open={isServerError}
        color="danger"
        variant="solid"
        onClose={handleSnackbarClose}
        startDecorator={<ErrorOutlineIcon />}
      >
        <div>{serverErrorMessage}</div>
      </Snackbar>
    </>
  );
}

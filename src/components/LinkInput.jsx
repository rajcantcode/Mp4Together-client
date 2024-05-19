import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
import axios, { AxiosError } from "axios";
import { resetVideoSlice } from "../../services/helpers";
import { useParams } from "react-router-dom";
import { useCallback } from "react";
import debounce from "lodash.debounce";
import { Box } from "@mui/material";
import VideoDetail from "./VideoDetail.jsx";
import { useOnClickOutside } from "../../services/use-on-click-outside.js";

export default function LinkInput({ socket }) {
  const [inpVideoUrl, setInpVideoUrl] = useState("");
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  const { roomId } = useParams();
  const { socketRoomId } = useSelector((state) => state.roomInfo);
  const dispatch = useDispatch();
  const [serverErrorMessage, setServerErrorMessage] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const formRef = useRef(null);

  useOnClickOutside(formRef, () => {
    setVideoDetails(null);
    setInpVideoUrl("");
  });
  const request = debounce(async (query) => {
    fetchVideoDetails(query);
  }, 600);
  const debounceRequest = useCallback((query) => {
    request(query);
  }, []);

  useEffect(() => {
    if (!socket) return;
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

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSnackbarClose = () => {
    setServerErrorMessage("");
  };
  const validateVideoUrl = async (url) => {
    try {
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
        setServerErrorMessage("No such Video exists");
        return;
      }
      if (error instanceof Error) {
        // Display toast with message received from server
        setServerErrorMessage(error.message);
        return;
      }
      console.error(error);
    } finally {
      setInpVideoUrl("");
    }
  };

  const fetchVideoDetails = async (query) => {
    try {
      if (typeof query !== "string" || query.trim() === "" || query === "") {
        setVideoDetails([]);
        return;
      }
      const regex = /^(http:\/\/|https:\/\/)/;
      if (regex.test(query)) {
        setVideoDetails(null);
        return;
      }
      const response = await axios.get(`${baseUrl}/room/youtube?q=${query}`, {
        withCredentials: true,
        validateStatus: function (status) {
          // Consider any status code less than 500 as a success
          return status >= 200 && status < 500;
        },
      });
      if (response.status === 400) {
        setServerErrorMessage("Invalid query");
        return;
      }
      if (response.status === 200) {
        const resData = response.data;
        setVideoDetails(resData.data);
      }
    } catch (error) {
      console.error(error);
      setServerErrorMessage("Unable to fetch video details");
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
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          validateVideoUrl(inpVideoUrl);
        }}
      >
        <Box
          sx={{
            minWidth: {
              md: "85%",
              xs: "70%",
              margin: "20px 0",
              position: "relative",
            },
          }}
          className="search-container"
        >
          <Tooltip title={!isAdmin ? "Only admins can change the video" : ""}>
            <TextField
              id="outlined-basic"
              label={
                isAdmin
                  ? "Enter the link of youtube video or search for it"
                  : "If you feel your video is not in sync with others, just pause and play once"
              }
              disabled={!isAdmin}
              variant="outlined"
              value={inpVideoUrl}
              autoComplete="off"
              sx={{
                width: "100%",
                cursor: "pointer",
              }}
              onChange={(e) => {
                setInpVideoUrl(e.target.value);
                debounceRequest(e.target.value);
              }}
            />
          </Tooltip>
          {videoDetails ? (
            videoDetails.length !== 0 ? (
              <Box
                className="videoDetails"
                sx={{
                  width: "100%",
                  height: "200px",
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                  position: "absolute",
                  zIndex: 10,
                  borderRadius: "6px",
                  overflowX: "hidden",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE and Edge
                }}
              >
                {videoDetails.map((video, index) => (
                  <VideoDetail
                    videoData={video}
                    key={index}
                    onClick={() => {
                      validateVideoUrl(
                        `https://www.youtube.com/watch?v=${video.videoId}`
                      );
                      setVideoDetails(null);
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                className="videoDetails"
                sx={{
                  width: "100%",
                  // height: "100px",
                  padding: "20px 5px",
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(20px)",
                  position: "absolute",
                  zIndex: 10,
                  borderRadius: "6px",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE and Edge
                }}
              >
                <p>No results found for your search</p>
              </Box>
            )
          ) : null}
        </Box>
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
        open={serverErrorMessage !== ""}
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

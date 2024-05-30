import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import { useSelector, useDispatch } from "react-redux";
import {
  setVideoId,
  setVideoUrlValidity,
  setVideoStartTime,
  setVideoUrl,
} from "../store/videoUrlSlice";
import axios, { AxiosError } from "axios";
import {
  openFileSelector,
  resetVideoSlice,
  startFileShare,
} from "../../services/helpers";
import { useParams } from "react-router-dom";
import { useCallback } from "react";
import debounce from "lodash.debounce";
import { Box, Typography } from "@mui/material";
import VideoDetail from "./VideoDetail.jsx";
import { useOnClickOutside } from "../../services/use-on-click-outside.js";
import LoadingButton from "@mui/lab/LoadingButton";
import BlockIcon from "@mui/icons-material/Block";
import "../stylesheets/spinner.css";
import { Peer } from "peerjs";

export default function LinkInput({ socket }) {
  const [inpVideoUrl, setInpVideoUrl] = useState("");
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  const { roomId } = useParams();
  const { socketRoomId } = useSelector((state) => state.roomInfo);
  const { videoUrl } = useSelector((state) => state.videoUrl);
  const dispatch = useDispatch();
  const [serverErrorMessage, setServerErrorMessage] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [videoDetailsLoading, setVideoDetailsLoading] = useState(false);
  const formRef = useRef(null);
  const modalRef = useRef(null);

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
    const handleNewVideoUrl = ({ videoUrl, videoId, startTime, t }) => {
      dispatch(setVideoUrl(videoUrl));
      dispatch(setVideoId(videoId));
      const skipToTime = startTime + (Date.now() - t) / 1000;
      dispatch(setVideoStartTime(skipToTime));
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
          t: Date.now(),
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
      setVideoDetailsLoading(true);
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
    } finally {
      setVideoDetailsLoading(false);
    }
  };

  const handleStopVideoShare = async () => {
    dispatch(setVideoUrl(""));
    dispatch(setVideoUrlValidity(false));
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
          {videoDetailsLoading ? (
            <Box
              className="loader-container h-[50px] w-full absolute flex content-center items-center"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(10px)",
                borderRadius: "6px",
              }}
            >
              <div className="search-loader"></div>
            </Box>
          ) : videoDetails ? (
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
        {videoUrl.startsWith("blob") ? (
          <Tooltip title="Stop video-share">
            <span>
              <Button
                className="relative"
                variant="contained"
                disabled={!isAdmin}
                sx={{
                  minWidth: "40px",
                  height: "40px",
                  margin: "20px 0",
                  padding: 0,
                }}
                onClick={handleStopVideoShare}
              >
                <DriveFolderUploadIcon className="text-gray-300" />
                <BlockIcon
                  className="absolute text-red-500 top-[3px]"
                  fontSize="large"
                />
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Start video-share">
            <span>
              <Button
                variant="contained"
                disabled={!isAdmin}
                sx={{
                  minWidth: "40px",
                  height: "40px",
                  margin: "20px 0",
                  padding: 0,
                }}
                onClick={() => {
                  modalRef.current.showModal();
                }}
              >
                <DriveFolderUploadIcon />
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
      <dialog
        ref={modalRef}
        className="p-[10px] border-amber-300 border-solid border-[4px] rounded-md w-3/4 modal"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        <p className="mb-[10px] text-[30px] text-center text-red-600">
          Attention !!
        </p>

        <div className="flex instruction">
          <p className="mr-[5px] text-red-600">♦</p>
          <p className="mb-2">
            You are about to stream a local video file from your device to all
            other participants in the room.
          </p>
        </div>
        <div className="flex instruction">
          <p className="mr-[5px] text-red-600">♦</p>
          <p className="mb-2 instruction">
            Since this uses peer to peer streaming, it is advised to keep the
            participants number to below 4, to ensure a smooth experience.
          </p>
        </div>
        <div className="flex w-full md:w-1/2 mx-auto actions justify-evenly my-[10px]">
          <LoadingButton
            size="medium"
            variant="contained"
            onClick={async () => {
              try {
                modalRef.current.close();
                const url = await startFileShare();
                if (!url) return;
                dispatch(setVideoUrl(url));
                dispatch(setVideoUrlValidity(true));
              } catch (error) {
                console.error(error);
              }
            }}
          >
            Select a video
          </LoadingButton>
          <LoadingButton
            size="medium"
            variant="contained"
            onClick={() => {
              modalRef.current.close();
            }}
          >
            cancel
          </LoadingButton>
        </div>
      </dialog>
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

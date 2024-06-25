import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "../stylesheets/spinner.css";
import {
  setKickSnackbarInfo,
  setRoomAdmins,
  setRoomId,
  setRoomMembers,
  setRoomMembersMicState,
  setRoomMembersMuteState,
  setRoomValidity,
  setSocketRoomId,
} from "../store/roomSlice.js";
import {
  setEmail,
  setIsGuest,
  setUserRoomId,
  setUserSocketRoomId,
  setUsername,
} from "../store/userSlice.js";
import Container from "@mui/material/Container";
import MenuAppBar from "../components/MenuAppBar.jsx";
import LinkInput from "../components/LinkInput.jsx";
import Interactive from "../components/Interactive.jsx";
import { joinSocketRoom } from "../socket/socketUtils.js";
import { fetchUser } from "../services/helpers.js";
import {
  setVideoId,
  setVideoPlaybackSpeed,
  setVideoStartTime,
  setVideoUrl,
  setVideoUrlValidity,
} from "../store/videoUrlSlice.js";
import Snackbar from "@mui/joy/Snackbar";
import ShareIcon from "@mui/icons-material/Share";
import Header from "../components/Header.jsx";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// This component can be accessed by user in two ways
// 1] By visiting /room path and entering roomID
// 2] By directly pasting the room link in the browser search tab.
// In the first way, the fetching of user and room details is done by the Room component and stored in redux.
// But In the second way, there is no "in between" so we fetch the room and user details here, if the user is accessing the component in second way.
// To determine the way in which user is accessing the component, we check if the user roomId is set or not in redux store. If it is not set then we make the joinRoom request

const Main = () => {
  const [socket, setSocket] = useState();
  const [sfuSocket, setSfuSocket] = useState();
  const params = useParams();
  const dispatch = useDispatch();
  const errorRef = useRef(null);
  const { username, userRoomId, isGuest } = useSelector(
    (state) => state.userInfo
  );
  const { videoUrl } = useSelector((state) => state.videoUrl);
  const [isValidUser, setIsValidUser] = useState(() =>
    userRoomId !== "" ? true : false
  );
  const { socketRoomId, roomId, admins, isRoomValid } = useSelector(
    (state) => state.roomInfo
  );
  const kickSnackbarInfo = useSelector(
    (state) => state.roomInfo.kickSnackbarInfo
  );
  const [showSnackbar, setShowSnackbar] = useState(isRoomValid);

  useEffect(() => {
    if (isValidUser) {
      import("./Room.jsx");
      return;
    }
    (async function () {
      const reqRoomId = params.roomId;
      const res = await fetchUser(reqRoomId);
      if (res) {
        if (res.status !== 200) {
          if (res.status === 404) {
            errorRef.current.innerHTML = `${res.msg}. <a style="text-decoration:underline" href="/room">Create a new room</a> Or <a style="text-decoration:underline" href="/room">Join a room</a>`;
          } else if (res.status === 401 || res.status === 403) {
            errorRef.current.innerHTML = `Unauthorized user <br></br> Please visit the <a style="text-decoration:underline" href="/register">register</a> or <a style="text-decoration:underline" href="/login">login</a> page, to authenticate yourself`;
          }
          setIsValidUser(false);
        }
        if (res.status === 200) {
          const {
            roomId,
            socketRoomId,
            members,
            admins,
            username,
            email,
            videoUrl,
            playbackSpeed,
            membersMicState,
            guest,
          } = res;

          const membersMuteState = {};
          members.forEach((member) => {
            if (member !== username) {
              membersMuteState[member] = false;
            }
          });
          dispatch(setUserRoomId(roomId));
          dispatch(setRoomId(roomId));
          dispatch(setRoomValidity(true));

          dispatch(setUserSocketRoomId(socketRoomId));
          dispatch(setSocketRoomId(socketRoomId));

          dispatch(setUsername(username));
          dispatch(setEmail(email));
          dispatch(setIsGuest(guest));

          dispatch(setRoomMembers(members));
          dispatch(setRoomAdmins(admins));
          dispatch(setRoomMembersMicState(membersMicState));
          dispatch(setRoomMembersMuteState(membersMuteState));

          if (videoUrl) {
            dispatch(setVideoUrl(videoUrl));
            dispatch(setVideoId(videoUrl ? videoUrl.split("/embed/")[1] : 0));
            dispatch(setVideoPlaybackSpeed(playbackSpeed));
          }

          setIsValidUser(true);
        }
      }
    })();
    import("./Room.jsx");
  }, []);

  useEffect(() => {
    if (!isValidUser) return;

    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    const sfuServerUrl = import.meta.env.VITE_SFU_SERVER_URL;

    // ToDo - Handle socket connection error
    const socket = io(baseUrl, {
      withCredentials: true,
      query: {
        mainRoomId: roomId,
        socketRoomId,
      },
      secure: true,
    });
    const sfuSocket = io(sfuServerUrl, { withCredentials: true, secure: true });

    socket.on("ready", () => {
      joinSocketRoom(socketRoomId, socket, username, isGuest);
      socket.once("timestamp", ({ timestamp }) => {
        if (videoUrl) {
          dispatch(setVideoStartTime(timestamp));
          dispatch(setVideoUrl(videoUrl));
          dispatch(setVideoId(videoUrl ? videoUrl.split("/embed/")[1] : 0));
          dispatch(setVideoUrlValidity(true));
        }
      });
      socket.emit("join-room", {
        room: socketRoomId,
        username: username,
        mainRoomId: roomId,
        admin: admins[0],
      });
      setSocket(socket);
    });

    sfuSocket.on("ready", () => {
      setSfuSocket(sfuSocket);
    });

    return () => {
      socket.disconnect();
      sfuSocket.disconnect();
    };
  }, [isValidUser]);

  useEffect(() => {
    setShowSnackbar(isRoomValid);
  }, [isRoomValid]);

  const handleErrorSnackbarClose = () => {
    dispatch(setKickSnackbarInfo({ show: false, title: "", color: "neutral" }));
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <>
      {isValidUser ? (
        <Container
          maxWidth="xl"
          sx={{
            padding: "0 4px",
            minHeight: "100vh",
            maxHeight: "auto",
            backgroundImage:
              "linear-gradient(180deg, rgba(131,114,255,0.779171043417367) 100%, rgba(131,114,255,0.78) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          <MenuAppBar socket={socket} sfuSocket={sfuSocket} />
          <LinkInput socket={socket} />
          <Interactive socket={socket} sfuSocket={sfuSocket} />
        </Container>
      ) : (
        <>
          <Header />
          <div className="flex items-center justify-center h-[calc(100vh-64px)] text-center">
            <p ref={errorRef} className="text-xl text-white md:text-2xl">
              Authenticating user, please wait...
            </p>
            {errorRef.current?.textContent ===
              "Authenticating user, please wait..." && (
              <div className="text-white lds-roller-2">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            )}
          </div>
        </>
      )}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={5000}
        open={showSnackbar}
        color="success"
        variant="solid"
        onClose={handleSnackbarClose}
        startDecorator={<ShareIcon />}
        sx={{ backgroundColor: "#00d4ad" }}
      >
        <div>
          <p className="sm:text-lg text-[0.9rem] leading-5">
            Share the room link with people you want to watch{" "}
          </p>
          <p className="sm:text-sm text-[0.7rem] leading-3">
            You can resize the video, chat, and participants panel
          </p>
        </div>
      </Snackbar>

      {/* Snackbar for displaying error messages */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
        open={kickSnackbarInfo.show}
        color="danger"
        variant="solid"
        onClose={handleErrorSnackbarClose}
        startDecorator={<ErrorOutlineIcon />}
      >
        <div>{kickSnackbarInfo.title}</div>
      </Snackbar>
    </>
  );
};

export default Main;

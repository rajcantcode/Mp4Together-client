import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
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
  setUserRoomId,
  setUserSocketRoomId,
  setUsername,
} from "../store/userSlice.js";
import Container from "@mui/material/Container";
import MenuAppBar from "../components/MenuAppBar.jsx";
import LinkInput from "../components/LinkInput.jsx";
import Interactive from "../components/Interactive.jsx";
import { joinSocketRoom, getSocket } from "../socket/socketUtils.js";
import { fetchUser } from "../../services/helpers.js";
import {
  setVideoId,
  setVideoStartTime,
  setVideoUrl,
  setVideoUrlValidity,
} from "../store/videoUrlSlice.js";
import Snackbar from "@mui/joy/Snackbar";
import ShareIcon from "@mui/icons-material/Share";

// This component can be accessed by user in two ways
// 1] By visiting /room path and entering roomID
// 2] By directly pasting the room link in the browser search tab.
// In the first way, the fetching of user and room details is done by the Room component and stored in redux.
// But In the second way, there is no "in between" so we fetch the room and user details here, if the user is accessing the component in second way.
// To determine the way in which user is accessing the component, we check if the username is set or not in redux store. If it is not set then we make the joinRoom request

const Main = () => {
  const socket = getSocket();
  const [isValidUser, setIsValidUser] = useState(true);
  const params = useParams();
  const dispatch = useDispatch();
  const errorRef = useRef(null);
  const { username } = useSelector((state) => state.userInfo);
  const { socketRoomId } = useSelector((state) => state.roomInfo);
  const { isRoomValid } = useSelector((state) => state.roomInfo);
  const [showSnackbar, setShowSnackbar] = useState(isRoomValid);

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  useEffect(() => {
    if (username === "") {
      setIsValidUser(false);
      (async function () {
        const reqRoomId = params.roomId;
        const res = await fetchUser(reqRoomId);
        if (res) {
          if (res.status !== 200) {
            if (res.status === 401 || res.status === 403) {
              setIsValidUser(false);
            }
            if (res.status === 404) {
              errorRef.current.textContent = `${res.msg}`;
            }
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
              membersMicState,
            } = res;
            joinSocketRoom(socketRoomId, socket, username);

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

            dispatch(setRoomMembers(members));
            dispatch(setRoomAdmins(admins));
            dispatch(setRoomMembersMicState(membersMicState));
            dispatch(setRoomMembersMuteState(membersMuteState));

            socket.on("timestamp", ({ timestamp }) => {
              if (videoUrl) {
                dispatch(setVideoStartTime(timestamp));
                dispatch(setVideoUrl(videoUrl));
                dispatch(
                  setVideoId(videoUrl ? videoUrl.split("/embed/")[1] : 0)
                );
                dispatch(setVideoUrlValidity(true));
              }
            });
            socket.emit("join-room", {
              room: socketRoomId,
              username: username,
              mainRoomId: roomId,
              admin: admins[0],
            });

            setIsValidUser(true);
          }
        }
      })();
    }
  }, []);

  useEffect(() => {
    socket?.once("connect", () => {
      if (socketRoomId !== "") {
        joinSocketRoom(socketRoomId, socket, username);
      }
    });
  }, [socket]);

  return (
    <>
      {isValidUser ? (
        <Container maxWidth="xl" sx={{ padding: "0 4px", height: "100vh" }}>
          <MenuAppBar />
          <LinkInput />
          <Interactive />
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            autoHideDuration={3000}
            open={showSnackbar}
            color="success"
            variant="solid"
            onClose={handleSnackbarClose}
            startDecorator={<ShareIcon />}
          >
            <div>Share the room link with people you want to watch </div>
          </Snackbar>
        </Container>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <h1 ref={errorRef}>
            Unauthorized user <br></br>
            Please visit the{" "}
            <Link className="underline" to="/register">
              register
            </Link>{" "}
            or{" "}
            <Link className="underline" to="/login">
              login
            </Link>{" "}
            page, to authenticate yourself
          </h1>
        </div>
      )}
    </>
  );
};

export default Main;

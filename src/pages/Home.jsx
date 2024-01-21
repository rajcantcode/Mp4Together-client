import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  setRoomAdmins,
  setRoomId,
  setRoomMembers,
  setSocketRoomId,
} from "../store/roomSlice";
import {
  setEmail,
  setUserRoomId,
  setUserSocketRoomId,
  setUsername,
} from "../store/userSlice";
import Container from "@mui/material/Container";
import MenuAppBar from "../components/MenuAppBar";
import LinkInput from "../components/LinkInput";
import Interactive from "../components/Interactive";
import { joinSocketRoom, getSocket } from "../socket/socketUtils";
import { fetchUser } from "../../services/helpers";
import {
  setVideoId,
  setVideoStartTime,
  setVideoUrl,
  setVideoUrlValidity,
} from "../store/videoUrlSlice";

// This component can be accessed by user in two ways
// 1] By visiting /room path and entering roomID
// 2] By directly pasting the room link in the browser search tab.
// In the first way, the fetching of user and room details is done by the Room component and stored in redux.
// But In the second way, there is no "in between" so we fetch the room and user details here, if the user is accessing the component in second way.
// To determine the way in which user is accessing the component, we check if the username is set or not in redux store. If it is not set then we make the joinRoom request

const Home = () => {
  const socket = getSocket();
  const [isValidUser, setIsValidUser] = useState(true);
  const params = useParams();
  const dispatch = useDispatch();
  const errorRef = useRef(null);
  const { username } = useSelector((state) => state.userInfo);

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
            } = res;
            joinSocketRoom(socketRoomId, socket, username);

            dispatch(setUserRoomId(roomId));
            dispatch(setRoomId(roomId));

            dispatch(setUserSocketRoomId(socketRoomId));
            dispatch(setSocketRoomId(socketRoomId));

            dispatch(setUsername(username));
            dispatch(setEmail(email));

            dispatch(setRoomMembers(members));
            dispatch(setRoomAdmins(admins));

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
  return (
    <>
      {isValidUser ? (
        <Container maxWidth="xl" sx={{ padding: "0 4px" }}>
          <MenuAppBar />
          <LinkInput />
          <Interactive />
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

export default Home;

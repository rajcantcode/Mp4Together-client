import React, { useState, useEffect } from "react";
import "../stylesheets/spinner.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authenticateUser } from "../../services/helpers";
import {
  setEmail,
  setIsAdmin,
  setUserRoomId,
  setUserSocketRoomId,
  setUsername,
} from "../store/userSlice";
import {
  setRoomId,
  setSocketRoomId,
  setRoomMembers,
  setRoomAdmins,
  setRoomValidity,
  setRoomMembersMicState,
  setRoomMembersMuteState,
  setKickSnackbarInfo,
} from "../store/roomSlice";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Header from "../components/Header";
import LoadingButton from "@mui/lab/LoadingButton";
import { Box } from "@mui/material";
import { styled } from "@mui/joy/styles";
import Input from "@mui/joy/Input";
import SendIcon from "@mui/icons-material/Send";
import {
  joinSocketRoom,
  getSocket,
  getSfuSocket,
} from "../socket/socketUtils.js";
import axios from "axios";
import {
  setVideoId,
  setVideoStartTime,
  setVideoUrl,
  setVideoUrlValidity,
} from "../store/videoUrlSlice";
// import "./Room.css";

const StyledInput = styled("input")({
  border: "none", // remove the native input border
  minWidth: 0, // remove the native input width
  outline: 0, // remove the native input outline
  padding: 0, // remove the native input padding
  paddingTop: "1em",
  flex: 1,
  color: "inherit",
  backgroundColor: "transparent",
  fontFamily: "inherit",
  fontSize: "inherit",
  fontStyle: "inherit",
  fontWeight: "inherit",
  lineHeight: "inherit",
  textOverflow: "ellipsis",
  "&::placeholder": {
    opacity: 0,
    transition: "0.1s ease-out",
  },
  "&:focus::placeholder": {
    opacity: 1,
  },
  "&:focus ~ label, &:not(:placeholder-shown) ~ label, &:-webkit-autofill ~ label":
    {
      top: "0.5rem",
      fontSize: "0.75rem",
    },
  "&:focus ~ label": {
    color: "var(--Input-focusedHighlight)",
  },
  "&:-webkit-autofill": {
    alignSelf: "stretch", // to fill the height of the root slot
  },
  "&:-webkit-autofill:not(* + &)": {
    marginInlineStart: "calc(-1 * var(--Input-paddingInline))",
    paddingInlineStart: "var(--Input-paddingInline)",
    borderTopLeftRadius:
      "calc(var(--Input-radius) - var(--variant-borderWidth, 0px))",
    borderBottomLeftRadius:
      "calc(var(--Input-radius) - var(--variant-borderWidth, 0px))",
  },
});

const StyledLabel = styled("label")(({ theme }) => ({
  position: "absolute",
  lineHeight: 1,
  top: "calc((var(--Input-minHeight) - 1em) / 2)",
  color: theme.vars.palette.text.tertiary,
  fontWeight: theme.vars.fontWeight.md,
  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
}));

const InnerInput = React.forwardRef(function InnerInput(props, ref) {
  const id = React.useId();
  return (
    <React.Fragment>
      <StyledInput {...props} ref={ref} id={id} />
      <StyledLabel htmlFor={id}>Enter room Link or Id</StyledLabel>
    </React.Fragment>
  );
});

const Room = () => {
  const socket = getSocket();
  const sfuSocket = getSfuSocket();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true); // State to track loading status

  useEffect(() => {
    (async () => {
      try {
        const response = await authenticateUser(dispatch);
        if (response.status === 401 || response.status === 403)
          navigate("/login");
        setIsLoading(false);
      } catch (error) {
        // Handle server error here
        navigate("/login");
        console.error(error);
      }
    })();
  }, []);
  const [showJoinInput, setShowJoinInput] = useState(false);

  //  Set disabled status state variable
  const [disabledStatus, setDisabledStatus] = useState({
    createBtn: false,
    joinBtn: false,
    sendBtn: false,
  });
  //  Set loading status state variable
  const [loadingStatus, setLoadingStatus] = useState({
    createBtn: false,
    joinBtn: false,
    sendBtn: false,
  });
  //   Room link input
  const [roomLink, setRoomLink] = useState("");

  //   Set error message state variable
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const username = useSelector((state) => state.userInfo.username);
  const kickSnackbarInfo = useSelector(
    (state) => state.roomInfo.kickSnackbarInfo
  );

  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const sfuServerUrl = import.meta.env.VITE_SFU_SERVER_URL;

  const toggleJoinInput = () => {
    setShowJoinInput(!showJoinInput);
  };

  const handleRoomLinkChange = (e) => {
    setRoomLink(e.target.value);
  };

  // Implement the logic for creating a room here
  const createRoom = async () => {
    try {
      setLoadingStatus((prev) => ({ ...prev, createBtn: true }));
      setDisabledStatus((prev) => ({ ...prev, joinBtn: true, sendBtn: true }));
      const response = await axios(`${baseUrl}/room/create`, {
        method: "post",
        withCredentials: true,
        validateStatus: function (status) {
          //Consider any status code less than 500 as a success
          return status >= 200 && status < 500;
        },
      });

      const resData = response.data;

      if (response.status !== 200) {
        // Token not provided or invalid token
        if (response.status === 401 || response.status === 403) {
          setErrorMsg(`${resData.msg}, you will be redirected to login page`);
          setTimeout(() => {
            setErrorMsg("");
            navigate("/login");
          }, 2000);
        }
        // No such user exists
        if (response.status === 404) {
          setErrorMsg(
            `${resData.msg}, you will be redirected to register page`
          );
          setTimeout(() => {
            setErrorMsg("");
            navigate("/register");
          }, 2000);
        }
        return;
      }
      if (response.status === 200) {
        const { roomId, socketRoomId, members, admins, membersMicState } =
          resData;
        // Join the socket room
        joinSocketRoom(socketRoomId, socket, username);

        // Send a request to sfu server to create a router for the new room
        await createRouter(socketRoomId);

        // Store all received data from server in redux store
        dispatch(setUserRoomId(roomId));
        dispatch(setRoomId(roomId));

        dispatch(setUserSocketRoomId(socketRoomId));
        dispatch(setSocketRoomId(socketRoomId));
        dispatch(setRoomValidity(true));

        dispatch(setRoomMembers(members));
        dispatch(setRoomAdmins(admins));
        dispatch(setRoomMembersMicState(membersMicState));

        // Since the user created the room, they are the admin
        dispatch(setIsAdmin(true));

        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      // ToDo -> Handle server errrors
      dispatch(
        setKickSnackbarInfo({
          show: true,
          title: "Unable to create room at the moment. Please try again later",
        })
      );
      console.error(error);
    } finally {
      setDisabledStatus({ joinBtn: false, createBtn: false, sendBtn: false });
      setLoadingStatus({ joinBtn: false, createBtn: false, sendBtn: false });
    }
  };

  const joinRoom = async () => {
    try {
      setDisabledStatus((prev) => ({
        ...prev,
        joinBtn: true,
        createBtn: true,
      }));
      setLoadingStatus((prev) => ({ ...prev, sendBtn: true }));
      // Regex to validate room link
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
      const validPattern1 = new RegExp(
        `^http://${frontendUrl}/room/[a-zA-Z-]+-[a-zA-Z-]+-[a-zA-Z-]+$`
      );
      const validPattern2 = new RegExp(
        `^${frontendUrl}/room/[a-zA-Z-]+-[a-zA-Z-]+-[a-zA-Z-]+$`
      );
      // Remove the dev pattern when building project
      const validPatternDev = new RegExp(
        `^http://localhost:5173/room/[a-zA-Z-]+-[a-zA-Z-]+-[a-zA-Z-]+$`
      );
      const validPatternProd = new RegExp(
        `^https://${frontendUrl}/room/[a-zA-Z-]+-[a-zA-Z-]+-[a-zA-Z-]+$`
      );
      const validPattern3 = new RegExp(`^[a-zA-Z-]+-[a-zA-Z-]+-[a-zA-Z-]+$`);

      if (
        validPattern1.test(roomLink) ||
        validPattern2.test(roomLink) ||
        validPattern3.test(roomLink) ||
        validPatternDev.test(roomLink) ||
        validPatternProd.test(roomLink)
      ) {
        // Define a regular expression pattern to match the three words
        const pattern = /([\w-]+-[\w-]+-[\w-]+)$/;
        // Use the regular expression to extract the words
        const match = roomLink.match(pattern);
        // The captured group at index 1 contains the three words
        const reqRoomId = match[1];

        // Make api call to join room
        const response = await axios(`${baseUrl}/room/join/${reqRoomId}`, {
          method: "post",
          withCredentials: true,
          validateStatus: function (status) {
            // Consider any status code less than 500 as a success
            return status >= 200 && status < 500;
          },
        });
        const resData = response.data;
        if (response.status !== 200) {
          if (response.status === 404) {
            setErrorMsg(`${resData.msg}`);
            return;
          } else if (response.status === 401 || response.status === 403) {
            setErrorMsg(`${resData.msg}, you will be redirected to login page`);
            setTimeout(() => {
              setErrorMsg("");
              navigate("/login");
            }, 2000);
            return;
          }
        }
        if (response.status === 200) {
          const {
            roomId,
            socketRoomId,
            members,
            admins,
            username,
            email,
            videoUrl,
            membersMicState,
          } = resData;

          joinSocketRoom(socketRoomId, socket, username);
          const membersMuteState = {};
          members.forEach((member) => {
            if (member !== username) {
              membersMuteState[member] = false;
            }
          });
          dispatch(setUserRoomId(roomId));
          dispatch(setRoomId(roomId));
          dispatch(setRoomMembers(members));
          dispatch(setRoomAdmins(admins));
          dispatch(setRoomValidity(true));
          dispatch(setRoomMembersMicState(membersMicState));
          dispatch(setRoomMembersMuteState(membersMuteState));

          dispatch(setUserSocketRoomId(socketRoomId));
          dispatch(setSocketRoomId(socketRoomId));
          dispatch(setUsername(username));
          dispatch(setEmail(email));

          socket.once("timestamp", ({ timestamp }) => {
            if (!videoUrl || videoUrl === "") {
              setErrorMsg("");
              setRoomLink("");
              navigate(`/room/${roomId}`);
              return;
            }
            dispatch(setVideoStartTime(timestamp));
            dispatch(setVideoUrl(videoUrl));
            dispatch(setVideoId(videoUrl ? videoUrl.split("/embed/")[1] : 0));
            dispatch(setVideoUrlValidity(true));
          });
          socket.emit("join-room", {
            room: socketRoomId,
            username: username,
            mainRoomId: roomId,
            admin: admins[0],
          });

          setErrorMsg("");
          setRoomLink("");

          navigate(`/room/${roomId}`);
        }
      } else {
        // Display error message
        setErrorMsg("Invalid room link or code");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDisabledStatus({ joinBtn: false, createBtn: false, sendBtn: false });
      setLoadingStatus({ joinBtn: false, createBtn: false, sendBtn: false });
    }
  };

  const createRouter = async (socketRoomId) => {
    try {
      const routerResponse = await axios(
        `${sfuServerUrl}/router/create/${socketRoomId}`,
        {
          method: "post",
          withCredentials: true,
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const handleSnackbarClose = () => {
    dispatch(setKickSnackbarInfo({ show: false, title: "" }));
  };

  return (
    <>
      <div className="room-container">
        <Header renderProfile={!isLoading && true} />
        {isLoading ? ( // Render the modal if isLoading is true
          <div className="absolute translate-y-[-50%] translate-x-[-50%] modal top-1/2 left-1/2 flex justify-between items-center">
            <p className="text-2xl">Authenticating user, please wait...</p>
            <div className="lds-roller-2">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : (
          <>
            <Box
              className="room-modal"
              sx={{
                minWidth: { xs: "98%", md: "45%", lg: "35%" },
                padding: "15px",
                textAlign: "center",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <LoadingButton
                size="small"
                color="success"
                onClick={createRoom}
                loading={loadingStatus.createBtn}
                disabled={disabledStatus.createBtn}
                variant="contained"
                sx={{
                  margin: "10px",
                  display: "block",
                  minHeight: "56px",
                  width: "100%",
                }}
              >
                <span>Create New Room</span>
              </LoadingButton>
              {!showJoinInput && <p style={{ color: "red" }}>{errorMsg}</p>}
              <LoadingButton
                size="small"
                onClick={toggleJoinInput}
                loading={loadingStatus.joinBtn}
                disabled={disabledStatus.joinBtn}
                variant="contained"
                sx={{
                  margin: "10px",
                  display: "block",
                  minHeight: "56px",
                  width: "100%",
                }}
              >
                <span>Join a room</span>
              </LoadingButton>
              {showJoinInput && (
                <>
                  <Box
                    className="join-room-input-container"
                    width="100%"
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Input
                      slots={{ input: InnerInput }}
                      slotProps={{
                        input: {
                          placeholder: `https://websiteUrl/unique-room-id`,
                          type: "text",
                        },
                      }}
                      sx={{
                        "--Input-minHeight": "56px",
                        "--Input-radius": "6px",
                        width: "90%",
                        margin: "10px",
                      }}
                      value={roomLink}
                      onChange={handleRoomLinkChange}
                    />
                    <LoadingButton
                      className="send-room-link"
                      sx={{ display: "block", width: "fit-content" }}
                      disableRipple={true}
                      variant="text"
                      onClick={joinRoom}
                      loading={loadingStatus.sendBtn}
                      disabled={disabledStatus.sendBtn}
                    >
                      <SendIcon sx={{ fontSize: "1.9rem" }} />
                    </LoadingButton>
                  </Box>
                  <p style={{ color: "red" }}>{errorMsg}</p>
                </>
              )}
            </Box>
          </>
        )}
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
        open={kickSnackbarInfo.show}
        color="danger"
        variant="solid"
        onClose={handleSnackbarClose}
        startDecorator={<ErrorOutlineIcon />}
      >
        <div>{kickSnackbarInfo.title}</div>
      </Snackbar>
    </>
  );
};

export default Room;

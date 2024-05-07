import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import LoadingButton from "@mui/lab/LoadingButton";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EditIcon from "@mui/icons-material/Edit";
import SendIcon from "@mui/icons-material/Send";

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  setIsAdmin,
  setUserRoomId,
  setUserSocketRoomId,
} from "../store/userSlice";
import { setKickSnackbarInfo } from "../store/roomSlice.js";

import { getSfuSocket, getSocket } from "../socket/socketUtils.js";
import { resetRoomSlice, resetVideoSlice } from "../../services/helpers";
import { useState, useRef } from "react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

function MenuAppBar() {
  const socket = getSocket();
  const sfuSocket = getSfuSocket();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [shouldExit, setShouldExit] = useState(true);
  const shouldExitRef = useRef(shouldExit);
  const [snackbarInfo, setSnackbarInfo] = useState({ show: false, title: "" });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access the URL parameter using useParams from react-router-dom, Idk why redux does not give me the roomID, so I have to use url parameters
  // const { roomId } = useParams();
  const { username, email } = useSelector((state) => state.userInfo);
  const { socketRoomId, roomId } = useSelector((state) => state.roomInfo);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const kick = async ({ admin }) => {
      const exitSuccess = await exitRoom(false);
      if (exitSuccess) {
        dispatch(
          setKickSnackbarInfo({
            show: true,
            title: `You were kicked by ${admin}`,
          })
        );
        navigate("/room");
      }
    };
    socket.on("exit", kick);
    return async () => {
      // To call exitRoom, when user clicks back or forward navigation arrows/button
      if (shouldExitRef.current) {
        await exitRoom(false);
      }
      socket.off("exit", kick);
    };
  }, []);

  useEffect(() => {
    shouldExitRef.current = shouldExit;
  }, [shouldExit]);
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarInfo({ show: false, title: "" });
  };

  const exitRoom = async (navigateToRoom = true) => {
    try {
      setExitLoading(true);
      setShouldExit(false);
      const response = await axios(`${baseUrl}/room/exit/${roomId}`, {
        method: "post",
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          // Consider any status code less than 500 as a success
          return status >= 200 && status < 500;
        },
      });
      const resData = response.data;
      if (response.status !== 200) {
        if (response.status === 404) {
          throw new Error(`${resData.msg}`);
        }
      }
      if (response.status === 200) {
        resetRoomSlice(dispatch);
        resetVideoSlice(dispatch);
        dispatch(setUserRoomId(""));
        dispatch(setUserSocketRoomId(""));
        dispatch(setIsAdmin(false));

        socket.emit("exit-room", {
          room: socketRoomId,
          username: username,
          mainRoomId: roomId,
        });
        sfuSocket.emit("close-transports", { leaver: username, socketRoomId });
        sfuSocket.close();
        navigateToRoom && navigate("/room");
        return true;
      }
    } catch (error) {
      setSnackbarInfo({
        show: true,
        title: "Unable to exit room \n please try again later",
      });
      console.error(error);
    } finally {
      setExitLoading(false);
    }
  };
  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogOut = async () => {
    try {
      await exitRoom(false);
      setExitLoading(true);
      const response = await axios(`${baseUrl}/auth/logout`, {
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
          console.error(`No such user with the username ${username} found`);
          setSnackbarInfo({
            show: true,
            title: `No such user with the username ${username} found`,
          });
          return;
        }
        if (response.status === 401 || response.status === 403) {
          console.error(`Invalid token or no token provided`);
        }
        setSnackbarInfo({
          show: true,
          title: "Unable to logout, please try again later",
        });
        return;
      }
      if (response.status === 200) {
        setExitLoading(false);
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      setSnackbarInfo({
        show: true,
        title: "Unable to logout, please try again later",
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Container
          maxWidth="xl"
          sx={{ padding: { xs: "0 4px", md: "0 16px" } }}
        >
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PlayCircleFilledIcon
                fontSize="large"
                sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
              />
              <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  display: { xs: "none", md: "flex" },
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: { xs: ".2rem", md: ".3rem" },
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                Mp4ToGether
              </Typography>
            </Box>

            <PlayCircleFilledIcon
              sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
            />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontFamily: "monospace",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: { xs: ".2rem", md: ".3rem" },
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Mp4ToGether
            </Typography>
            {/* small screen UI design end */}

            <Box
              sx={{
                display: "flex",
                width: { xs: "40%", md: "fit-content" },
                justifyContent: "space-between",
              }}
            >
              <Tooltip title="Copy room link">
                <IconButton onClick={copyRoomLink}>
                  <FileCopyIcon
                    sx={{ color: "yellow", margin: { xs: 0, md: "0 10px" } }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exit room">
                <LoadingButton
                  size="small"
                  color="error"
                  onClick={exitRoom}
                  loading={exitLoading}
                  loadingPosition="start"
                  startIcon={<ExitToAppIcon />}
                  variant="contained"
                  sx={{
                    display: "inline-flex",
                    minWidth: "30px",
                    margin: { xs: 0, md: "0 10px" },
                  }}
                >
                  <Typography sx={{ display: { xs: "none", md: "inline" } }}>
                    Exit Room
                  </Typography>
                </LoadingButton>
              </Tooltip>
              <Tooltip title="Open details">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  {/* Use this to change profile photo */}
                  <Avatar
                    alt={username.charAt(0).toUpperCase() + username.slice(1)}
                    src="/static/images/avatar/2.jpg"
                  />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <Box id="username-box" className="pl-2 pr-2">
                  <span>username - &nbsp; </span>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={username}
                    readOnly
                    disabled={true}
                    className="w-1/4 bg-transparent border-none outline-none"
                  />
                </Box>
                <Box id="email-box" className="pl-2 pr-2">
                  <span>
                    email &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;{" "}
                    {email}
                  </span>
                </Box>
                <LoadingButton
                  onClick={handleLogOut}
                  loading={exitLoading}
                  color="warning"
                  variant="contained"
                  sx={{ width: "75%", display: "block", margin: "10px auto" }}
                >
                  Log out
                </LoadingButton>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
        open={snackbarInfo.show}
        color="danger"
        variant="solid"
        onClose={handleSnackbarClose}
        startDecorator={<ErrorOutlineIcon />}
      >
        <div>{snackbarInfo.title}</div>
      </Snackbar>
    </>
  );
}
export default MenuAppBar;

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
// import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
// import MenuItem from "@mui/material/MenuItem";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import LoadingButton from "@mui/lab/LoadingButton";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GitHubIcon from "@mui/icons-material/GitHub";

import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

// Redux imports
import { useDispatch, useSelector } from "react-redux";
import {
  setIsAdmin,
  setIsGuest,
  setUserRoomId,
  setUserSocketRoomId,
} from "../store/userSlice";
import { setKickSnackbarInfo } from "../store/roomSlice.js";

import { resetRoomSlice, resetVideoSlice } from "../services/helpers";
import { useState, useRef } from "react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

function MenuAppBar({ socket, sfuSocket }) {
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
  const { username, email, isGuest } = useSelector((state) => state.userInfo);
  const { socketRoomId, roomId } = useSelector((state) => state.roomInfo);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!socket) return;
    const kick = async ({ admin }) => {
      const exitSuccess = await exitRoom(false);
      if (exitSuccess) {
        socket.emit("set-kick-status");
        dispatch(
          setKickSnackbarInfo({
            show: true,
            title: `You were kicked by ${admin}`,
            color: "danger",
          })
        );
        navigate("/room");
      }
    };
    const removeUser = async () => {
      try {
        if (!isGuest) return;
        setExitLoading(true);
        setShouldExit(false);
        const response = await axios(`${baseUrl}/room/trial/${roomId}`, {
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
          dispatch(setIsGuest(false));
          socket.emit("set-trial-expired");
          dispatch(
            setKickSnackbarInfo({
              show: true,
              title: `Your trial period has expired`,
              color: "danger",
            })
          );
          navigate("/register");
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
    socket.on("exit", kick);
    socket.on("trialExpire", removeUser);
    return async () => {
      // To call exitRoom, when user clicks back or forward navigation arrows/button
      if (shouldExitRef.current) {
        await exitRoom(false);
      }
      socket.off("exit", kick);
      socket.off("trialExpire", removeUser);
    };
  }, [socket]);

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
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                width: "60%",
              }}
            >
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
                  letterSpacing: { xs: ".1rem", md: ".15rem" },
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                Mp4Together
              </Typography>
              <Link
                className="hidden md:flex"
                to="https://github.com/rajcantcode/Mp4Together-client"
                target="_blank"
              >
                <GitHubIcon fontSize="large" />
              </Link>
            </Box>

            {/* small screen UI design start */}
            <Box className="flex items-center w-[60%]">
              <PlayCircleFilledIcon
                sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
              />

              <Link
                to="/"
                className="flex font-mono font-bold md:hidden tracking-[.1rem] text-base max-xs:text-sm mr-2"
              >
                Mp4Together
              </Link>
              <Link
                className="flex md:hidden"
                to="https://github.com/rajcantcode/Mp4Together-client"
                target="_blank"
              >
                <GitHubIcon fontSize="medium" />
              </Link>
            </Box>
            {/* small screen UI design end */}

            <Box
              sx={{
                display: "flex",
                // width: { xs: "fit-content", md: "40%" },
                width: "40%",
                justifyContent: "flex-end",
              }}
            >
              <Tooltip title="Copy room link">
                <IconButton
                  onClick={copyRoomLink}
                  sx={{ marginRight: { md: "1rem", xs: ".35rem" } }}
                >
                  <FileCopyIcon sx={{ color: "yellow" }} />
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
                    marginRight: { md: "1rem", xs: ".6rem" },
                  }}
                  className="exit-btn"
                >
                  <Typography sx={{ display: { xs: "none", md: "inline" } }}>
                    Exit Room
                  </Typography>
                </LoadingButton>
              </Tooltip>
              <Tooltip title="Open details">
                <IconButton
                  onClick={handleOpenUserMenu}
                  sx={{ p: 0, marginRight: { md: "1rem", xs: "0rem" } }}
                >
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

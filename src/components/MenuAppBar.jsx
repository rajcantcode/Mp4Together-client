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

import { getSocket } from "../socket/socketUtils.js";
import { resetRoomSlice, resetVideoSlice } from "../../services/helpers";
import { useState } from "react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

function MenuAppBar() {
  const socket = getSocket();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [isServerError, setIsServerError] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access the URL parameter using useParams from react-router-dom
  const { roomId } = useParams();
  const username = useSelector((state) => state.userInfo.username);
  const socketRoomId = useSelector((state) => state.roomInfo.socketRoomId);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // I have to implement the functionality wher if user closes the tab or refreshes the tab, they are exitted from room, I have tried many ways, but none of them work well.
    // So leaving this commented mess here 🥲)
    const handleBeforeUnload = (event) => {
      // if (window.performance.getEntriesByType("navigation")[0].type === "reload") {
      //     event.preventDefault();
      //     return;
      // }
      if (document.visibilityState === "visible") {
        exitRoom();
      }
      // if (!event.persisted && !event.currentTarget.performance.navigation.type === 1) {
      //     // Check if the event is related to page reload
      //     // Call the exitRoom function when the user closes the tab or navigates away
      //     exitRoom();
      // }
      // else {
      //     event.preventDefault();
      //     event.returnValue = "If you leave you will be removed from room"
      // }
      // Check if the event's returnValue has been modified
      // if (!event.returnValue) {
      //     // The user is closing the tab, so call the exitRoom function
      //     exitRoom();
      // }
      // exitRoom();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // window.addEventListener('beforeunload', (e) => {
    //     if (!e.persisted) {
    //         exitRoom();
    //     }
    // });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
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
    setIsServerError(false);
  };

  const exitRoom = async () => {
    try {
      setExitLoading(true);
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
        socket.disconnect();
        navigate("/room");
      }
    } catch (error) {
      setIsServerError(true);
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
                <IconButton>
                  <FileCopyIcon
                    sx={{ color: "yellow", margin: { xs: 0, md: "0 10px" } }}
                    onClick={copyRoomLink}
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
              <Tooltip title="Open settings">
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
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={3000}
        open={isServerError}
        color="danger"
        variant="solid"
        onClose={handleSnackbarClose}
        startDecorator={<ErrorOutlineIcon />}
      >
        <div>
          <p>Unable to exit room</p>
          <p>Please try again later</p>
        </div>
      </Snackbar>
    </>
  );
}
export default MenuAppBar;

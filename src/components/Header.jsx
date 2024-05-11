import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import { Avatar, Box, IconButton, Menu, Tooltip } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingButton from "@mui/lab/LoadingButton";
import EditIcon from "@mui/icons-material/Edit";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { verifyUsername } from "../../services/helpers";
import { setUsername } from "../store/userSlice";

const Header = ({ renderProfile }) => {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [editUsernameState, setEditUsernameState] = useState({
    state: false,
    value: "",
    loading: false,
    error: "",
  });
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { username, email, isGuest } = useSelector((state) => state.userInfo);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
    setEditUsernameState({
      state: false,
      value: "",
      loading: false,
      error: "",
    });
  };
  const handleChangeUsername = async () => {
    try {
      setEditUsernameState((prev) => {
        return { ...prev, loading: true };
      });
      // The code after this line is not executing
      const verify = verifyUsername(editUsernameState.value);
      if (!verify.valid) {
        setEditUsernameState((prev) => {
          return { ...prev, error: verify.response, loading: false };
        });
        return;
      }
      const body = { newUsername: editUsernameState.value };
      const response = await axios.patch(`${baseUrl}/user`, body, {
        // method: "patch",
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
        if (response.status === 403) {
          setEditUsernameState((prev) => {
            return { ...prev, error: resData.msg, loading: false };
          });
        } else if (response.status === 404) {
          setEditUsernameState((prev) => {
            return {
              ...prev,
              error: "Guest users are not alllowed to change username",
              loading: false,
            };
          });
        } else {
          setEditUsernameState((prev) => {
            return {
              ...prev,
              error: "An error occured, please try again later",
              loading: false,
            };
          });
        }
        return;
      }
      if (response.status === 200) {
        dispatch(setUsername(editUsernameState.value));
        setEditUsernameState((prev) => {
          return { state: false, loading: false, error: "", value: "" };
        });
        return;
      }
    } catch (error) {
      console.error(error);
      setEditUsernameState((prev) => {
        return {
          ...prev,
          error: "An error occured, please try again later",
          loading: false,
        };
      });
    }
  };
  const handleLogOut = async () => {
    try {
      setLogoutLoading(true);
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
        }
        if (response.status === 401 || response.status === 403) {
          console.error(`Invalid token or no token provided`);
        }
        return;
      }
      if (response.status === 200) {
        setLogoutLoading(false);
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLogoutLoading(false);
    }
  };
  return (
    <AppBar position="static">
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Toolbar disableGutters>
          <PlayCircleFilledIcon
            fontSize="large"
            sx={{ display: "flex", mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: "flex",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: { xs: ".2rem", md: ".3rem" },
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Mp4ToGether
          </Typography>
        </Toolbar>
        {renderProfile && (
          <Box>
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
                {editUsernameState.state ? (
                  <>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      defaultValue={username}
                      onChange={(e) => {
                        setEditUsernameState((prev) => {
                          prev.value = e.target.value;
                          return prev;
                        });
                      }}
                      disabled={editUsernameState.loading}
                      className="pl-1 border-b-2 border-l-2 border-black outline-none"
                    />
                    <LoadingButton
                      onClick={handleChangeUsername}
                      loading={editUsernameState.loading}
                    >
                      <SendIcon />
                    </LoadingButton>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={username}
                      readOnly
                      disabled={editUsernameState.loading}
                      className="w-1/4 bg-transparent border-none outline-none"
                    />
                    <LoadingButton
                      loading={editUsernameState.loading}
                      onClick={() => {
                        setEditUsernameState((prev) => {
                          return { ...prev, state: true };
                        });
                      }}
                    >
                      <EditIcon />
                    </LoadingButton>
                  </>
                )}
                <p
                  style={{
                    fontSize: "15px",
                    color: "red",
                    display: editUsernameState.error !== "" ? "block" : "none",
                  }}
                >
                  {editUsernameState.error}
                </p>
              </Box>
              <Box id="email-box" className="pl-2 pr-2">
                <span>
                  email &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;{" "}
                  {email}
                </span>
              </Box>
              <LoadingButton
                onClick={handleLogOut}
                loading={logoutLoading}
                color="warning"
                variant="contained"
                sx={{ width: "75%", display: "block", margin: "10px auto" }}
              >
                Log out
              </LoadingButton>
            </Menu>
          </Box>
        )}
      </Container>
    </AppBar>
  );
};

export default Header;

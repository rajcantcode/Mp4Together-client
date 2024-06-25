import * as React from "react";
import axios from "axios";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUsername, setEmail } from "../store/userSlice";
import Header from "../components/Header";
import SendIcon from "@mui/icons-material/Send";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Snackbar from "@mui/joy/Snackbar";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/InputOtp";
import "../stylesheets/auth.css";
function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="/">
        Mp4Together
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function SignIn() {
  const errorRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isServerError, setIsServerError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localEmail, setLocalEmail] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      verifyOtp();
    }
  }, [otp]);

  useEffect(() => {
    import("./Room");
  }, []);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const handleSnackbarClose = () => {
    setIsServerError(false);
  };

  const inpOtpStyle = {
    backgroundColor: "transparent",
    backgroundImage:
      "linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))",
    borderRadius: "5px",
    // borderColor: "red",
  };
  const handleSubmit = async (event) => {
    setLoading(true);
    event.preventDefault();
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    const data = new FormData(event.currentTarget);

    const loginInfo = {
      emailOrUsername: data.get("emailOrUsername"),
      password: data.get("password"),
    };

    try {
      const response = await axios.post(`${baseUrl}/auth/login`, loginInfo, {
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

      // Check for invalid email or password
      if (response.status !== 200) {
        if (response.status === 401 && resData.email) {
          setLocalEmail(resData.email);
        } else if (response.status === 401 || response.status === 403) {
          errorRef.current.textContent = resData.message;
          errorRef.current.style.display = "block";
        }
      } else {
        const { username, email } = resData;
        dispatch(setUsername(username));
        dispatch(setEmail(email));
        errorRef.current.textContent = "";
        errorRef.current.style.display = "none";
        navigate(`/room`);
      }
    } catch (error) {
      setIsServerError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      if (!/^\d{6}$/.test(otp)) {
        errorRef.current.textContent = "OTP should be exactly 6 digits long";
        return;
      }

      const response = await axios.post(
        `${baseUrl}/auth/verify`,
        { email: localEmail, otp, sendUserDetails: true },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: function (status) {
            // Consider any status code less than 500 as a success
            return status >= 200 && status < 500;
          },
        }
      );
      const resData = response.data;
      if (response.status !== 200) {
        if (response.status === 401) {
          errorRef.current.textContent = "OTP expired or invalid";
        }
        if (response.status === 403) {
          errorRef.current.textContent = resData.message;
        }
      } else {
        const { username, email } = resData;
        dispatch(setUsername(username));
        dispatch(setEmail(email));
        errorRef.current.textContent = "";
        errorRef.current.style.display = "none";
        navigate(`/room`);
      }
    } catch (error) {
      setIsServerError(true);
      console.error(error);
    } finally {
      setOtp("");
      setLoading(false);
    }
  };
  const resendOtp = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${baseUrl}/auth/resend`,
        { email: localEmail },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: function (status) {
            // Consider any status code less than 500 as a success
            return status >= 200 && status < 500;
          },
        }
      );
      const resData = response.data;
      if (response.status !== 200) {
        if (response.status === 404 || response.status === 403) {
          errorRef.current.textContent = resData.message;
        }
        return;
      }
      errorRef.current.textContent = "New otp sent to your email";
    } catch (error) {
      setIsServerError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ThemeProvider theme={defaultTheme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "#04e2bf" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography
              component="h1"
              variant="h5"
              align="center"
              sx={{ color: "white" }}
            >
              {localEmail === ""
                ? "Sign in"
                : `Please enter the verification code sent to ${localEmail}`}
            </Typography>
            {localEmail === "" ? (
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ mt: 1 }}
                className="auth-form"
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  type="text"
                  id="email"
                  label="Enter e-mail or username"
                  name="emailOrUsername"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  sx={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3))",
                    borderRadius: "5px",
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  disabled={loading}
                  sx={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3))",
                    borderRadius: "5px",
                  }}
                />
                <Typography
                  variant="h6"
                  display="none"
                  ref={errorRef}
                  sx={{
                    color: "#ef4444",
                    textShadow: "1px 1px 2px #141414",
                    letterSpacing: "2px",
                  }}
                >
                  Invalid email or password
                </Typography>
                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    fontSize: "1.2rem",
                    backgroundColor: "#02c6a2",
                    transition: "filter 0.3s, color 0.6s",
                    "&:hover": {
                      backgroundColor: "#02c6a2",
                      filter: "brightness(1.2)",
                      color: "black",
                    },
                  }}
                  loading={loading}
                >
                  Sign In
                </LoadingButton>
                <Grid container>
                  <Grid item xs></Grid>
                  <Grid item>
                    <Link
                      href="/register"
                      variant="body2"
                      sx={{ color: "white", textDecoration: "underline" }}
                    >
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box className="flex flex-col items-center w-full ">
                <Box className="mt-8">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} style={inpOtpStyle} />
                      <InputOTPSlot index={1} style={inpOtpStyle} />
                      <InputOTPSlot index={2} style={inpOtpStyle} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} style={inpOtpStyle} />
                      <InputOTPSlot index={4} style={inpOtpStyle} />
                      <InputOTPSlot index={5} style={inpOtpStyle} />
                    </InputOTPGroup>
                  </InputOTP>
                </Box>
                <p
                  className={`mt-5 text-center ${
                    errorRef.current.textContent.includes("New otp")
                      ? "text-green-500"
                      : "text-red-500"
                  } font-bold tracking-[3px]`}
                  style={{
                    textShadow: "1px 1px 2px #141414",
                  }}
                  ref={errorRef}
                ></p>
                <LoadingButton
                  sx={{
                    display: "block",
                    width: "fit-content",
                    marginTop: "1.25rem",
                    color: "white",
                    borderColor: "#8dee86",
                    "&:hover": {
                      textDecoration: "none",
                      backgroundImage:
                        "linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))",
                      border: "1px solid #8dee86",
                    },
                  }}
                  disableRipple={true}
                  variant="outlined"
                  onClick={resendOtp}
                  loading={loading}
                >
                  Resend otp
                </LoadingButton>
              </Box>
            )}
          </Box>
          <Copyright sx={{ mt: 8, mb: 4, color: "white" }} />
        </Container>
      </ThemeProvider>
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
          <p>There was an error processing your request</p>
          <p>Please try again later</p>
        </div>
      </Snackbar>
    </>
  );
}

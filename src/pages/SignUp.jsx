import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

import axios from "axios";

import Header from "../components/Header";
import LoadingButton from "@mui/lab/LoadingButton";
import SendIcon from "@mui/icons-material/Send";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/InputOtp";

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
        Mp4ToGether
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const defaultTheme = createTheme();

export default function SignUp() {
  // Will be used later to redirect user to /room if signup successful
  const navigate = useNavigate();

  // This state variable will be used to display error messages to the user on signUp form when they enter invalid details.
  const [signUpErrMsg, setSignUpErrMsg] = useState({
    emailErr: "",
    passwordErr: "",
    usernameErr: "",
    otpErr: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const [isServerError, setIsServerError] = useState(false);
  const handleSnackbarClose = () => {
    setIsServerError(false);
  };

  function validateUserData(email, password, username) {
    setSignUpErrMsg({
      emailErr: "",
      passwordErr: "",
      usernameErr: "",
      otpErr: "",
    });

    // Regular expression pattern for validating email addresses and username
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const usernamePattern = /^[A-Za-z0-9]+$/;

    // This check is used for checking if user has entered all details correctly
    if (
      emailPattern.test(email) &&
      password.length >= 8 &&
      password.length <= 15 &&
      username.length >= 4 &&
      username.length <= 15 &&
      usernamePattern.test(username)
    ) {
      setSignUpErrMsg({
        emailErr: "",
        passwordErr: "",
        usernameErr: "",
        otpErr: "",
      });
      return true;
    }

    // If the above check fails then we check for individual input to test which input is invalid.
    // Once we know, which input is invalid, we set it's errror msg in the 'signUpErrMsg' state variable, so the user can be notified about the invalid inputs
    // Check if the email matches the email pattern.
    if (!emailPattern.test(email)) {
      setSignUpErrMsg((state) => {
        return { ...state, emailErr: "Please enter a valid email address" };
      });
    }

    // Check if the password is at least 8 characters long.
    if (password.length < 8 || password.length > 15) {
      setSignUpErrMsg((state) => {
        return {
          ...state,
          passwordErr: "Password must be between 8 to 15 characters in length",
        };
      });
    }

    // Check if the username is at least 4 characters long.
    if (username.length < 4 || username.length > 15) {
      setSignUpErrMsg((state) => {
        return {
          ...state,
          usernameErr: "Username must be between 4 to 15 characters long",
        };
      });
    }

    // Check if the username contains any special characters
    if (!usernamePattern.test(username)) {
      setSignUpErrMsg((state) => {
        return {
          ...state,
          usernameErr: "Username can only contain letters and numbers",
        };
      });
    }

    return false;
  }

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL;
      const data = new FormData(event.currentTarget);
      const email = data.get("email");
      const password = data.get("password");
      const username = data.get("username");

      if (!validateUserData(email, password, username)) {
        console.log("Invalid user");
        return;
      }

      // Make request to create new User
      const userInfo = {
        email,
        password,
        username,
      };
      const response = await axios.post(`${baseUrl}/auth/signup`, userInfo, {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          // Consider any status code less than 500 as a success
          return status >= 200 && status < 500;
        },
      });

      // Check for username or email already exists
      if (response.status === 409) {
        const resData = response.data;
        if (resData.message === "Username is already taken") {
          setSignUpErrMsg((state) => {
            return { ...state, usernameErr: "Username is already taken" };
          });
        } else {
          setSignUpErrMsg((state) => {
            return { ...state, emailErr: "Email is already registered" };
          });
        }
      }
      // Check for Joi validation errors
      else if (response.status === 403) {
        const resData = response.data;
        if (
          resData.message.includes("email") ||
          resData.message.includes("Email")
        ) {
          setSignUpErrMsg((state) => {
            return { ...state, emailErr: resData.message };
          });
        } else if (
          resData.message.includes("password") ||
          resData.message.includes("Password")
        ) {
          setSignUpErrMsg((state) => {
            return { ...state, passwordErr: resData.message };
          });
        } else {
          setSignUpErrMsg((state) => {
            return { ...state, usernameErr: resData.message };
          });
        }
      } else if (response.status === 201) {
        const { email } = response.data;
        setEmail(email);
        setSignUpErrMsg({
          emailErr: "",
          passwordErr: "",
          usernameErr: "",
          otpErr: "",
        });
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
      const baseUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.put(
        `${baseUrl}/auth/verify`,
        { email, otp },
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
        if (response.status === 401) {
          setSignUpErrMsg((state) => ({
            ...state,
            otpErr: "OTP expired or invalid",
          }));
        }
        if (response.status === 403) {
          setSignUpErrMsg((state) => ({
            ...state,
            otpErr: resData.message,
          }));
        }
      } else {
        setSignUpErrMsg({
          emailErr: "",
          passwordErr: "",
          usernameErr: "",
          otpErr: "",
        });
        navigate("/login");
      }
    } catch (error) {
      setIsServerError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.put(
        `${baseUrl}/auth/resend`,
        { email },
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
          setSignUpErrMsg((state) => ({
            ...state,
            otpErr: resData.message,
          }));
        }
        return;
      }
      setSignUpErrMsg({
        emailErr: "",
        passwordErr: "",
        usernameErr: "",
        otpErr: "New otp sent to your email",
      });
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
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" align="center">
              {email === ""
                ? "Sign up"
                : `Please enter the verification code sent to ${email}`}
            </Typography>
            {email === "" ? (
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit}
                sx={{ mt: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid
                    item
                    xs={24}
                    sm={12}
                    sx={{
                      "::after": {
                        content: `'${signUpErrMsg.usernameErr}'`,
                        color: "red",
                      },
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      "::after": {
                        content: `'${signUpErrMsg.emailErr}'`,
                        color: "red",
                      },
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      "::after": {
                        content: `'${signUpErrMsg.passwordErr}'`,
                        color: "red",
                      },
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}></Grid>
                </Grid>
                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  loading={loading}
                >
                  Sign Up
                </LoadingButton>
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Link href="/login" variant="body2">
                      Already have an account? Sign in
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                  }}
                >
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <LoadingButton
                    sx={{ width: "fit-content" }}
                    disableRipple={true}
                    variant="text"
                    onClick={verifyOtp}
                    loading={loading}
                  >
                    <SendIcon sx={{ fontSize: "1.9rem" }} />
                  </LoadingButton>
                </Box>
                <p
                  className="mt-5 mr-[35px] text-center"
                  style={{
                    color: signUpErrMsg.otpErr.includes("New ")
                      ? "green"
                      : "red",
                  }}
                >
                  {signUpErrMsg.otpErr}
                </p>
                <LoadingButton
                  sx={{
                    display: "block",
                    width: "fit-content",
                    marginTop: "1.25rem",
                    marginLeft: "80px",
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

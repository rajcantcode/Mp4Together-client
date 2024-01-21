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
  });

  const [isServerError, setIsServerError] = useState(false);
  const handleSnackbarClose = () => {
    setIsServerError(false);
  };

  function validateUserData(email, password, username) {
    setSignUpErrMsg({ emailErr: "", passwordErr: "", usernameErr: "" });
    // Regular expression pattern for validating email addresses.
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // This check is used for checking if user has entered all details correctly
    if (
      emailPattern.test(email) &&
      password.length >= 8 &&
      username.length >= 4
    ) {
      setSignUpErrMsg({ emailErr: "", passwordErr: "", usernameErr: "" });
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
    if (password.length < 8) {
      setSignUpErrMsg((state) => {
        return {
          ...state,
          passwordErr: "Password must be at least 8 characters long",
        };
      });
    }

    // Check if the username is at least 4 characters long.
    if (username.length < 4) {
      setSignUpErrMsg((state) => {
        return {
          ...state,
          usernameErr: "Username must be at least 4 characters long",
        };
      });
    }

    return false;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    const username = data.get("username");

    if (!validateUserData(email, password, username)) {
      return;
    }

    // Make request to create new User
    const userInfo = {
      email,
      password,
      username,
    };

    try {
      const response = await axios.post(`${baseUrl}/auth/signup`, userInfo, {
        withCredentials: true,
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
        if (resData.msg === "Username is already taken") {
          setSignUpErrMsg((state) => {
            return { ...state, usernameErr: "Username is already taken" };
          });
        } else {
          setSignUpErrMsg((state) => {
            return { ...state, emailErr: "Email is already registered" };
          });
        }
      } else {
        setSignUpErrMsg({ emailErr: "", passwordErr: "", usernameErr: "" });
        navigate("/login");
      }
    } catch (error) {
      setIsServerError(true);
      console.error(error);
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
            <Typography component="h1" variant="h5">
              Sign up
            </Typography>
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
                  />
                </Grid>
                <Grid item xs={12}></Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="/login" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 5 }} />
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

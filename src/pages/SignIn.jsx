import * as React from "react";
import axios from "axios";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUsername, setEmail } from "../store/userSlice";
import Header from "../components/Header";

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
import { useState } from "react";
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
  const handleSnackbarClose = () => {
    setIsServerError(false);
  };
  const handleSubmit = async (event) => {
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
        if (response.status === 401 || response.status === 403) {
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
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
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
              />
              <Typography
                variant="h6"
                color="red"
                display="none"
                ref={errorRef}
              >
                Invalid email or password
              </Typography>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs></Grid>
                <Grid item>
                  <Link href="/register" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
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

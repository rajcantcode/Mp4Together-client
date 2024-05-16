import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authenticateUser } from "../../services/helpers";
import "./welcome.css";
import "../stylesheets/spinner.css";
import Header from "../components/Header";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "axios";
import { setEmail, setIsGuest, setUsername } from "../store/userSlice";
import { setKickSnackbarInfo } from "../store/roomSlice";

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(true); // State to track loading status
  const [loadGuestLogin, setLoadGuestLogin] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const response = await authenticateUser(dispatch);
        if (response.status === 200) navigate("/room");
        else if (response.status === 403) navigate("/login");
      } catch (error) {
        // Handle server error here
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  const handleGuestLogin = async () => {
    try {
      setLoadGuestLogin(true);
      const response = await axios(`${baseUrl}/auth/guest`, {
        method: "post",
        withCredentials: true,
        validateStatus: function (status) {
          //Consider any status code less than 500 as a success
          return status >= 200 && status < 500;
        },
      });
      const resData = response.data;
      if (response.status === 200) {
        const { email, username } = resData;
        dispatch(setUsername(username));
        dispatch(setEmail(email));
        dispatch(setIsGuest(true));
        dispatch(
          setKickSnackbarInfo({
            show: true,
            title: "Guest accounts are only valid for one hour",
            color: "success",
          })
        );
        navigate("/room");
      }
    } catch (error) {
      console.error(error);
      // ToDo - display snackbar for server error
    } finally {
      setLoadGuestLogin(false);
    }
  };

  return (
    <div className="relative w-screen h-screen welcome-container">
      <Header />
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
          <div className="container">
            <h1 className="welcome-text">Welcome to Mp4Together</h1>
            <div className="buttons-container">
              <Link to="/register" className="btn register-btn">
                Register
              </Link>
              <Link to="/login" className="btn login-btn">
                Login
              </Link>
              <LoadingButton
                sx={{
                  margin: "10px",
                  padding: "10px",
                  fontSize: "18px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  width: "200px",
                  transition: "background-color 0.3s, color 0.3s",
                  backgroundColor: "#ecc03e !important",
                  // color: "#333",
                  fontFamily:
                    "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
                  textTransform: "none",
                  fontWeight: "400",
                  ":hover": { filter: "brightness(1.1)" },
                }}
                variant="contained"
                onClick={handleGuestLogin}
                loading={loadGuestLogin}
              >
                Login as Guest
              </LoadingButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Welcome;

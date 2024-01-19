import {
  setRoomAdmins,
  setRoomId,
  setRoomMembers,
  setRoomValidity,
  setSocketRoomId,
  setSocketRoomValidity,
} from "../src/store/roomSlice";
import {
  setVideoId,
  setVideoStartTime,
  setVideoUrl,
  setVideoUrlValidity,
} from "../src/store/videoUrlSlice";
import { setUsername, setEmail } from "../src/store/userSlice";
import axios from "axios";

export const authenticateUser = async function (dispatch) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  try {
    const response = await axios.get(`${baseUrl}/auth`, {
      withCredentials: true,
      validateStatus: function (status) {
        // Consider any status code less than 500 as a success
        return status >= 200 && status < 500;
      },
    });

    if (response.status === 200) {
      const resData = response.data;
      const { email, username } = resData;
      dispatch(setUsername(username));
      dispatch(setEmail(email));
      //   navigate(`/room`);
      return { status: 200 };
    } else {
      // Invalid token (Expired token)
      if (response.status === 403) {
        // Redirect user to logIn page, so They can generate a new token
        // navigate("/login");
        return { status: 403 };
      }
      // No token provided
      else if (response.status === 401) {
        // If no token provided, keep on the same page and let the user decide if they want to login or sign up
        return { status: 401 };
      }
    }
    // setIsLoading(false);
  } catch (error) {
    // Handle server error here

    throw error;
  }
};

export const resetRoomSlice = (dispatch) => {
  dispatch(setSocketRoomId(""));
  dispatch(setRoomId(""));
  dispatch(setRoomMembers([]));
  dispatch(setRoomAdmins([]));
  dispatch(setRoomValidity(false));
  dispatch(setSocketRoomValidity(false));
};

export const resetVideoSlice = (dispatch) => {
  dispatch(setVideoUrl(""));
  dispatch(setVideoId(""));
  dispatch(setVideoUrlValidity(false));
  dispatch(setVideoStartTime(0));
};

export const executeFetchUser = {
  execute: true,
};

export const fetchUser = async (reqRoomId) => {
  if (!executeFetchUser.execute) return null;
  executeFetchUser.execute = false;
  try {
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
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
      if (response.status === 401 || response.status === 403) {
        // setIsValidUser(false);
        return {
          status: response.status,
        };
      }
      if (response.status === 404) {
        // errorRef.current.textContent = `${resData.msg}`;
        return {
          status: 404,
          msg: resData.msg,
        };
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
      } = resData;

      return {
        status: 200,
        roomId,
        socketRoomId,
        members,
        admins,
        username,
        email,
        videoUrl,
      };
    }
  } catch (error) {
    console.error(error);
  } finally {
    executeFetchUser.execute = false;
  }
};

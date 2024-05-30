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
import { setUsername, setEmail, setIsGuest } from "../src/store/userSlice";
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
      const { email, username, guest } = resData;
      dispatch(setUsername(username));
      dispatch(setEmail(email));
      dispatch(setIsGuest(guest));
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
        membersMicState,
        guest,
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
        membersMicState,
        guest,
      };
    }
  } catch (error) {
    console.error(error);
  } finally {
    executeFetchUser.execute = true;
  }
};

export const verifyUsername = (username) => {
  try {
    const usernamePattern = /^[A-Za-z0-9]+$/;
    if (
      username.length >= 4 &&
      username.length <= 15 &&
      usernamePattern.test(username)
    ) {
      return { response: "valid username", valid: true };
    }
    if (username.length < 4 || username.length > 15) {
      return {
        response: "Username must be between 4 to 15 characters long",
        valid: false,
      };
    }
    if (!usernamePattern.test(username)) {
      return {
        response: "Username can only contain letters and numbers",
        valid: false,
      };
    }
  } catch (error) {
    console.error(error);
  }
};

export const openFileSelector = async (accept) => {
  return new Promise((resolve, reject) => {
    const inputEl = document.createElement("input");
    inputEl.type = "file";
    inputEl.multiple = false;
    if (accept) inputEl.accept = accept;

    const videoEl = document.createElement("video");
    videoEl.style.display = "none";
    document.body.appendChild(videoEl);

    inputEl.addEventListener("change", () => {
      const file = inputEl.files[0];
      if (file) {
        const fileExtension = file.name.split(".").pop().toLowerCase();
        if (
          file.type.startsWith("video/") ||
          ["mp4", "webm", "ogg", "mkv"].includes(fileExtension)
        ) {
          const url = URL.createObjectURL(file);
          videoEl.src = url;
          videoEl.addEventListener("canplay", () => {
            resolve({ file });
            URL.revokeObjectURL(url);
            document.body.removeChild(videoEl);
          });
          videoEl.addEventListener("error", () => {
            reject(new Error("Selected file is not a valid video file"));
            URL.revokeObjectURL(url);
            document.body.removeChild(videoEl);
          });
        } else {
          reject(new Error("Selected file is not a video file"));
        }
      }
    });
    inputEl.click();
  });
};

export const startFileShare = async () => {
  try {
    const { file } = await openFileSelector("video/*");
    if (!file) return;
    const url = URL.createObjectURL(file);
    return url;
  } catch (error) {
    throw error;
  }
};

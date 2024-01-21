import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import "../stylesheets/videoPlayer.css";
// Base styles for media player and provider (~400B).
import ReactPlayer from "react-player/youtube";
import { getSocket } from "../socket/socketUtils";

// Default behaviour -
// Admin will cotrol the video, ie : if admin pauses the videos of other members also pauses and if admin skips forward ....
// Other users can pause, play, skip forward, backward but that will not effect other members in the room. They can again return to the current timestamp of the video using a 'live' button, that will take them to the current timestamp of the video playing on the admin's side.
// Also introduce a lock state, Lock state can be enabled or disabled by the admin.
// Once enabled, other members can only pause or play the video on their side.

const VideoPlayer = () => {
  const socket = getSocket();
  const { videoId, videoUrl, startTime } = useSelector(
    (state) => state.videoUrl
  );
  const { socketRoomId, admins } = useSelector((state) => state.roomInfo);
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(true);

  // The below two state variables solely exist to determine whether "handlePlayVideo" and "handlePauseVideo" function should execute or not.
  // Since I am using "isPlaying" to pause or play the video, and changing state of "isPlaying" leads to calling "handlePlayVideo" or "handlePauseVideo" depending upon value of "isPlaying", which causes infinite loop in those functions.
  // So I use "isTimestamp" and "executeHandlePauseVideo" as guard clause to return
  const [isTimestamp, setIsTimestamp] = useState(false);
  const [executeHandlePauseVideo, setExecuteHandlePauseVideo] = useState(true);

  const videoRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      socket.on("get-timestamp", emitTimestamp);
      return () => {
        socket.off("get-timestamp", emitTimestamp);
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    socket.on("server-pause-video", handlePauseEvent);
    socket.on("server-play-video", handlePlayEvent);
    socket.on("timestamp", handleTimestamp);
    return () => {
      socket.off("server-pause-video", handlePauseEvent);
      socket.off("server-play-video", handlePlayEvent);
      socket.off("timestamp", handleTimestamp);
    };
  }, []);
  const handlePauseEvent = (data) => {
    setExecuteHandlePauseVideo(false);
    setIsPlaying(false);
  };
  const handlePlayEvent = ({ curTimestamp }) => {
    setIsTimestamp(true);
    videoRef.current.seekTo(curTimestamp, "seconds");
    setIsPlaying(true);
  };

  const handleTimestamp = ({ timestamp }) => {
    setIsTimestamp(true);
    videoRef.current.seekTo(timestamp, "seconds");
    setIsPlaying(true);
  };

  const emitTimestamp = ({ requester }) => {
    const timestamp = Math.trunc(videoRef.current.getCurrentTime());
    socket.on("received-timestamp", () => {
      setIsTimestamp(true);
      videoRef.current.seekTo(timestamp, "seconds");
      setIsPlaying(true);
    });
    socket.emit("send-timestamp", {
      timestamp,
      socketRoom: socketRoomId,
      username: requester,
      admin: username,
    });
  };

  const handlePlayVideo = () => {
    if (isTimestamp) {
      setIsTimestamp(false);
      return;
    }
    if (isAdmin) {
      const curTimestamp = Math.trunc(videoRef.current.getCurrentTime());
      socket.emit("play-video", { socketRoomId, curTimestamp });
    } else {
      socket.emit("req-timestamp", {
        socketRoom: socketRoomId,
        admin: admins[0],
        username,
      });
    }
  };

  const handlePauseVideo = () => {
    if (!executeHandlePauseVideo) {
      setExecuteHandlePauseVideo(true);
      return;
    }
    if (isAdmin) {
      socket.emit("pause-video", { socketRoomId });
    }
  };

  const handleError = (error) => {
    console.log("##### Error in react-player #####");
    if (error === 150) {
      console.log("No such video exists");
    }
  };
  return (
    <ReactPlayer
      ref={videoRef}
      playing={isPlaying}
      url={videoUrl}
      style={{ width: "100%", height: "100%" }}
      onError={handleError}
      onPlay={handlePlayVideo}
      onPause={handlePauseVideo}
      controls={isAdmin}
      config={{
        youtube: {
          playerVars: {
            start: startTime,
            disablekb: isAdmin ? 0 : 1,
            autoplay: 1,
          },
        },
      }}
    />
  );
};

export default VideoPlayer;

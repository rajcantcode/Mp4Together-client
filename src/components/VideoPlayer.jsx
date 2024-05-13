import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import "../stylesheets/videoPlayer.css";
// Base styles for media player and provider (~400B).
import ReactPlayer from "react-player/youtube";

// Default behaviour -
// Admin will cotrol the video, ie : if admin pauses the videos of other members also pauses and if admin skips forward ....
// Other users can pause, play but that will not effect other members in the room.

const VideoPlayer = ({ socket }) => {
  const { videoId, videoUrl, startTime } = useSelector(
    (state) => state.videoUrl
  );
  const { socketRoomId, admins, roomId } = useSelector(
    (state) => state.roomInfo
  );
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(true);
  // Video playback state
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // The below two state variables solely exist to determine whether "handlePlayVideo" and "handlePauseVideo" function should execute or not.
  // Since I am using "isPlaying" to pause or play the video, and changing state of "isPlaying" leads to calling "handlePlayVideo" or "handlePauseVideo" depending upon value of "isPlaying", which causes infinite loop in those functions.
  // So I use "isTimestamp" and "executeHandlePauseVideo" as guard clause to return
  const [isTimestamp, setIsTimestamp] = useState(false);
  const [executeHandlePauseVideo, setExecuteHandlePauseVideo] = useState(true);

  const videoRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    if (isAdmin) {
      socket.on("get-timestamp", emitTimestamp);
      return () => {
        socket.off("get-timestamp", emitTimestamp);
      };
    }
  }, [isAdmin, socket]);

  useEffect(() => {
    if (socket === null) return;
    socket.on("server-pause-video", handlePauseEvent);
    socket.on("server-play-video", handlePlayEvent);
    socket.on("timestamp", handleTimestamp);
    socket.on("receive-playback-rate", handlePlaybackEvent);
    return () => {
      socket.off("server-pause-video", handlePauseEvent);
      socket.off("server-play-video", handlePlayEvent);
      socket.off("timestamp", handleTimestamp);
      socket.off("receive-playback-rate", handlePlaybackEvent);
    };
  }, [socket]);
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

  const handlePlaybackEvent = ({ speed }) => {
    setPlaybackSpeed(speed);
  };

  const emitTimestamp = ({ requester }) => {
    if (!socket) return;
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
      mainRoomId: roomId,
    });
  };

  const handlePlayVideo = () => {
    if (!socket) return;
    if (isTimestamp) {
      setIsTimestamp(false);
      return;
    }
    if (isAdmin) {
      const curTimestamp = Math.trunc(videoRef.current.getCurrentTime());
      socket.emit("play-video", {
        socketRoomId,
        curTimestamp,
        username,
        mainRoomId: roomId,
      });
    } else {
      socket.emit("req-timestamp", {
        socketRoom: socketRoomId,
        admin: admins[0],
        username,
        mainRoomId: roomId,
      });
    }
  };

  const handlePauseVideo = () => {
    if (!socket) return;
    if (!executeHandlePauseVideo) {
      setExecuteHandlePauseVideo(true);
      return;
    }
    if (isAdmin) {
      socket.emit("pause-video", {
        socketRoomId,
        username,
        mainRoomId: roomId,
      });
    }
  };

  const handlePlaybackVideo = (speed) => {
    if (!socket) return;
    if (isAdmin) {
      socket.emit("send-playback-rate", {
        speed,
        socketRoomId,
        username,
        mainRoomId: roomId,
      });
    }
  };

  const handleError = (error) => {
    console.log("##### Error in react-player #####");
    if (error === 150) {
      console.log("No such video exists");
    }
  };
  return (
    <>
      {isAdmin ? (
        <ReactPlayer
          ref={videoRef}
          playing={isPlaying}
          className="admin-player"
          url={videoUrl}
          style={{ width: "100%", height: "100%" }}
          playbackRate={playbackSpeed}
          onError={handleError}
          onPlay={handlePlayVideo}
          onPause={handlePauseVideo}
          onPlaybackRateChange={handlePlaybackVideo}
          controls={true}
          config={{
            youtube: {
              playerVars: {
                start: startTime,
                disablekb: 0,
                autoplay: 1,
              },
            },
          }}
        />
      ) : (
        <ReactPlayer
          ref={videoRef}
          playing={isPlaying}
          url={videoUrl}
          className="normal-player"
          style={{ width: "100%", height: "100%" }}
          playbackRate={playbackSpeed}
          onError={handleError}
          onPlay={handlePlayVideo}
          onPause={handlePauseVideo}
          onPlaybackRateChange={handlePlaybackVideo}
          controls={false}
          config={{
            youtube: {
              playerVars: {
                start: startTime,
                disablekb: 1,
                autoplay: 1,
              },
            },
          }}
        />
      )}
    </>
  );
};

export default VideoPlayer;

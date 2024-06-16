import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import "../stylesheets/videoPlayer.css";
// Base styles for media player and provider (~400B).
import ReactPlayer from "react-player/youtube";
import Peer from "peerjs";
import {
  setVideoUrl,
  setVideoUrlValidity,
  setVideoPlaybackSpeed,
} from "../store/videoUrlSlice";

// Default behaviour -
// Admin will cotrol the video, ie : if admin pauses the videos of other members also pauses and if admin skips forward ....
// Other users can pause, play but that will not effect other members in the room.

const VideoPlayer = ({ socket }) => {
  const { videoId, videoUrl, startTime, videoUrlValidity, playbackSpeed } =
    useSelector((state) => state.videoUrl);
  const { socketRoomId, admins, roomId } = useSelector(
    (state) => state.roomInfo
  );
  const { isAdmin, username } = useSelector((state) => state.userInfo);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  // Video playback state
  // const [playbackSpeed, setPlaybackSpeed] = useState({ speed: 1 });

  // The below two state variables solely exist to determine whether "handlePlayVideo" and "handlePauseVideo" function should execute or not.
  // Since I am using "isPlaying" to pause or play the video, and changing state of "isPlaying" leads to calling "handlePlayVideo" or "handlePauseVideo" depending upon value of "isPlaying", which causes infinite loop in those functions.
  // So I use "isTimestamp" and "executeHandlePauseVideo" as guard clause to return
  const [isTimestamp, setIsTimestamp] = useState(false);
  const [executeHandlePauseVideo, setExecuteHandlePauseVideo] = useState(true);

  const videoRef = useRef(null);
  const frontEndUrl = import.meta.env.VITE_FRONTEND_URL;
  const [peer, setPeer] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const dispatch = useDispatch();

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
    if (!socket) return;
    socket.on("server-pause-video", handlePauseEvent);
    socket.on("server-play-video", handlePlayEvent);
    socket.on("timestamp", handleTimestamp);
    socket.on("receive-playback-rate", handlePlaybackEvent);
    socket.on("conn-peer-server", connectToPeerServer);
    return () => {
      socket.off("server-pause-video", handlePauseEvent);
      socket.off("server-play-video", handlePlayEvent);
      socket.off("timestamp", handleTimestamp);
      socket.off("receive-playback-rate", handlePlaybackEvent);
      socket.off("conn-peer-server", connectToPeerServer);
    };
  }, [socket]);

  useEffect(() => {
    if (!isAdmin) return;
    try {
      let localPeer;
      if (!videoUrl && localPeer) {
        localPeer.destroy();
        setPeer(null);
        // send socket event to server, to let other participants know to destroy their peer connection
        socket.emit("dest-peer");
        return;
      }
      if (!videoUrl.startsWith("blob:") && localPeer) {
        localPeer.destroy();
        setPeer(null);
        // send socket event to server, to let other participants know to destroy their peer connection
        return;
      }

      if (videoUrl.startsWith("blob:") && localPeer) {
        socket.emit("create-peer-conn");
      }

      if (!videoUrl.startsWith("blob:") || localPeer) return;

      const serverUrl = import.meta.env.VITE_SERVER_URL;

      localPeer = new Peer(`${socketRoomId}-${username}`);

      localPeer.on("open", async (id) => {
        // send socket event to server, to let other participants know to establish connection with the peerjs server
        socket.emit("create-peer-conn");
        await videoRef.current.play();
        const localStream = await videoRef.current.captureStream();
        setStream(localStream);
      });

      localPeer.on("error", (error) => {
        console.error(error);
      });

      setPeer(localPeer);

      return () => {
        if (localPeer) {
          socket.emit("dest-peer");
          localPeer.destroy();
          setPeer(null);
        }
      };
    } catch (error) {
      console.error(error);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (!socket) return;
    const handleCall = ({ callee }) => {
      setTimeout(() => {
        try {
          const call = peer.call(`${socketRoomId}-${callee}`, stream);
          if (!call) {
            socket.emit("dest-peer", { peer: callee }, ({ status }) => {
              if (status === "success") {
                socket.emit("create-peer-conn");
              }
            });
            return;
          }
          call.on("error", (error) => {
            console.error(error);
          });
        } catch (error) {
          console.error(error);
        }
      }, 10);
    };

    const destPeer = (data, cb) => {
      if (peer) {
        peer.destroy();
        setPeer(null);
        dispatch(setVideoUrlValidity(false));
        dispatch(setVideoUrl(""));
        setRemoteStream(null);
        if (cb) {
          cb({ status: "success" });
        }
      }
    };
    const handleUserJoin = ({ joiner }) => {
      if (!isAdmin) return;
      if (videoUrl.startsWith("blob:") && peer) {
        socket.emit("create-peer-conn", { joiner });
      }
    };

    socket.on("create-call", handleCall);
    socket.on("dest-peer-conn", destPeer);
    socket.on("join-msg", handleUserJoin);
    return () => {
      socket.off("create-call", handleCall);
      socket.off("dest-peer-conn", destPeer);
      socket.off("join-msg", handleUserJoin);
    };
  }, [stream, peer, socket, videoUrl, isAdmin]);

  useEffect(() => {
    if (remoteStream && videoUrlValidity && videoRef.current) {
      (async () => {
        await videoRef.current.load();
        videoRef.current.srcObject = remoteStream;
        await videoRef.current.play();
      })();
    }
  }, [remoteStream, videoUrlValidity, videoRef]);

  useEffect(() => {
    return () => {
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
    };
  }, [peer]);

  // This function connects to the peer server and sends the confirmation to the server that it has connected successfully to the peerjs server, so it can receive stream
  const connectToPeerServer = () => {
    try {
      if (peer) {
        socket.emit("conn-succ");
      }

      const localPeer = new Peer(`${socketRoomId}-${username}`);
      localPeer.on("open", (id) => {
        socket.emit("conn-succ");
      });
      localPeer.on("call", (call) => {
        call.answer(undefined);
        call.on("stream", (stream) => {
          dispatch(setVideoUrlValidity(true));
          setRemoteStream(stream);
        });
        call.on("error", (error) => {
          console.error(error);
        });
      });
      localPeer.on("error", (error) => {
        console.error(error);
      });
      setPeer(localPeer);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePauseEvent = (data) => {
    setExecuteHandlePauseVideo(false);
    setIsPlaying(false);
  };
  const handlePlayEvent = ({ curTimestamp, t }) => {
    setIsTimestamp(true);
    const skipToTime = curTimestamp + (Date.now() - t) / 1000;
    videoRef.current.seekTo(skipToTime, "seconds");
    setIsPlaying(true);
  };

  const handleTimestamp = ({ timestamp, t }) => {
    if (!videoRef.current) return;
    setIsTimestamp(true);
    let skipToTime = timestamp;
    if (t) {
      skipToTime = timestamp + (Date.now() - t) / 1000;
    }
    videoRef.current.seekTo(skipToTime, "seconds");
    setIsPlaying(true);
  };

  const handlePlaybackEvent = ({ speed }) => {
    dispatch(setVideoPlaybackSpeed(speed));
  };

  const emitTimestamp = ({ requester }) => {
    if (!socket) return;
    if (!videoRef.current || videoUrl.startsWith("blob:")) return;
    const timestamp = Math.trunc(videoRef.current.getCurrentTime());
    // socket.on("received-timestamp", () => {
    //   setIsTimestamp(true);
    //   videoRef.current.seekTo(timestamp, "seconds");
    //   setIsPlaying(true);
    // });
    socket.emit("send-timestamp", {
      timestamp,
      socketRoom: socketRoomId,
      username: requester,
      admin: username,
      mainRoomId: roomId,
      t: Date.now(),
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
        t: Date.now(),
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
    // if (!isAdmin) {
    //   // setPlaybackSpeed((prev) => {
    //   //   return { speed: prev.speed };
    //   // });
    //   setPlaybackSpeed({ speed: 1 });
    // }
    if (isAdmin) {
      socket.emit("send-playback-rate", {
        speed,
        socketRoomId,
        username,
        mainRoomId: roomId,
      });
      dispatch(setVideoPlaybackSpeed(speed));
    }
  };

  const handleError = (error) => {
    console.error(error);
    if (error === 150) {
      console.log("No such video exists");
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return videoUrlValidity ? (
    <>
      {videoUrl.startsWith("blob:") || remoteStream ? (
        <div className="flex items-center w-full h-full">
          <div className="video-wrapper w-full h-[480px] max-h-[480px] relative p-1">
            <video
              src={videoUrl}
              controls={true}
              className="w-full h-full"
              ref={videoRef}
            ></video>
          </div>
        </div>
      ) : (
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
                disablekb: isAdmin ? 0 : 1,
                autoplay: 1,
              },
            },
          }}
        />
      )}
    </>
  ) : (
    <></>
  );
};

export default VideoPlayer;

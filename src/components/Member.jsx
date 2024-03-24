import { Box, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSfuSocket, getSocket } from "../socket/socketUtils";
import { setRoomMembersMicState } from "../store/roomSlice";

const Member = ({ name, device }) => {
  const sfuSocket = getSfuSocket();
  const socket = getSocket();
  const { admins, membersMicState, membersMuteState, socketRoomId, roomId } =
    useSelector((state) => state.roomInfo);
  const { username, isAdmin } = useSelector((state) => state.userInfo);
  const [muted, setMuted] = useState(false);
  const [transport, setTransport] = useState(null);
  const transportRef = useRef();
  const [consumer, setConsumer] = useState(null);
  const consumerRef = useRef(null);
  const audioRef = useRef(null);
  const mutedRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    // Warning - Callback hell ahead 💀💀💀
    if (!transport) {
      sfuSocket.emit(
        "createRtcTransport",
        { username, joiner: name },
        (params) => {
          if (params.error) {
            console.error(params.error.message);
            return;
          }
          const { transportOptions } = params;
          const consumerTransport =
            device.createRecvTransport(transportOptions);
          setTransport(consumerTransport);
          consumerTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                sfuSocket.emit(
                  "transport-connect",
                  {
                    dtlsParameters,
                    username,
                    transportOwner: name,
                  },
                  (params) => {
                    if (params.error) {
                      console.error(error.message);
                    }
                  }
                );
                callback();
              } catch (error) {
                console.error(error);
                errback();
              }
            }
          );
          // consumerTransport.on("connectionstatechange", (state) => {
          //   console.log("state of receive transport: ", state);
          // });
          if (membersMicState[name]) {
            // Create a consumer
            createConsumer();
          }
        }
      );
    }
    const handleMicOnOffEvent = ({ username: sender, status }) => {
      if (sender !== name) return;
      // Here status, which is a boolean value indicates the mic status of the "sender" who has sent the event
      if (mutedRef.current) {
        dispatch(setRoomMembersMicState([sender, status]));
        return;
      }
      if (status && consumerRef.current) {
        resumeConsumer();
      } else if (status && !consumerRef.current) {
        createConsumer();
      } else if (!status && consumerRef.current) {
        pauseConsumer();
      }
      dispatch(setRoomMembersMicState([sender, status]));
    };
    const handleUserExit = ({ leaver }) => {
      if (leaver !== name) return;
      sfuSocket.emit("close-transport", { socketRoomId, username, leaver });
      transportRef.current?.close();
      consumerRef.current?.close();
    };
    socket.on("mic-on-off-event", handleMicOnOffEvent);
    socket.on("exit-msg", handleUserExit);
    return () => {
      socket.off("mic-on-off-event", handleMicOnOffEvent);
      socket.off("exit-msg", handleUserExit);
      setTransport(null);
      setConsumer(null);
      transport?.close();
      consumer?.close();
    };
  }, []);

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  useEffect(() => {
    mutedRef.current = muted;
    consumerRef.current = consumer;
  }, [muted, consumer]);

  const handleMic = () => {
    if (!isAdmin || !membersMicState[name]) {
      return;
    }
    socket.emit("mic-on-off", {
      username: name,
      socketRoomId,
      roomId,
      status: false,
    });
    dispatch(setRoomMembersMicState([name, false]));
    // Also pause the consumer
    pauseConsumer();
  };

  const handleSpeaker = () => {
    const curMuteStatus = muted;
    const muteStatusToSet = !curMuteStatus;
    if (muteStatusToSet && membersMicState[name]) {
      // Check if consumer exists, if exists then pause consumer
      if (consumer) {
        pauseConsumer();
      }
      // If consumer does not exist don't do anything
    }
    if (!muteStatusToSet && membersMicState[name]) {
      // Create a consumer if not already exists or resume if already exists
      if (consumer) {
        resumeConsumer();
      } else {
        createConsumer();
      }
    }
    setMuted(muteStatusToSet);
  };

  const createConsumer = () => {
    sfuSocket.emit(
      "consume",
      {
        rtpCapabilities: device.rtpCapabilities,
        producer: name,
        username,
      },
      async (params) => {
        if (params.error) {
          // ToDo - handle error gracefully
          console.error(params.error.message);
          return;
        }
        const { id, producerId, kind, rtpParameters } = params;
        const consumer = await transportRef.current?.consume({
          id,
          producerId,
          kind,
          rtpParameters,
        });

        consumer.on("transportclose", () => {
          console.log("transport closed so consumer closed");
        });
        consumer.on("trackended", () => {
          console.log("Track ended for consumer");
        });

        setConsumer(consumer);
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        audioRef.current.muted = false;
        // audioRef.current.srcObject = new MediaStream([_track]);
        audioRef.current.srcObject = stream;
        // audioRef.current.playsinline = false;
        audioRef.current.autoplay = true;
        // audioRef.current.play().catch((error) => console.error(error));
        sfuSocket.emit(
          "resume-consumer",
          { username, sender: name },
          (params) => {
            if (params.error) {
              console.error(params.error.message);
            }
          }
        );
      }
    );
  };

  const pauseConsumer = () => {
    consumerRef.current.pause();
    sfuSocket.emit(
      "pause-consumer",
      {
        username,
        transportOwner: name,
      },
      (params) => {
        if (params.error) {
          console.error(params.error.message);
          return;
        }
        audioRef.current.pause();
      }
    );
  };

  const resumeConsumer = () => {
    consumerRef.current.resume();
    sfuSocket.emit(
      "resume-consumer",
      {
        username,
        sender: name,
      },
      (params) => {
        if (params.error) {
          // ToDo - Do proper error handling
          console.error(params.error.message);
          return;
        }
        audioRef.current.play().catch((error) => console.error(error));
      }
    );
  };

  const handleRemoveMember = () => {
    if (!isAdmin) return;
    socket.emit(
      "remove-member",
      {
        admin: username,
        member: name,
        socketRoomId,
        mainRoomId: roomId,
      },
      (params) => {
        if (params.error) {
          console.log("There was an error removing ", name);
          console.error(params.error.message);
        } else {
        }
      }
    );
  };

  return (
    <ListItem className="flex justify-between w-full align-middle">
      <ListItemText
        //   Adding 👑 before admin's name
        primary={admins.includes(name) ? "👑 " + name : "ㅤ " + name}
      />
      <Box className="icon-container">
        {/* Render micIcon if the client is Admin, so they can mute other
        participants */}
        {isAdmin && (
          <ListItemIcon
            sx={{
              minWidth: "25px",
              margin: "0 10px",
              cursor: "pointer",
            }}
            onClick={handleMic}
          >
            {membersMicState[name] ? <MicIcon /> : <MicOffIcon />}
          </ListItemIcon>
        )}
        <audio ref={audioRef} className="hidden"></audio>
        <ListItemIcon
          sx={{
            minWidth: "25px",
            margin: "0 10px",
            cursor: "pointer",
          }}
          onClick={handleSpeaker}
        >
          {!muted && membersMicState[name] && <VolumeUpIcon color="success" />}
          {!muted && !membersMicState[name] && (
            <VolumeUpIcon color="disabled" />
          )}
          {muted && <VolumeOffIcon color="error" />}
        </ListItemIcon>
        {isAdmin && (
          <ListItemIcon
            sx={{
              minWidth: "25px",
              margin: "0 10px",
              cursor: "pointer",
            }}
            onClick={handleRemoveMember}
          >
            <PersonRemoveIcon />
          </ListItemIcon>
        )}
      </Box>
    </ListItem>
  );
};

export default Member;

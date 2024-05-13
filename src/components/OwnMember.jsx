import { Box, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import { setRoomMembersMicState } from "../store/roomSlice";

const OwnMember = ({ name, device, socket, sfuSocket }) => {
  const { membersMicState, socketRoomId, roomId } = useSelector(
    (state) => state.roomInfo
  );
  const { isAdmin, username } = useSelector((state) => state.userInfo);
  const [micOn, setMicOn] = useState(membersMicState[name]);
  const [audioTrack, setAudioTrack] = useState(null);
  const [transport, setTransport] = useState(null);
  const [producer, setProducer] = useState(null);
  const audioTrackRef = useRef(null);
  const producerRef = useRef(null);
  const transportRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket || !sfuSocket) return;
    const handleMicOnOffEvent = ({ username: sender, status }) => {
      // Here status, which is a boolean value indicates the mic status of the participant who has sent the event
      if (sender !== name) return;
      // Mute request has been sent by admin
      audioTrackRef.current.stop();
      producerRef.current.pause();
      sfuSocket.emit("pause-producer", { username: name }, (params) => {
        if (params.error) {
          // Handle error here
          console.error(params.error.message);
        }
      });
      setMicOn(false);
      dispatch(setRoomMembersMicState([sender, status]));
    };
    if (!transport) {
      sfuSocket.emit(
        "createRtcTransport",
        { username: name, joiner: name },
        (params) => {
          if (params.error) {
            console.error(params.error.message);
            return;
          }
          const { transportOptions } = params;
          const sendTransport = device.createSendTransport(transportOptions);
          setTransport(sendTransport);
          sendTransport.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                sfuSocket.emit(
                  "transport-connect",
                  {
                    dtlsParameters,
                    username: name,
                    transportOwner: name,
                  },
                  ({ error }) => {
                    if (error) throw new Error(error.message);
                  }
                );
                callback();
              } catch (error) {
                console.error(error);
                errback(error);
              }
            }
          );
          sendTransport.on("produce", async (parameters, callback, errback) => {
            try {
              sfuSocket.emit(
                "transport-produce",
                {
                  transportId: sendTransport.id,
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                  username: name,
                },
                (params) => {
                  if (params.error) throw new Error(error.message);
                  callback(params.id);
                }
              );
            } catch (error) {
              console.error(error);
              errback(error);
            }
          });
          // sendTransport.on("connectionstatechange", (state) => {
          //   console.log("state of send transport: ", state);
          // });
        }
      );
    }
    socket.on("mic-on-off-event", handleMicOnOffEvent);
    return () => {
      setTransport(null);
      setProducer(null);
      transportRef.current?.close();
      producerRef.current?.close();
      audioTrackRef.current?.stop();
      socket.off("mic-on-off-event", handleMicOnOffEvent);
    };
  }, [socket, sfuSocket]);

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  useEffect(() => {
    audioTrackRef.current = audioTrack;
    producerRef.current = producer;
  }, [audioTrack, producer]);

  const handleMic = async () => {
    if (!socket || !sfuSocket) return;
    try {
      if (micOn && audioTrack && producer) {
        // User wants to turn off their mic

        audioTrack.stop();
        producer.pause();
        sfuSocket.emit(
          "pause-producer",
          { socketRoomId, username: name },
          (params) => {
            if (params.error) {
              // Handle error here
              console.error(params.error.message);
              return;
            }
          }
        );
        socket.emit("mic-on-off", {
          username: name,
          socketRoomId,
          roomId,
          status: false,
        });
        setMicOn(false);
      } else {
        // User wants to turn on their mic
        // Check if the producer exists, that means this is not the first time user is trying to turn on their mic
        if (producer) {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const track = audioStream.getAudioTracks()[0];
          producer.replaceTrack({ track });
          producer.resume();
          sfuSocket.emit("resume-producer", { username: name }, (params) => {
            if (params.error) {
              // Handle error here
              console.error(params.error.message);
            }
          });
          setAudioTrack(track);
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const track = audioStream.getAudioTracks()[0];

          const producer = await transport.produce({ track });

          producer.on("trackended", () => {
            console.log("Track ended from producer");
          });

          producer.on("transportclose", () => {
            console.log("Producer transport closed");
          });

          producer.on("close", () => {
            console.log("producer closed");
          });

          setProducer(producer);
          setAudioTrack(track);
        }
        socket.emit("mic-on-off", {
          username: name,
          socketRoomId,
          roomId,
          status: true,
        });
        setMicOn(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ListItem className="flex justify-between w-full align-middle">
      <ListItemText
        //   Adding 👑 before admin's name
        primary={isAdmin ? "👑ㅤ" + name : "ㅤ ㅤ" + name}
      />
      <Box className="icon-container">
        <Tooltip title={micOn ? "mute" : "unmute"} placement="top">
          <ListItemIcon
            sx={{
              minWidth: "25px",
              margin: "0 10px",
              cursor: "pointer",
            }}
            onClick={handleMic}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </ListItemIcon>
        </Tooltip>
      </Box>
    </ListItem>
  );
};

export default OwnMember;

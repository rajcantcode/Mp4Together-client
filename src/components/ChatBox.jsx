import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";

// Chatscope imports
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "../stylesheets/chatbox.css";
// import Avatar from "@chatscope/chat-ui-kit-react/src/components/Avatar/Avatar";
import "../assets/react.svg";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  MessageSeparator,
  Avatar,
} from "@chatscope/chat-ui-kit-react";

// Socket.io import
import { getSfuSocket, getSocket } from "../socket/socketUtils.js";
import { sendMessage } from "../socket/socketUtils.js";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import {
  setRoomMembers,
  setRoomAdmins,
  setRoomMembersMicState,
  setRoomMembersMuteState,
} from "../store/roomSlice";
import { setIsAdmin } from "../store/userSlice";

const ChatBox = () => {
  const [msgArray, setMsgArray] = useState([]);

  const room = useSelector((state) => state.roomInfo.socketRoomId);
  const mainRoomId = useSelector((state) => state.roomInfo.roomId);
  const username = useSelector((state) => state.userInfo.username);
  const members = useSelector((state) => state.roomInfo.members);

  const socket = getSocket();
  const sfuSocket = getSfuSocket();
  const dispatch = useDispatch();
  useEffect(() => {
    const handleJoinMsg = ({
      msgObj,
      members,
      admins,
      membersMicState,
      joiner,
    }) => {
      dispatch(setRoomMembers(members));
      dispatch(setRoomAdmins(admins));
      dispatch(setRoomMembersMuteState([joiner, false]));
      dispatch(setRoomMembersMicState(membersMicState));
      admins.forEach((admin) => {
        if (admin === username) {
          dispatch(setIsAdmin(true));
          return;
        }
      });
      setMsgArray((prevMsgs) => [...prevMsgs, msgObj]);
    };

    const handleExitMessage = ({
      msgObj,
      members,
      admins,
      membersMicState,
    }) => {
      dispatch(setRoomMembers(members));
      dispatch(setRoomAdmins(admins));
      dispatch(setRoomMembersMicState(membersMicState));
      admins.forEach((admin) => {
        if (admin === username) {
          dispatch(setIsAdmin(true));
          return;
        }
      });
      setMsgArray((prevMsgs) => [...prevMsgs, msgObj]);
    };

    const handleReceiveMessage = (msgObj) => {
      setMsgArray((prevMsgs) => [...prevMsgs, msgObj]);
    };

    const handleConnectError = (error) => {
      console.error("Connection error:", error);
    };

    const handleConnectionTimeout = (timeout) => {
      console.error("Connection timeout:", timeout);
      // Handle the timeout here
      socket.connect();
    };

    // Receive and display messages
    socket.on("receive-message", handleReceiveMessage);
    socket.on("join-msg", handleJoinMsg);
    socket.on("exit-msg", handleExitMessage);

    socket.on("connect_error", handleConnectError);
    socket.on("connect_timeout", handleConnectionTimeout);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("join-msg", handleJoinMsg);
      socket.off("exit-msg", handleExitMessage);
      socket.off("connect_error", handleConnectError);
      socket.off("connect_timeout", handleConnectionTimeout);
    };
  }, []);

  let prevSender = "";

  const handleSend = (message) => {
    // Construct the msg object that is to be sent to the server
    const msgObj = {
      message,
      direction: "incoming",
      sender: username,
    };
    // socket.emit("message", { room, msgObj });
    sendMessage(room, msgObj, socket);
    setMsgArray((msgArray) => {
      return [
        ...msgArray,
        {
          message,
          direction: "outgoing",
          sender: username,
        },
      ];
    });
  };

  return (
    <Box
      id="chat-box"
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "pink",
      }}
    >
      <div style={{ position: "relative", height: "100%" }}>
        <MainContainer>
          <ChatContainer>
            <ConversationHeader>
              <ConversationHeader.Content userName="Chatbox" />
              <ConversationHeader.Actions></ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>
              {msgArray.map((msgObj, index) => {
                if (msgObj.type === "notification") {
                  return (
                    <MessageSeparator content={msgObj.message} key={index} />
                  );
                } else {
                  const message = (
                    <Message
                      model={{
                        message: msgObj.message,
                        sentTime: "just now",
                        sender: msgObj.sender,
                        direction: msgObj.direction,
                      }}
                      key={index}
                    >
                      <Message.Header
                        sender={
                          prevSender === msgObj.sender ? "" : msgObj.sender
                        }
                        sentTime="just now"
                      />
                    </Message>
                  );
                  prevSender = msgObj.sender;
                  return message;
                }
              })}
            </MessageList>
            <MessageInput
              attachButton={false}
              placeholder="Type message here"
              onSend={(msg) => handleSend(msg)}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </Box>
  );
};

export default ChatBox;

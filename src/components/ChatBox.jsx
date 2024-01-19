import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
// @ts-nocheck
import global from "global";
import * as process from "process";
global.process = process;

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
import { socket } from "../socket/socketUtils";
import { sendMessage } from "../socket/socketUtils";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import { setRoomMembers, setRoomAdmins } from "../store/roomSlice";
import { setIsAdmin } from "../store/userSlice";

const ChatBox = () => {
  const [msgArray, setMsgArray] = useState([]);

  const room = useSelector((state) => state.roomInfo.socketRoomId);
  const mainRoomId = useSelector((state) => state.roomInfo.roomId);
  const username = useSelector((state) => state.userInfo.username);
  const members = useSelector((state) => state.roomInfo.members);

  const dispatch = useDispatch();
  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    // Handle the error here
  });

  socket.on("connect_timeout", (timeout) => {
    console.error("Connection timeout:", timeout);
    // Handle the timeout here
    socket.connect();
  });

  useEffect(() => {
    const init = () => {
      // Receive and display messages
      socket.on("receive-message", (msgObj) => {
        setMsgArray((prevMsgs) => {
          if (isUniqueKey(prevMsgs, msgObj)) {
            return [...prevMsgs, msgObj];
          } else {
            return prevMsgs;
          }
        });
      });

      socket.on("join-msg", ({ msgObj, members, admins }) => {
        setMsgArray((prevMsgs) => {
          if (isUniqueKey(prevMsgs, msgObj)) {
            dispatch(setRoomMembers(members));
            dispatch(setRoomAdmins(admins));
            admins.forEach((admin) => {
              if (admin === username) {
                dispatch(setIsAdmin(true));
                return;
              }
            });
            return [...prevMsgs, msgObj];
          } else {
            return prevMsgs;
          }
        });
      });

      socket.on("exit-msg", ({ msgObj, members, admins }) => {
        setMsgArray((prevMsgs) => {
          if (isUniqueKey(prevMsgs, msgObj)) {
            dispatch(setRoomMembers(members));
            dispatch(setRoomAdmins(admins));
            admins.forEach((admin) => {
              if (admin === username) {
                dispatch(setIsAdmin(true));
                return;
              }
            });
            return [...prevMsgs, msgObj];
          } else {
            return prevMsgs;
          }
        });
      });
    };

    init();
  }, []);

  let prevSender = "";

  // Function to check if the message we are trying to insert in the array, already exists.
  // I know this is weird but React in strictmode for some weird reason calls the setMsgArr function twice, which leads to duplicate messages. 😭
  const isUniqueKey = (msgArr, msgObj) => {
    return !msgArr.some((msg) => msg.key === msgObj.key);
  };

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

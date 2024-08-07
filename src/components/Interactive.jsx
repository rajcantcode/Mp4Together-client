// This file will contain the video element, chat element and voice chat components
import { useSelector } from "react-redux";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/Resizable";
import ForumIcon from "@mui/icons-material/Forum";
import PeopleIcon from "@mui/icons-material/People";
import VideoPlayer from "./VideoPlayer";
import ChatBox from "./ChatBox";
import MemberList from "./MemberList";
import { useState, useEffect } from "react";
import "../stylesheets/videoPlayer.css";

const Interactive = ({ socket, sfuSocket }) => {
  const { videoUrlValidity } = useSelector((state) => state.videoUrl);
  const [showChat, setShowChat] = useState(true);
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <ResizablePanelGroup
      direction={innerWidth <= 768 ? "vertical" : "horizontal"}
      className="w-full"
      style={{
        minHeight:
          innerWidth <= 768 ? "calc(100vh - 96px)" : "calc(100vh - 164px)",
        maxHeight: "100vh",
      }}
    >
      <ResizablePanel
        defaultSize={innerWidth <= 768 ? 40 : 70}
        minSize={innerWidth <= 768 ? 30 : 50}
        id="video-panel"
        className="bg-black"
      >
        {/* {videoUrlValidity && <VideoPlayer socket={socket} />} */}
        <VideoPlayer socket={socket} />
      </ResizablePanel>
      <ResizableHandle
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
        }}
        className="!h-[8px] sm:!h-auto w-auto sm:w-[8px] handler"
        withHandle={true}
      />
      <ResizablePanel
        defaultSize={innerWidth <= 768 ? 60 : 30}
        minSize={innerWidth <= 768 ? 40 : 30}
      >
        {innerWidth <= 768 ? (
          <ResizablePanelGroup direction={"horizontal"}>
            <ResizablePanel defaultSize={100} minSize={100}>
              <button
                className="w-fit mr-[15px] pt-[8px] pb-[8px]"
                onClick={() => {
                  setShowChat(true);
                }}
              >
                <ForumIcon
                  sx={{ color: showChat ? "#F9F871" : "rgba(0, 0, 0, 0.26)" }}
                  fontSize="large"
                />
              </button>
              <button
                className="w-fit pt-[8px] pb-[8px]"
                onClick={() => {
                  setShowChat(false);
                }}
              >
                <PeopleIcon
                  sx={{ color: showChat ? "rgba(0, 0, 0, 0.26)" : "#F9F871" }}
                  fontSize="large"
                />
              </button>
              {/* Not a very reactive way of rendering components, but on each toggle if conditional rendering is used then the component would unmount/mount and the chatbox component stores the messages in local state variable and also the MemberList component makes connections to the sfu server, which on each mount and unmount would reconnect.Hence this approach 🙂*/}
              <div
                className="w-full h-full"
                style={{ display: showChat ? "block" : "none" }}
              >
                <ChatBox socket={socket} innerWidth={innerWidth} />
              </div>
              <div
                className="w-full h-full"
                style={{ display: showChat ? "none" : "block" }}
              >
                <MemberList
                  socket={socket}
                  sfuSocket={sfuSocket}
                  innerWidth={innerWidth}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ResizablePanelGroup direction={"vertical"}>
            <ResizablePanel defaultSize={50} minSize={30}>
              <ChatBox socket={socket} innerWidth={innerWidth} />
            </ResizablePanel>
            <ResizableHandle
              style={{
                height: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
              }}
              withHandle={true}
            />
            <ResizablePanel defaultSize={50} minSize={30}>
              <MemberList
                socket={socket}
                sfuSocket={sfuSocket}
                innerWidth={innerWidth}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Interactive;

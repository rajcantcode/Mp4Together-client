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
import { useState } from "react";
import "../stylesheets/videoPlayer.css";

const Interactive = () => {
  const { videoUrlValidity } = useSelector((state) => state.videoUrl);
  const [showChat, setShowChat] = useState(true);
  const innerWidth = window.innerWidth;

  return (
    <ResizablePanelGroup
      direction={innerWidth <= 768 ? "vertical" : "horizontal"}
      className="w-full h-full"
    >
      <ResizablePanel
        defaultSize={innerWidth <= 768 ? 40 : 70}
        // minSize={50}
        minSize={innerWidth <= 768 ? 30 : 50}
        id="video-panel"
        className="bg-orange-500"
      >
        {videoUrlValidity && <VideoPlayer />}
      </ResizablePanel>
      <ResizableHandle />
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
                  color={showChat ? "info" : "disabled"}
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
                  color={showChat ? "disabled" : "info"}
                  fontSize="large"
                />
              </button>
              {/* Not a very reactive way of rendering components, but on each toggle if conditional rendering is used then the component would unmount/mount and the chatbox component stores the messages in local state variable and also the MemberList component makes connections to the sfu server, which on each mount and unmount would reconnect.Hence this approach 🙂*/}
              <div
                className="w-full h-full"
                style={{ display: showChat ? "block" : "none" }}
              >
                <ChatBox />
              </div>
              <div
                className="w-full h-full"
                style={{ display: showChat ? "none" : "block" }}
              >
                <MemberList />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ResizablePanelGroup direction={"vertical"}>
            <ResizablePanel defaultSize={50} minSize={30}>
              <ChatBox />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <MemberList />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
export default Interactive;

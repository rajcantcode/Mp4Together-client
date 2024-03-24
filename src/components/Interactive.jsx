// This file will contain the video element, chat element and voice chat components
import { useSelector } from "react-redux";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./Resizable";
import VideoPlayer from "./VideoPlayer";
import ChatBox from "./ChatBox";
import MemberList from "./MemberList";
import "../stylesheets/videoPlayer.css";

const Interactive = () => {
  const { videoUrlValidity } = useSelector((state) => state.videoUrl);
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
        <ResizablePanelGroup
          direction={innerWidth <= 768 ? "horizontal" : "vertical"}
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <ChatBox />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <MemberList />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
export default Interactive;

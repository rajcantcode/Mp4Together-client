import { Button, ClickAwayListener, Divider, List } from "@mui/material";
import "../stylesheets/spinner.css";
import GroupIcon from "@mui/icons-material/Group";
import CloseIcon from "@mui/icons-material/Close";
import OwnMember from "./OwnMember";
import Member from "./Member";
import { getSfuSocket, getSocket } from "../socket/socketUtils";
import { Device } from "mediasoup-client";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

const MemberList = () => {
  const socket = getSocket();
  const sfuSocket = getSfuSocket();
  // const [isOpen, setIsOpen] = useState(false);
  const [device, setDevice] = useState(new Device());
  const {
    members,
    admins,
    membersMicState,
    socketRoomId,
    roomId,
    membersMuteState,
  } = useSelector((state) => state.roomInfo);
  const { isAdmin, username } = useSelector((state) => state.userInfo);
  const [sortedMembers, setSortedMembers] = useState(() => {
    const sortedMembers = [];
    admins.forEach((admin) => sortedMembers.push(admin));
    if (!isAdmin) sortedMembers.push(username);
    members.forEach((member) => {
      if (!admins.includes(member) && member !== username) {
        sortedMembers.push(member);
      }
    });
    return sortedMembers;
  });

  const innerWidth = window.innerWidth;

  useEffect(() => {
    const handleUserJoin = ({ members, admins, membersMicState, joiner }) => {
      setSortedMembers((prevMembers) => [...prevMembers, joiner]);
    };
    const handleUserExit = ({ members, admins, membersMicState, leaver }) => {
      setSortedMembers((prevMembers) => {
        const newSortedMembers = [...prevMembers];
        return newSortedMembers.filter((member) => member !== leaver);
      });
    };
    try {
      console.dir(sfuSocket);
      sfuSocket.emit("getRtpCapabilities", { socketRoomId }, async (params) => {
        if (params.error) {
          throw params.error;
        }
        const { rtpCapabilities } = params;
        if (!device.loaded) {
          await device.load({ routerRtpCapabilities: rtpCapabilities });
          setDevice(device);
        }
      });
      socket.on("join-msg", handleUserJoin);
      socket.on("exit-msg", handleUserExit);
    } catch (error) {
      console.error(error.message);
    }

    return () => {
      socket.off("join-msg", handleUserJoin);
      socket.off("exit-msg", handleUserExit);
    };
  }, []);

  useEffect(() => {
    setSortedMembers((prevMembers) => {
      const newMembers = [];
      admins.forEach((admin) => {
        newMembers.push(admin);
      });
      if (!isAdmin) newMembers.push(username);
      prevMembers.forEach((member) => {
        if (!admins.includes(member) && member !== username) {
          newMembers.push(member);
        }
      });
      return newMembers;
    });
  }, [admins]);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  return (
    <>
      <List
        sx={{
          width: "100%",
          height: innerWidth <= 768 ? "calc(100% - 55px)" : "100%",
          overflowX: "hidden",
          overflowY: "auto",
          position: "relative",
        }}
        subheader={<ListHeader />}
        className="fixed right-0 z-20 w-[50vw] bg-white-500 border"
      >
        <Divider />
        {device.loaded ? (
          sortedMembers.map((member, index) => {
            if (member === username) {
              return <OwnMember name={member} device={device} key={index} />;
            } else {
              return <Member name={member} device={device} key={index} />;
            }
          })
        ) : (
          <div className="lds-roller">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}
      </List>
    </>
  );
};
const ListHeader = () => {
  const innerWidth = window.innerWidth;
  if (innerWidth <= 768) {
    return <></>;
  }
  return (
    <div
      className="flex justify-between font-bold align-middle"
      style={{ padding: "10px 14.4px" }}
    >
      <h3>Participants</h3>
    </div>
  );
};
export default MemberList;

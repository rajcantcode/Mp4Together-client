import { Button, ClickAwayListener, Divider, List } from "@mui/material";
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
      sfuSocket.emit("getRtpCapabilities", { socketRoomId }, async (params) => {
        if (params.error) {
          throw params.error;
        }
        const { rtpCapabilities } = params;
        if (!device.loaded) {
          await device.load({ routerRtpCapabilities: rtpCapabilities });
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
      {device.loaded && (
        <List
          sx={{ width: "100%", height: "100%" }}
          subheader={<ListHeader />}
          className="fixed right-0 z-20 w-[50vw] bg-gray-500"
        >
          <Divider />
          {sortedMembers.map((member, index) => {
            if (member === username) {
              return <OwnMember name={member} device={device} key={index} />;
            } else {
              return <Member name={member} device={device} key={index} />;
            }
          })}
        </List>
      )}
    </>
  );
};
const ListHeader = () => {
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

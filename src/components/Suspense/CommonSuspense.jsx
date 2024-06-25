import { Link } from "react-router-dom";
import Skeleton from "../ui/Skeleton";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import GitHubIcon from "@mui/icons-material/GitHub";
import "../../stylesheets/suspense.css";

const CommonSuspense = () => {
  return (
    <div
      className="w-full min-h-[100vh] max-h-[auto]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(131,114,255,0.779171043417367) 100%, rgba(131,114,255,0.78) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="header w-full h-[64px] bg-[#1976d2] text-white sm:px-[16px] px-[4px] flex items-center">
        <PlayCircleFilledIcon
          fontSize="large"
          sx={{
            display: "flex",
            mr: 1,
            fontSize: { xs: "2rem", md: "2.2rem" },
          }}
        />
        <Link
          to="/"
          className="mr-[10px] sm:text-[1.5rem] text-[1.2rem] sm:tracking-[.15rem] tracking-[.19rem]"
        >
          Mp4Together
        </Link>
        <Link
          to="https://github.com/rajcantcode/Mp4Together-client"
          className="mr-[10px]"
          target="_blank"
        >
          <GitHubIcon
            fontSize="large"
            sx={{ fontSize: { xs: "2rem", md: "2.2rem" } }}
          />
        </Link>
      </div>
      <div className="skeleton-container h-[calc(100vh-64px)] w-full relative">
        <Skeleton className="w-full h-full bg-gray-300 opacity-85" />
        <div className="text-center absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] text-[4rem] text-white flex items-center">
          Loading
          <div className="lds-ellipsis ml-[10px]">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonSuspense;

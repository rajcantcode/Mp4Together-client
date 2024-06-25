import { Link } from "react-router-dom";
import Skeleton from "../ui/Skeleton";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import GitHubIcon from "@mui/icons-material/GitHub";

const MainSuspense = () => {
  return (
    <div
      className="w-full sm:px-[24px] px-[4px] min-h-[100vh] max-h-[auto]"
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
      <Skeleton className="w-full h-[100px] bg-gray-300 mb-2 opacity-85" />
      <div className="interactive-container w-full h-[calc(100vh-64px-100px)] flex sm:flex-row flex-col">
        <Skeleton className="sm:w-[70%] w-full sm:h-full h-[50%] bg-gray-300 opacity-85 sm:mr-2 mb-2" />
        <div className="flex flex-col sm:w-[30%] w-full sm:h-full h-[50%]">
          <Skeleton className="w-full sm:h-[50%] bg-gray-300 sm:mb-2 opacity-85 h-full" />
          <Skeleton className="w-full h-[50%] bg-gray-300 opacity-85 hidden sm:block" />
        </div>
      </div>
    </div>
  );
};

export default MainSuspense;

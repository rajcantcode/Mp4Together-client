import React from "react";
import Header from "../components/Header";

const NotFound = () => {
  return (
    <>
      <Header renderProfile={true} fetchUserDetails={true} />
      <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-center text-white w-screen">
        <h1 className="sm:text-[4rem] text-[2rem]">404 - Page Not Found</h1>
        <p className="sm:text-[2rem] text-[1.5rem]">
          The page you are looking for does not exist
        </p>
      </div>
    </>
  );
};

export default NotFound;

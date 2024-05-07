import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authenticateUser } from "../../services/helpers";
import "./welcome.css";
import "../stylesheets/spinner.css";
import Header from "../components/Header";

const Welcome = () => {
  const [isLoading, setIsLoading] = useState(true); // State to track loading status
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const response = await authenticateUser(dispatch);
        if (response.status === 200) navigate("/room");
        else if (response.status === 403) navigate("/login");
      } catch (error) {
        // Handle server error here
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative w-screen h-screen welcome-container">
      <Header />
      {isLoading ? ( // Render the modal if isLoading is true
        <div className="absolute translate-y-[-50%] translate-x-[-50%] modal top-1/2 left-1/2 flex justify-between items-center">
          <p className="text-2xl">Authenticating user, please wait...</p>
          <div className="lds-roller-2">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      ) : (
        <>
          <div className="container">
            <h1 className="welcome-text">Welcome to Mp4Together</h1>
            <div className="buttons-container">
              <Link to="/register" className="btn register-btn">
                Register
              </Link>
              <Link to="/login" className="btn login-btn">
                Login
              </Link>
              {/* <Link to="/guest" className="btn guest-btn">
                Login as Guest
              </Link> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Welcome;

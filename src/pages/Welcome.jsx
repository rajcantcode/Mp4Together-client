import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authenticateUser } from "../../services/helpers";
import "./welcome.css";

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
    <div className="welcome-container">
      {isLoading ? ( // Render the modal if isLoading is true
        <div className="modal">
          <div className="spinner"></div>
          <p>Authenticating user, please wait...</p>
        </div>
      ) : (
        <>
          <div className="container">
            <h1 className="welcome-text">Welcome 2 Watch2Gether</h1>
            <div className="buttons-container">
              <Link to="/register" className="btn register-btn">
                Register
              </Link>
              <Link to="/login" className="btn login-btn">
                Login
              </Link>
              <Link to="/guest" className="btn guest-btn">
                Login as Guest
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Welcome;

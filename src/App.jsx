import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Room from "./pages/Room";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />}></Route>
        <Route path="/register" element={<SignUp />}></Route>
        <Route path="/login" element={<SignIn />}></Route>
        <Route path="/room" element={<Room />}></Route>
        <Route path="/room/:roomId" element={<Home />}></Route>
      </Routes>
    </Router>
  );
}

export default App;

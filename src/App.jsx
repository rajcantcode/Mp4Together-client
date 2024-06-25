import { lazy, Suspense, useEffect } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainSuspense from "./components/Suspense/MainSuspense";
import CommonSuspense from "./components/Suspense/CommonSuspense";

// Lazy load Room and Main components
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Room = lazy(() => import("./pages/Room"));
const Main = lazy(() => import("./pages/Main"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  useEffect(() => {
    import("./pages/SignUp");
    import("./pages/SignIn");
    import("./pages/NotFound");
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<CommonSuspense />}>
              <Welcome />
            </Suspense>
          }
        ></Route>
        <Route
          path="/register"
          element={
            <Suspense fallback={<CommonSuspense />}>
              <SignUp />
            </Suspense>
          }
        ></Route>
        <Route
          path="/login"
          element={
            <Suspense fallback={<CommonSuspense />}>
              <SignIn />
            </Suspense>
          }
        ></Route>
        <Route
          path="/room"
          element={
            <Suspense fallback={<CommonSuspense />}>
              <Room />
            </Suspense>
          }
        ></Route>
        <Route
          path="/room/:roomId"
          element={
            <Suspense fallback={<MainSuspense />}>
              <Main />
            </Suspense>
          }
        ></Route>
        <Route
          path="*"
          element={
            <Suspense fallback={<CommonSuspense />}>
              <NotFound />
            </Suspense>
          }
        ></Route>
      </Routes>
    </Router>
  );
}

export default App;

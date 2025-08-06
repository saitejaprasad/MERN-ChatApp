import { Navigate, Route, Routes } from "react-router-dom";
import Navebar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SingUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import { useEffect } from "react";
import { Loader } from "lucide-react";

import useAuthStore from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";

import "./index.css";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log(onlineUsers);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  console.log({ authUser });
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  return (
    <div data-theme={theme}>
      <Navebar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route path="/settings" element={<SettingsPage></SettingsPage>} />
        <Route
          path="/profile"
          element={
            authUser ? <ProfilePage></ProfilePage> : <Navigate to="/login" />
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
};
export default App;

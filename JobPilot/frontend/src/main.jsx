import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./i18n";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailConfirm from "./pages/VerifyEmailConfirm";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import App from "./App.jsx";
import Profile from "./components/Profile/Profile";
import QuickAdd from "./pages/QuickAdd";
import BookmarkletInstall from "./pages/BookmarkletInstall";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import PreviewPage from "./pages/PreviewPage";
import { DEMO_MODE } from "./utils/constants";
import "./index.css";

// Root Component mit Routing
export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            DEMO_MODE ? <Navigate to="/dashboard" replace /> : <LandingPage />
          }
        />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email/confirm" element={<VerifyEmailConfirm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage user={JSON.parse(localStorage.getItem("user") || "null")} />
            </ProtectedRoute>
          }
        />

        {/* Bookmarklet Routes */}
        <Route path="/quick-add" element={<QuickAdd />} />
        <Route path="/bookmarklet" element={<BookmarkletInstall />} />

        {/* Dashboard-Vorschau für die Landing Page (läuft im iframe) */}
        <Route path="/preview" element={<PreviewPage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

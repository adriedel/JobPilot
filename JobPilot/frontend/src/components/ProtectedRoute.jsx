import { Navigate } from "react-router-dom";
import {
  isAuthenticated,
  clearSession,
  SESSION_EXPIRED_PATH,
} from "../services/auth";
import { useSessionWatcher } from "../hooks/useSessionWatcher";

function ProtectedRoute({ children }) {
  useSessionWatcher();

  if (!isAuthenticated()) {
    // Token vorhanden, aber abgelaufen -> aufräumen und mit Hinweis zum Login
    if (localStorage.getItem("token")) {
      clearSession();
      return <Navigate to={SESSION_EXPIRED_PATH} replace />;
    }
    // Nicht eingeloggt -> Redirect zu Login
    return <Navigate to="/login" replace />;
  }

  // Eingeloggt -> Zeige Component
  return children;
}

export default ProtectedRoute;

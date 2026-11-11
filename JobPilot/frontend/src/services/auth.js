import { API_URL, DEMO_MODE } from "../utils/constants";

const DEMO_USER = {
  id: "demo-user",
  email: "demo@jobpilot.local",
  name: "Demo-Zugang",
};

// ==================== SESSION ====================

// Codes, mit denen das Backend (authMiddleware) eine beendete Sitzung meldet
const SESSION_ERROR_CODES = ["TOKEN_MISSING", "TOKEN_INVALID", "TOKEN_EXPIRED"];
// Ältere Backends senden noch keinen Code – dann an der Meldung erkennen
const SESSION_ERROR_MESSAGES = [
  "Token abgelaufen - bitte neu einloggen",
  "Kein Token - Zugriff verweigert",
];

export const SESSION_EXPIRED_PATH = "/login?session=expired";

/** Ablaufzeitpunkt (ms) aus dem JWT lesen, ohne es zu verifizieren. null = unbekannt. */
export function getTokenExpiry(token) {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(padded));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= Date.now();
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/** Sitzung beenden und mit Hinweis zum Login schicken. */
export function endExpiredSession() {
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.replace(SESSION_EXPIRED_PATH);
  }
}

/**
 * fetch für geschützte Endpunkte: meldet der Server eine abgelaufene oder
 * ungültige Sitzung, wird automatisch abgemeldet. Andere 401-Fälle (z. B.
 * falsches aktuelles Passwort) werden normal an den Aufrufer zurückgegeben.
 */
export async function authFetch(url, options) {
  const response = await fetch(url, options);

  if (!DEMO_MODE && response.status === 401) {
    const data = await response
      .clone()
      .json()
      .catch(() => ({}));
    if (
      SESSION_ERROR_CODES.includes(data.code) ||
      SESSION_ERROR_MESSAGES.includes(data.error)
    ) {
      endExpiredSession();
      throw new Error("Sitzung abgelaufen");
    }
  }

  return response;
}

// Register
export async function register(email, password, name) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Registrierung fehlgeschlagen");
  }

  return data; // { message, email }
}

// Login
export async function login(email, password, rememberMe = false) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, rememberMe }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error || "Login fehlgeschlagen");
    if (data.code) err.code = data.code;
    if (data.email) err.email = data.email;
    throw err;
  }

  return data;
}

// Get current user
export async function getCurrentUser() {
  if (DEMO_MODE) {
    return DEMO_USER;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Nicht eingeloggt");
  }

  const response = await authFetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Fehler beim Laden des Users");
  }

  return data.user;
}

// Logout
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = DEMO_MODE ? "/dashboard" : "/";
}

// Check if logged in
export function isAuthenticated() {
  const token = localStorage.getItem("token");
  return DEMO_MODE || (!!token && !isTokenExpired(token));
}

// Get token
export function getToken() {
  if (DEMO_MODE) {
    return localStorage.getItem("token") || "demo-token";
  }

  return localStorage.getItem("token");
}

async function parseJSON(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server nicht erreichbar oder antwortet nicht korrekt");
  }
}

// Update profile name
export async function updateProfile(name) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Speichern");
  return data.user;
}

// Upload profile image
export async function uploadProfileImage(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);
  const response = await authFetch(`${API_URL}/auth/profile/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Upload");
  return data.user;
}

// Change email
export async function changeEmail(email) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/auth/profile/email`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Ändern der E-Mail");
  return data.user;
}

// Change password
export async function changePassword(currentPassword, newPassword) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/auth/profile/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Ändern des Passworts");
  return data;
}

// Update avatar config (null = reset to seed-based auto avatar)
export async function updateAvatarConfig(config) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/auth/profile/avatar-config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar_config: config }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Speichern");
  return data.user;
}

// Delete profile image
export async function deleteProfileImage() {
  const token = getToken();
  const response = await authFetch(`${API_URL}/auth/profile/image`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Löschen");
  return data;
}

// ==================== ADMIN ====================

export async function getAdminUsers() {
  const token = getToken();
  const response = await authFetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Laden der User");
  return data.users;
}

export async function updateUserRole(userId, role) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Ändern der Rolle");
  return data;
}

export async function deleteAdminUser(userId) {
  const token = getToken();
  const response = await authFetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Löschen");
  return data;
}

// Verify email with token from URL
export async function verifyEmail(token) {
  const response = await fetch(
    `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
  );
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Verifizierung fehlgeschlagen");
  return data;
}

// Resend verification email
export async function resendVerification(email) {
  const response = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim erneuten Senden");
  return data;
}

// Request password reset email
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Anfordern");
  return data;
}

// Set new password using reset token
export async function resetPassword(token, password) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await parseJSON(response);
  if (!response.ok) throw new Error(data.error || "Fehler beim Zurücksetzen");
  return data;
}

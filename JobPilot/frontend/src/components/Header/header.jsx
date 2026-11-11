import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./header.css";
import { logout } from "../../services/auth";
import { API_BASE_URL } from "../../utils/constants";
import SunIcon from "../../assets/icons/sun.svg?react";
import MoonIcon from "../../assets/icons/moon.svg?react";
import BriefcaseIcon from "../../assets/icons/briefcase-white.svg?react";
import LogoutIcon from "../../assets/icons/logout.svg?react";
import ExternalIcon from "../../assets/icons/external.svg?react";
import LogoutConfirmModal from "../LogoutConfirmModal/LogoutConfirmModal";
import LanguageToggle from "../LanguageToggle/LanguageToggle";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildAvatarConfigUrl(config) {
  const { backgroundColor, skinColor, accessories, facialHair, ...rest } = config;
  const parts = ["seed=custom"];
  Object.entries(rest).forEach(([key, value]) => {
    parts.push(`${key}=${encodeURIComponent(value)}`);
  });
  if (accessories === "none") {
    parts.push("accessoriesProbability=0");
  } else if (accessories) {
    parts.push(`accessories=${accessories}&accessoriesProbability=100`);
  }
  if (facialHair === "none") {
    parts.push("facialHairProbability=0");
  } else if (facialHair) {
    parts.push(`facialHair=${facialHair}&facialHairProbability=100`);
  }
  if (skinColor) parts.push(`skinColor=${skinColor}`);
  if (backgroundColor) parts.push(`backgroundColor=${backgroundColor}`);
  return `https://api.dicebear.com/7.x/avataaars/svg?${parts.join("&")}`;
}

function getAvatarUrl(user) {
  if (user?.profile_image_url) {
    const url = user.profile_image_url;
    return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  }
  if (user?.avatar_config) {
    const cfg = typeof user.avatar_config === "string"
      ? JSON.parse(user.avatar_config)
      : user.avatar_config;
    return buildAvatarConfigUrl(cfg);
  }
  const seed = encodeURIComponent(user?.name || user?.email || "user");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function UserAvatar({ user, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(user);

  if (imgError) {
    return (
      <span
        className="user-avatar-initials"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {getInitials(user?.name)}
      </span>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={user?.name || "Avatar"}
      className="user-avatar-img"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}

function Header({ darkMode, toggleDarkMode, onNewBewerbung, onExportPdf, user }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (!userMenuRef.current?.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  const goToProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/profile");
  };

  return (
    <>
      <header className="header" ref={headerRef}>
        <div className="header-left">
          <div className="app-icon">
            <BriefcaseIcon className="app-logo" aria-hidden="true" />
          </div>
          <div className="header-text">
            <h1 className="header-title">{t("header.title")}</h1>
            <p className="header-subtitle">{t("header.subtitle")}</p>
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn-bookmarklet"
            onClick={() => navigate("/bookmarklet")}
            title={t("header.bookmarklet")}
          >
            <ExternalIcon className="btn-bookmarklet-icon" aria-hidden="true" />
            <span className="btn-bookmarklet-label">
              {t("header.bookmarklet")}
            </span>
          </button>

          <button
            className="btn-bookmarklet"
            onClick={onExportPdf}
            title={t("header.pdfExport")}
          >
            <svg
              className="btn-bookmarklet-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span className="btn-bookmarklet-label">
              {t("header.pdfExport")}
            </span>
          </button>

          <div className="theme-toggle-group">
            <button
              className={`theme-btn${!darkMode ? " active" : ""}`}
              onClick={() => darkMode && toggleDarkMode()}
              aria-label="Light mode"
              title="Hell"
            >
              <SunIcon
                className="theme-icon"
                aria-hidden="true"
                focusable="false"
              />
            </button>
            <button
              className={`theme-btn${darkMode ? " active" : ""}`}
              onClick={() => !darkMode && toggleDarkMode()}
              aria-label="Dark mode"
              title="Dunkel"
            >
              <MoonIcon
                className="theme-icon"
                aria-hidden="true"
                focusable="false"
              />
            </button>
          </div>

          <LanguageToggle />

          <button className="btn-new-bewerbung" onClick={onNewBewerbung}>
            <span className="btn-plus">+</span> {t("buttons.newApplication")}
          </button>

          {/* User avatar + dropdown */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              className={`user-avatar-btn${isUserMenuOpen ? " open" : ""}`}
              onClick={() => setIsUserMenuOpen((v) => !v)}
              aria-label={t("profile.myProfile")}
              aria-expanded={isUserMenuOpen}
              title={user?.name || user?.email || t("profile.myProfile")}
            >
              <UserAvatar user={user} size={36} />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-header">
                  <UserAvatar user={user} size={40} />
                  <div className="user-dropdown-info">
                    <span className="user-dropdown-name">
                      {user?.name || t("profile.myProfile")}
                    </span>
                    <span className="user-dropdown-email">{user?.email}</span>
                  </div>
                </div>
                <hr className="user-dropdown-divider" />

                {/* Neue Bewerbung — mobile only */}
                <button
                  className="user-dropdown-item user-dropdown-new user-dropdown-item--mobile"
                  onClick={() => { setIsUserMenuOpen(false); onNewBewerbung(); }}
                  role="menuitem"
                >
                  <span className="user-dropdown-new-plus">+</span>
                  {t("buttons.newApplication")}
                </button>
                <hr className="user-dropdown-divider user-dropdown-divider--mobile" />

                <button
                  className="user-dropdown-item"
                  onClick={goToProfile}
                  role="menuitem"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {t("profile.myProfile")}
                </button>

                {/* Bookmarklet — mobile only */}
                <button
                  className="user-dropdown-item user-dropdown-item--mobile"
                  onClick={() => { setIsUserMenuOpen(false); navigate("/bookmarklet"); }}
                  role="menuitem"
                >
                  <ExternalIcon width="16" height="16" aria-hidden="true" />
                  {t("header.bookmarklet")}
                </button>

                {/* PDF Export — mobile only */}
                <button
                  className="user-dropdown-item user-dropdown-item--mobile"
                  onClick={() => { setIsUserMenuOpen(false); onExportPdf(); }}
                  role="menuitem"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  {t("header.pdfExport")}
                </button>

                {user?.role === "admin" && (
                  <button
                    className="user-dropdown-item"
                    onClick={() => { setIsUserMenuOpen(false); navigate("/admin"); }}
                    role="menuitem"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Admin
                  </button>
                )}

                <button
                  className="user-dropdown-item user-dropdown-logout"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <LogoutIcon width="16" height="16" aria-hidden="true" />
                  {t("header.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isLogoutModalOpen && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}
    </>
  );
}

export default Header;

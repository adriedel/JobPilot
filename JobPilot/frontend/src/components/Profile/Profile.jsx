import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  changeEmail,
  changePassword,
  forgotPassword,
  updateAvatarConfig,
} from "../../services/auth";
import { API_BASE_URL } from "../../utils/constants";
import "./Profile.css";

// ── Avatar Customizer Constants ───────────────────────────────────────────────

const AVATAR_PRESETS = [
  {
    key: "shortHair",
    emoji: "✂️",
    config: {
      top: "shortFlat",
      clothing: "blazerAndShirt",
      eyes: "default",
      eyebrows: "default",
      mouth: "smile",
      accessories: "none",
      facialHair: "none",
    },
  },
  {
    key: "longHair",
    emoji: "💇",
    config: {
      top: "bob",
      clothing: "shirtCrewNeck",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "smile",
      accessories: "none",
      facialHair: "none",
    },
  },
  {
    key: "beard",
    emoji: "🧔",
    config: {
      top: "shortFlat",
      clothing: "blazerAndShirt",
      eyes: "default",
      eyebrows: "default",
      mouth: "default",
      accessories: "none",
      facialHair: "beardMedium",
    },
  },
  {
    key: "hat",
    emoji: "🎩",
    config: {
      top: "hat",
      clothing: "hoodie",
      eyes: "happy",
      eyebrows: "raisedExcited",
      mouth: "smile",
      accessories: "none",
      facialHair: "none",
    },
  },
  {
    key: "braids",
    emoji: "🎀",
    config: {
      top: "froBand",
      clothing: "shirtScoopNeck",
      eyes: "default",
      eyebrows: "defaultNatural",
      mouth: "twinkle",
      accessories: "none",
      facialHair: "none",
    },
  },
];

// Exact parameter names + enum values from api.dicebear.com/7.x/avataaars/schema.json
const AVATAR_OPTIONS = {
  top: {
    values: [
      "hat",
      "hijab",
      "turban",
      "winterHat1",
      "winterHat02",
      "winterHat03",
      "winterHat04",
      "bigHair",
      "bob",
      "bun",
      "curly",
      "curvy",
      "dreads",
      "frida",
      "fro",
      "froBand",
      "longButNotTooLong",
      "miaWallace",
      "shavedSides",
      "straight01",
      "straight02",
      "straightAndStrand",
      "dreads01",
      "dreads02",
      "frizzle",
      "shaggy",
      "shaggyMullet",
      "shortCurly",
      "shortFlat",
      "shortRound",
      "shortWaved",
      "sides",
      "theCaesar",
      "theCaesarAndSidePart",
    ],
  },
  accessories: {
    values: [
      "none",
      "kurt",
      "prescription01",
      "prescription02",
      "round",
      "sunglasses",
      "wayfarers",
      "eyepatch",
    ],
  },
  facialHair: {
    values: [
      "none",
      "beardLight",
      "beardMajestic",
      "beardMedium",
      "moustacheFancy",
      "moustacheMagnum",
    ],
  },
  clothing: {
    values: [
      "blazerAndShirt",
      "blazerAndSweater",
      "collarAndSweater",
      "graphicShirt",
      "hoodie",
      "overall",
      "shirtCrewNeck",
      "shirtScoopNeck",
      "shirtVNeck",
    ],
  },
  eyes: {
    values: [
      "closed",
      "cry",
      "default",
      "eyeRoll",
      "happy",
      "hearts",
      "side",
      "squint",
      "surprised",
      "wink",
      "winkWacky",
      "xDizzy",
    ],
  },
  eyebrows: {
    values: [
      "angry",
      "angryNatural",
      "default",
      "defaultNatural",
      "flatNatural",
      "frownNatural",
      "raisedExcited",
      "raisedExcitedNatural",
      "sadConcerned",
      "sadConcernedNatural",
      "unibrowNatural",
      "upDown",
      "upDownNatural",
    ],
  },
  mouth: {
    values: [
      "concerned",
      "default",
      "disbelief",
      "eating",
      "grimace",
      "sad",
      "screamOpen",
      "serious",
      "smile",
      "tongue",
      "twinkle",
      "vomit",
    ],
  },
};

// skinColor uses hex values per schema (not named enum)
const SKIN_COLORS = [
  "614335",
  "ae5d29",
  "d08b5b",
  "edb98a",
  "ffdbb4",
  "fd9841",
  "f8d25c",
];
const BG_COLORS = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
  "d1f9c2",
  "e8e8e8",
  "ffffff",
];

const DEFAULT_AVATAR_CONFIG = {
  top: "shortFlat",
  accessories: "none",
  facialHair: "none",
  clothing: "blazerAndShirt",
  eyes: "default",
  eyebrows: "default",
  mouth: "smile",
  skinColor: "edb98a",
  backgroundColor: "b6e3f4",
};

function buildAvatarConfigUrl(config) {
  const { backgroundColor, skinColor, accessories, facialHair, ...rest } =
    config;
  const parts = ["seed=custom"];

  Object.entries(rest).forEach(([key, value]) => {
    parts.push(`${key}=${encodeURIComponent(value)}`);
  });

  // accessories/facialHair have no "blank" enum → use probability=0 for "none"
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

function formatLabel(s, noneLabel) {
  if (s === "none") return noneLabel;
  const spaced = s
    .replace(/([0-9]+)/g, " $1")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\s+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarUrl(user) {
  if (user?.profile_image_url) {
    const url = user.profile_image_url;
    return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  }
  if (user?.avatar_config) {
    const cfg =
      typeof user.avatar_config === "string"
        ? JSON.parse(user.avatar_config)
        : user.avatar_config;
    return buildAvatarConfigUrl(cfg);
  }
  const seed = encodeURIComponent(user?.name || user?.email || "user");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

// ── Eye Icon ─────────────────────────────────────────────────────────────────

function EyeIcon({ visible }) {
  return visible ? (
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
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
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── PasswordInput ─────────────────────────────────────────────────────────────

function PasswordInput({ value, onChange, placeholder, autoFocus, onKeyDown }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="profile-pw-input-wrap">
      <input
        className="profile-input"
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        autoComplete="new-password"
      />
      <button
        type="button"
        className="profile-pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
        tabIndex={-1}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}

// ── ChangeEmailModal ──────────────────────────────────────────────────────────

function ChangeEmailModal({ currentEmail, onClose, onSuccess, t }) {
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!email.trim()) return t("profile.emailRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return t("profile.emailInvalid");
    if (email.trim().toLowerCase() === currentEmail?.toLowerCase())
      return t("profile.emailSameAsCurrent");
    if (email.trim() !== confirm.trim()) return t("profile.emailMismatch");
    if (!password) return t("profile.currentPasswordRequired");
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updatedUser = await changeEmail(email.trim(), password);
      onSuccess(updatedUser);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
      >
        <div className="profile-modal-header">
          <h2 id="email-modal-title" className="profile-modal-title">
            {t("profile.changeEmail")}
          </h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label={t("profile.cancelEdit")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-modal-current">
            <span className="profile-modal-current-label">
              {t("profile.currentEmail")}
            </span>
            <span className="profile-modal-current-value">{currentEmail}</span>
          </div>

          {error && <div className="profile-modal-error">{error}</div>}

          <div className="profile-field">
            <label className="profile-label">{t("profile.newEmail")}</label>
            <input
              className="profile-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder={t("profile.newEmailPlaceholder")}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">{t("profile.confirmEmail")}</label>
            <input
              className="profile-input"
              type="email"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              placeholder={t("profile.confirmEmailPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">
              {t("profile.currentPassword")}
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder={t("profile.currentPasswordPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <p className="profile-modal-hint">{t("profile.emailChangeHint")}</p>
        </div>

        <div className="profile-modal-footer">
          <button
            className="profile-btn profile-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t("profile.cancelEdit")}
          </button>
          <button
            className="profile-btn profile-btn--primary"
            onClick={handleSubmit}
            disabled={saving || !email.trim() || !confirm.trim() || !password}
          >
            {saving ? t("profile.saving") : t("profile.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChangePasswordModal ───────────────────────────────────────────────────────

function ChangePasswordModal({ onClose, onSuccess, t }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!current) return t("profile.currentPasswordRequired");
    if (!next) return t("profile.newPasswordRequired");
    if (next.length < 8) return t("profile.passwordTooShort");
    if (next !== confirm) return t("profile.passwordMismatch");
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changePassword(current, next);
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pw-modal-title"
      >
        <div className="profile-modal-header">
          <h2 id="pw-modal-title" className="profile-modal-title">
            {t("profile.changePassword")}
          </h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label={t("profile.cancelEdit")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="profile-modal-body">
          {error && (
            <div className="profile-modal-error">
              {error}
              <div style={{ marginTop: "6px", fontSize: "0.82rem" }}>
                <Link
                  to="/forgot-password"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  Passwort vergessen?
                </Link>
              </div>
            </div>
          )}

          <div className="profile-field">
            <label className="profile-label">
              {t("profile.currentPassword")}
            </label>
            <PasswordInput
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                setError("");
              }}
              placeholder={t("profile.currentPasswordPlaceholder")}
              autoFocus
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">{t("profile.newPassword")}</label>
            <PasswordInput
              value={next}
              onChange={(e) => {
                setNext(e.target.value);
                setError("");
              }}
              placeholder={t("profile.newPasswordPlaceholder")}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">
              {t("profile.confirmPassword")}
            </label>
            <PasswordInput
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
              placeholder={t("profile.confirmPasswordPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div className="profile-modal-footer">
          <button
            className="profile-btn profile-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t("profile.cancelEdit")}
          </button>
          <button
            className="profile-btn profile-btn--primary"
            onClick={handleSubmit}
            disabled={saving || !current || !next || !confirm}
          >
            {saving ? t("profile.saving") : t("profile.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AvatarCustomizerModal ─────────────────────────────────────────────────────

function AvatarCustomizerModal({ user, onClose, onSave }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState(() => {
    if (user?.avatar_config) {
      const cfg =
        typeof user.avatar_config === "string"
          ? JSON.parse(user.avatar_config)
          : user.avatar_config;
      return { ...DEFAULT_AVATAR_CONFIG, ...cfg };
    }
    return { ...DEFAULT_AVATAR_CONFIG };
  });
  const [saving, setSaving] = useState(false);

  const previewUrl = buildAvatarConfigUrl(config);

  const handleCycle = (key, dir) => {
    const vals = AVATAR_OPTIONS[key].values;
    const idx = vals.indexOf(config[key]);
    const safeIdx = idx === -1 ? 0 : idx;
    const next = (safeIdx + dir + vals.length) % vals.length;
    setConfig((prev) => ({ ...prev, [key]: vals[next] }));
  };

  const handleSave = async (configToSave) => {
    setSaving(true);
    try {
      await onSave(configToSave);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="profile-modal profile-modal--avatar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <div className="profile-modal-header">
          <h2 id="avatar-modal-title" className="profile-modal-title">
            {t("profile.avatarCustomizeTitle")}
          </h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label={t("profile.cancelEdit")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="profile-modal-body avatar-customizer-body">
          <div className="avatar-presets">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.key}
                className="avatar-preset-btn"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, ...preset.config }))
                }
                title={t(`profile.avatarPreset_${preset.key}`)}
              >
                {preset.emoji} {t(`profile.avatarPreset_${preset.key}`)}
              </button>
            ))}
          </div>

          <div className="avatar-preview">
            <img
              src={previewUrl}
              alt={t("profile.avatarPreview")}
              className="avatar-preview-img"
            />
          </div>

          {Object.entries(AVATAR_OPTIONS).map(([key, opt]) => {
            const vals = opt.values;
            const idx = vals.indexOf(config[key]);
            const safeIdx = idx === -1 ? 0 : idx;
            return (
              <div key={key} className="avatar-option-row">
                <span className="avatar-option-label">
                  {t(`profile.avatarOption_${key}`)}
                </span>
                <div className="avatar-option-controls">
                  <button
                    className="avatar-arrow-btn"
                    onClick={() => handleCycle(key, -1)}
                    aria-label={t("profile.avatarPrevious")}
                  >
                    ‹
                  </button>
                  <span className="avatar-option-value">
                    {formatLabel(vals[safeIdx], t("profile.avatarNone"))}
                  </span>
                  <button
                    className="avatar-arrow-btn"
                    onClick={() => handleCycle(key, 1)}
                    aria-label={t("profile.avatarNext")}
                  >
                    ›
                  </button>
                </div>
              </div>
            );
          })}

          <div className="avatar-option-row">
            <span className="avatar-option-label">
              {t("profile.avatarSkinColor")}
            </span>
            <div className="avatar-bg-swatches">
              {SKIN_COLORS.map((hex) => (
                <button
                  key={hex}
                  className={`avatar-bg-swatch${config.skinColor === hex ? " active" : ""}`}
                  style={{ background: `#${hex}` }}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, skinColor: hex }))
                  }
                  title={`#${hex}`}
                  aria-label={t("profile.avatarSkinColorLabel", { hex })}
                />
              ))}
            </div>
          </div>

          <div className="avatar-option-row">
            <span className="avatar-option-label">
              {t("profile.avatarBackground")}
            </span>
            <div className="avatar-bg-swatches">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  className={`avatar-bg-swatch${config.backgroundColor === color ? " active" : ""}`}
                  style={{
                    background: `#${color}`,
                    border:
                      color === "ffffff" ? "1.5px solid #d1d5db" : undefined,
                  }}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, backgroundColor: color }))
                  }
                  title={`#${color}`}
                  aria-label={t("profile.avatarBgColorLabel", { hex: color })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="profile-modal-footer avatar-customizer-footer">
          <button
            className="profile-btn profile-btn--ghost"
            onClick={() => handleSave(null)}
            disabled={saving}
            title={t("profile.avatarResetTitle")}
          >
            {t("profile.avatarReset")}
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="profile-btn profile-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t("profile.cancelEdit")}
          </button>
          <button
            className="profile-btn profile-btn--primary"
            onClick={() => handleSave(config)}
            disabled={saving}
          >
            {saving ? t("profile.avatarSaving") : t("profile.saveName")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile (main) ────────────────────────────────────────────────────────────

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [nameInput, setNameInput] = useState(user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [resetStatus, setResetStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    getCurrentUser()
      .then((fresh) => {
        setUser(fresh);
        setNameInput(fresh.name || "");
        localStorage.setItem("user", JSON.stringify(fresh));
      })
      .catch(() => {});
  }, []);

  const updateLocalUser = (updated) => {
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const showFeedback = (msg, type = "success") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile(nameInput.trim());
      updateLocalUser(updated);
      setIsEditingName(false);
      showFeedback(t("profile.saveSuccess"));
    } catch (err) {
      showFeedback(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameInput(user?.name || "");
    setIsEditingName(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImgError(false);
    try {
      const updated = await uploadProfileImage(file);
      updateLocalUser(updated);
      showFeedback(t("profile.uploadSuccess"));
    } catch (err) {
      showFeedback(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveAvatarConfig = async (config) => {
    try {
      const updated = await updateAvatarConfig(config);
      updateLocalUser(updated);
      setShowAvatarCustomizer(false);
      showFeedback(
        config
          ? t("profile.avatarSaveSuccess")
          : t("profile.avatarResetSuccess"),
      );
    } catch (err) {
      showFeedback(err.message, "error");
    }
  };

  const handleDeleteImage = async () => {
    setUploading(true);
    setImgError(false);
    try {
      await deleteProfileImage();
      updateLocalUser({ ...user, profile_image_url: null });
      showFeedback(t("profile.deleteSuccess"));
    } catch (err) {
      showFeedback(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button
          className="profile-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t("profile.backToDashboard")}
        </button>

        <div className="profile-card">
          {feedback && (
            <div
              className={`profile-feedback profile-feedback--${feedback.type}`}
            >
              {feedback.msg}
            </div>
          )}

          {/* ── Avatar ── */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {imgError ? (
                <div className="profile-avatar-initials">
                  {getInitials(user?.name)}
                </div>
              ) : (
                <img
                  src={avatarUrl}
                  alt={user?.name || "Avatar"}
                  className="profile-avatar-img"
                  onError={() => setImgError(true)}
                />
              )}
              {uploading && (
                <div className="profile-avatar-overlay">
                  <div className="profile-spinner" />
                </div>
              )}
            </div>

            <div className="profile-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="profile-file-input"
                onChange={handleImageUpload}
                aria-label={t("profile.uploadImage")}
              />
              <button
                className="profile-btn profile-btn--secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploading ? t("profile.uploading") : t("profile.uploadImage")}
              </button>
              {user?.profile_image_url && (
                <button
                  className="profile-btn profile-btn--danger"
                  onClick={handleDeleteImage}
                  disabled={uploading}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  {t("profile.deleteImage")}
                </button>
              )}
              {!user?.profile_image_url && (
                <button
                  className="profile-btn profile-btn--secondary"
                  onClick={() => setShowAvatarCustomizer(true)}
                  disabled={uploading}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                  </svg>
                  {t("profile.customizeAvatar")}
                </button>
              )}
            </div>
            <p className="profile-avatar-hint">
              {user?.profile_image_url
                ? t("profile.customAvatar")
                : user?.avatar_config
                  ? t("profile.customizedAvatar")
                  : t("profile.autoAvatar")}
            </p>
          </div>

          {/* ── Profil-Infos ── */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              {t("profile.sectionProfile")}
            </h3>

            <div className="profile-field">
              <label className="profile-label">{t("profile.name")}</label>
              {isEditingName ? (
                <div className="profile-edit-row">
                  <input
                    className="profile-input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                    maxLength={80}
                  />
                  <button
                    className="profile-btn profile-btn--primary"
                    onClick={handleSaveName}
                    disabled={saving || !nameInput.trim()}
                  >
                    {saving ? t("profile.saving") : t("profile.saveName")}
                  </button>
                  <button
                    className="profile-btn profile-btn--ghost"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    {t("profile.cancelEdit")}
                  </button>
                </div>
              ) : (
                <div className="profile-value-row">
                  <span className="profile-value">{user?.name || "–"}</span>
                  <button
                    className="profile-edit-btn"
                    onClick={() => setIsEditingName(true)}
                    title={t("profile.editName")}
                    aria-label={t("profile.editName")}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="profile-field">
              <label className="profile-label">
                {t("profile.memberSince")}
              </label>
              <span className="profile-value profile-value--muted">
                {formatDate(user?.created_at)}
              </span>
            </div>
          </div>

          {/* ── Konto & Sicherheit ── */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              {t("profile.sectionSecurity")}
            </h3>

            {/* E-Mail */}
            <div className="profile-field">
              <label className="profile-label">{t("profile.email")}</label>
              <div className="profile-value-row">
                <span className="profile-value profile-value--muted">
                  {user?.email || "–"}
                </span>
                <button
                  className="profile-change-btn"
                  onClick={() => setShowEmailModal(true)}
                >
                  {t("profile.change")}
                </button>
              </div>
            </div>

            {/* Passwort */}
            <div className="profile-field">
              <label className="profile-label">{t("profile.password")}</label>
              <div className="profile-value-row">
                <span className="profile-pw-dots">••••••••••••</span>
                <div className="profile-pw-buttons">
                  <button
                    className="profile-change-btn"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    {t("profile.change")}
                  </button>
                  <button
                    className="profile-change-btn"
                    disabled={
                      resetStatus === "sending" || resetStatus === "sent"
                    }
                    onClick={async () => {
                      if (!user?.email) return;
                      setResetStatus("sending");
                      try {
                        await forgotPassword(user.email);
                        setResetStatus("sent");
                        showFeedback(
                          "Reset-Link wurde an deine E-Mail gesendet.",
                        );
                        setTimeout(() => setResetStatus("idle"), 10000);
                      } catch {
                        setResetStatus("error");
                        setTimeout(() => setResetStatus("idle"), 4000);
                      }
                    }}
                    style={{ opacity: resetStatus === "sent" ? 0.6 : 1 }}
                  >
                    {resetStatus === "sending"
                      ? "Wird gesendet…"
                      : resetStatus === "sent"
                        ? "Link gesendet ✓"
                        : "Per E-Mail zurücksetzen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={user?.email}
          onClose={() => setShowEmailModal(false)}
          onSuccess={(updated) => {
            updateLocalUser(updated);
            setShowEmailModal(false);
            showFeedback(t("profile.emailChangeSuccess"));
          }}
          t={t}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            showFeedback(t("profile.passwordChangeSuccess"));
          }}
          t={t}
        />
      )}

      {showAvatarCustomizer && (
        <AvatarCustomizerModal
          user={user}
          onClose={() => setShowAvatarCustomizer(false)}
          onSave={handleSaveAvatarConfig}
          t={t}
        />
      )}
    </div>
  );
}

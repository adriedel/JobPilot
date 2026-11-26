import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./LogoutConfirmModal.css";
import DeleteIcon from "../../assets/icons/danger-broken.svg?react";

function LogoutConfirmModal({ onConfirm, onCancel }) {
  const { t } = useTranslation();

  return createPortal(
    <div className="logout-modal-overlay" onClick={onCancel}>
      <div
        className="logout-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="logout-modal-header">
          <h2>{t("logoutModal.title")}</h2>
        </div>

        <div className="logout-modal-body">
          <div className="logout-warning-icon">
            <DeleteIcon className="logout-icon" aria-hidden="true" />
          </div>

          <p className="logout-modal-message">{t("logoutModal.message")}</p>

          <p className="logout-modal-warning">{t("logoutModal.hint")}</p>
        </div>

        <div className="logout-modal-footer">
          <button
            className="logout-modal-button logout-cancel-button"
            onClick={onCancel}
          >
            {t("logoutModal.cancel")}
          </button>
          <button
            className="logout-modal-button logout-confirm-button"
            onClick={onConfirm}
          >
            {t("logoutModal.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default LogoutConfirmModal;

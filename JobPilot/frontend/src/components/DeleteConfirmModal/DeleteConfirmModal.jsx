import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./DeleteConfirmModal.css";
import DeleteIcon from "../../assets/icons/danger-broken.svg?react";

function DeleteConfirmModal({ bewerbung, onConfirm, onCancel }) {
  const { t } = useTranslation();

  return createPortal(
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div
        className="delete-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <h2>{t("deleteModal.title")}</h2>
        </div>

        <div className="delete-modal-body">
          <div className="delete-warning-icon">
            <DeleteIcon className="delete-icon" aria-hidden="true" />
          </div>
          <p className="delete-modal-message">{t("deleteModal.message")}</p>

          <div className="delete-bewerbung-info">
            <div className="delete-info-item">
              <span className="delete-info-label">
                {t("deleteModal.positionLabel")}:
              </span>
              <span className="delete-info-value">{bewerbung.position}</span>
            </div>
            <div className="delete-info-item">
              <span className="delete-info-label">
                {t("deleteModal.companyLabel")}:
              </span>
              <span className="delete-info-value">{bewerbung.firma}</span>
            </div>
            {bewerbung.standort && (
              <div className="delete-info-item">
                <span className="delete-info-label">
                  {t("deleteModal.locationLabel")}:
                </span>
                <span className="delete-info-value">{bewerbung.standort}</span>
              </div>
            )}
          </div>

          <p className="delete-modal-warning">{t("deleteModal.warning")}</p>
        </div>

        <div className="delete-modal-footer">
          <button
            className="delete-modal-button delete-cancel-button"
            onClick={onCancel}
          >
            {t("deleteModal.cancel")}
          </button>
          <button
            className="delete-modal-button delete-confirm-button"
            onClick={onConfirm}
          >
            {t("deleteModal.delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default DeleteConfirmModal;

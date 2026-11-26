import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./BewerbungsModal.css";
import {
  STATUS,
  STATUS_LABELS,
  BEWERBUNGSARTEN,
  WAEHRUNGEN,
  WAEHRUNG_LABELS,
} from "../../utils/constants";
import BeworbenIcon from "../../assets/icons/paperplane-applied.svg?react";
import StufeWeiterIcon from "../../assets/icons/arrow-step-further.svg?react";
import AngenommenIcon from "../../assets/icons/check-circle-accepted.svg?react";
import AbgelehntIcon from "../../assets/icons/cross-circle-denied.svg?react";
import KeineAntwortIcon from "../../assets/icons/clock-no-answer.svg?react";
import InPlanungIcon from "../../assets/icons/plan.svg?react";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg?react";

function BewerbungsModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  isEditing,
}) {
  const { t } = useTranslation();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBewerbungsartOpen, setIsBewerbungsartOpen] = useState(false);
  const [isWaehrungOpen, setIsWaehrungOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const bewerbungsartDropdownRef = useRef(null);
  const waehrungDropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!statusDropdownRef.current?.contains(event.target)) {
        setIsStatusOpen(false);
      }
      if (!bewerbungsartDropdownRef.current?.contains(event.target)) {
        setIsBewerbungsartOpen(false);
      }
      if (!waehrungDropdownRef.current?.contains(event.target)) {
        setIsWaehrungOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsStatusOpen(false);
        setIsBewerbungsartOpen(false);
        setIsWaehrungOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const resetDropdowns = () => {
    setIsStatusOpen(false);
    setIsBewerbungsartOpen(false);
    setIsWaehrungOpen(false);
  };

  const handleClose = () => {
    resetDropdowns();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    resetDropdowns();
    onSubmit();
  };

  const statusOptions = [
    STATUS.IN_PLANUNG,
    STATUS.BEWORBEN,
    STATUS.STUFE_WEITER,
    STATUS.ANGENOMMEN,
    STATUS.ABGELEHNT,
    STATUS.KEINE_ANTWORT,
  ];

  const STATUS_ICON_COMPONENTS = {
    [STATUS.IN_PLANUNG]: InPlanungIcon,
    [STATUS.BEWORBEN]: BeworbenIcon,
    [STATUS.STUFE_WEITER]: StufeWeiterIcon,
    [STATUS.ANGENOMMEN]: AngenommenIcon,
    [STATUS.ABGELEHNT]: AbgelehntIcon,
    [STATUS.KEINE_ANTWORT]: KeineAntwortIcon,
  };

  if (!isOpen || !formData) return null;

  const selectedStatus = formData.status || STATUS.BEWORBEN;
  const SelectedStatusIcon = STATUS_ICON_COMPONENTS[selectedStatus];

  const handleStatusSelect = (status) => {
    onChange({
      target: {
        name: "status",
        value: status,
      },
    });
    setIsStatusOpen(false);
  };

  const handleBewerbungsartSelect = (bewerbungsart) => {
    onChange({
      target: {
        name: "bewerbungsart",
        value: bewerbungsart,
      },
    });
    setIsBewerbungsartOpen(false);
  };

  const handleWaehrungSelect = (waehrung) => {
    onChange({
      target: {
        name: "waehrung",
        value: waehrung,
      },
    });
    setIsWaehrungOpen(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? t("modal.editApplication") : t("modal.addApplication")}
          </h2>
          <button
            className="modal-close"
            onClick={handleClose}
            aria-label={t("modal.close")}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t("modal.company")} *</label>
              <input
                type="text"
                name="firma"
                placeholder={t("modal.companyPlaceholder")}
                value={formData.firma}
                onChange={onChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("modal.position")} *</label>
              <input
                type="text"
                name="position"
                placeholder={t("modal.positionPlaceholder")}
                value={formData.position}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("modal.date")} *</label>
              <input
                type="date"
                name="datum"
                value={formData.datum}
                onChange={onChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("modal.status")}</label>
              <div className="status-select" ref={statusDropdownRef}>
                <button
                  type="button"
                  className="status-select-trigger"
                  onClick={() => setIsStatusOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                >
                  <span className="status-select-value">
                    {SelectedStatusIcon && (
                      <SelectedStatusIcon
                        className="status-select-icon"
                        aria-hidden="true"
                      />
                    )}
                    <span>{t(`status.${selectedStatus}`)}</span>
                  </span>
                  <ChevronDownIcon
                    className={`status-select-chevron ${isStatusOpen ? "open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isStatusOpen ? (
                  <div
                    className="status-select-menu"
                    role="listbox"
                    aria-label={t("modal.status")}
                  >
                    {statusOptions.map((status) => {
                      const isSelected = selectedStatus === status;
                      const OptionStatusIcon = STATUS_ICON_COMPONENTS[status];

                      return (
                        <button
                          type="button"
                          key={status}
                          className={`status-select-option status-option-${status} ${isSelected ? "selected" : ""}`}
                          onClick={() => handleStatusSelect(status)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="status-select-option-left">
                            {OptionStatusIcon && (
                              <OptionStatusIcon
                                className="status-select-option-icon"
                                aria-hidden="true"
                              />
                            )}
                            <span>{t(`status.${status}`)}</span>
                          </span>
                          {isSelected ? (
                            <span className="status-select-check">✓</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("modal.location")}</label>
              <input
                type="text"
                name="standort"
                placeholder={t("modal.locationPlaceholder")}
                value={formData.standort}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>{t("modal.applicationMethod")}</label>
              <div className="custom-select" ref={bewerbungsartDropdownRef}>
                <button
                  type="button"
                  className="custom-select-trigger"
                  onClick={() => {
                    setIsBewerbungsartOpen((prev) => !prev);
                    setIsWaehrungOpen(false);
                    setIsStatusOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isBewerbungsartOpen}
                >
                  <span className="custom-select-value">
                    {t(
                      `applicationMethod.${(formData.bewerbungsart || BEWERBUNGSARTEN[0]).toLowerCase()}`,
                    )}
                  </span>
                  <ChevronDownIcon
                    className={`custom-select-chevron ${isBewerbungsartOpen ? "open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isBewerbungsartOpen ? (
                  <div
                    className="custom-select-menu"
                    role="listbox"
                    aria-label={t("modal.applicationMethod")}
                  >
                    {BEWERBUNGSARTEN.map((art) => {
                      const isSelected =
                        (formData.bewerbungsart || BEWERBUNGSARTEN[0]) === art;

                      return (
                        <button
                          key={art}
                          type="button"
                          className={`custom-select-option ${isSelected ? "selected" : ""}`}
                          onClick={() => handleBewerbungsartSelect(art)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>
                            {t(`applicationMethod.${art.toLowerCase()}`)}
                          </span>
                          {isSelected ? (
                            <span className="custom-select-check">✓</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("modal.salary")}</label>
              <input
                type="text"
                name="gehalt"
                placeholder={t("modal.salaryPlaceholder")}
                value={formData.gehalt || ""}
                onChange={onChange}
              />
            </div>

            <div className="form-group">
              <label>{t("modal.currency")}</label>
              <div className="custom-select" ref={waehrungDropdownRef}>
                <button
                  type="button"
                  className="custom-select-trigger"
                  onClick={() => {
                    setIsWaehrungOpen((prev) => !prev);
                    setIsBewerbungsartOpen(false);
                    setIsStatusOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isWaehrungOpen}
                >
                  <span className="custom-select-value">
                    {WAEHRUNG_LABELS[formData.waehrung || "EUR"]}
                  </span>
                  <ChevronDownIcon
                    className={`custom-select-chevron ${isWaehrungOpen ? "open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isWaehrungOpen ? (
                  <div
                    className="custom-select-menu"
                    role="listbox"
                    aria-label={t("modal.currency")}
                  >
                    {WAEHRUNGEN.map((waehrung) => {
                      const isSelected =
                        (formData.waehrung || "EUR") === waehrung;

                      return (
                        <button
                          key={waehrung}
                          type="button"
                          className={`custom-select-option ${isSelected ? "selected" : ""}`}
                          onClick={() => handleWaehrungSelect(waehrung)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{WAEHRUNG_LABELS[waehrung]}</span>
                          {isSelected ? (
                            <span className="custom-select-check">✓</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>{t("modal.link")}</label>
            <input
              type="text"
              name="link"
              placeholder="https://..."
              value={formData.link || ""}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label>{t("modal.contact")}</label>
            <input
              type="text"
              name="ansprechpartner"
              placeholder={t("modal.contactPlaceholder")}
              value={formData.ansprechpartner}
              onChange={onChange}
            />
          </div>

          {formData.status !== STATUS.ABGELEHNT && (
            <div className="form-group">
              <label>{t("modal.startDate")}</label>
              <input
                type="date"
                name="startdatum"
                value={formData.startdatum}
                onChange={onChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>{t("modal.notes")}</label>
            <textarea
              name="notizen"
              placeholder={t("modal.notesPlaceholder")}
              value={formData.notizen}
              onChange={onChange}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t("modal.cancel")}
            </button>
            <button type="submit" className="btn-submit">
              {isEditing ? t("modal.save") : t("modal.addApplication")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default BewerbungsModal;

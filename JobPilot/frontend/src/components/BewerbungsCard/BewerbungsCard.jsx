import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./BewerbungsCard.css";
import { STATUS } from "../../utils/constants";
import {
  formatShortDate,
  describeEntry,
  entryTypeLabel,
  noteDay,
} from "../../utils/verlauf";
import DeleteConfirmModal from "../DeleteConfirmModal/DeleteConfirmModal";
import BeworbenIcon from "../../assets/icons/paperplane-applied.svg?react";
import StufeWeiterIcon from "../../assets/icons/arrow-step-further.svg?react";
import AngenommenIcon from "../../assets/icons/check-circle-accepted.svg?react";
import AbgelehntIcon from "../../assets/icons/cross-circle-denied.svg?react";
import KeineAntwortIcon from "../../assets/icons/clock-no-answer.svg?react";
import InPlanungIcon from "../../assets/icons/plan.svg?react";
import PencilIcon from "../../assets/icons/pencil.svg?react";
import TrashIcon from "../../assets/icons/trash.svg?react";
import CalendarIcon from "../../assets/icons/calendar.svg?react";
import MapIcon from "../../assets/icons/map.svg?react";
import PersonIcon from "../../assets/icons/person-2.svg?react";
import ExternalIcon from "../../assets/icons/external.svg?react";
import BuildingIcon from "../../assets/icons/building-1-line.svg?react";
import GehaltIcon from "../../assets/icons/cash-coin.svg?react";
import PinIcon from "../../assets/icons/pin.svg?react";

function isHttpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function BewerbungsCard({
  bewerbung,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenVerlauf,
  onCloseVerlauf,
  isVerlaufOpen = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { t, i18n } = useTranslation();
  const letzterEintrag = bewerbung.letzter_eintrag;
  // Link erst zeigen, wenn es neben der Notiz echte Verlaufseinträge gibt.
  // Die Notiz steht im Panel mit in der Timeline und zählt daher mit.
  const hasVerlauf = (bewerbung.verlauf_anzahl || 0) > 0;
  const verlaufAnzahl =
    (bewerbung.verlauf_anzahl || 0) + (bewerbung.notizen?.trim() ? 1 : 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "de" ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(bewerbung.id, newStatus);
    setShowMenu(false);
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete(bewerbung.id);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatSalary = (salary, currency) => {
    const normalizedSalary = `${salary || ""}`.trim();
    if (!normalizedSalary) {
      return t("card.noSalary");
    }

    const formatSingleAmount = (value) => {
      const compactValue = value.replace(/[\s.]/g, "");
      return /^\d+$/.test(compactValue)
        ? new Intl.NumberFormat("de-DE").format(Number(compactValue))
        : value.trim();
    };

    // Normalize plain ranges like 50000-60000 or 50000 - 60000.
    const rangeParts = normalizedSalary.split(/\s*[-–—]\s*/);
    const formattedSalary =
      rangeParts.length === 2
        ? `${formatSingleAmount(rangeParts[0])} - ${formatSingleAmount(rangeParts[1])}`
        : formatSingleAmount(normalizedSalary);

    const normalizedCurrency = (currency || "EUR").toUpperCase();
    return `${formattedSalary} ${normalizedCurrency}`;
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

  const CurrentStatusIcon = STATUS_ICON_COMPONENTS[bewerbung.status];

  return (
    <article
      className={`bewerbung-card ${isVerlaufOpen ? "bewerbung-card--selected" : ""}`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-position">{bewerbung.position}</h3>
          <div className="card-firma">
            <BuildingIcon className="meta-icon" aria-hidden="true" />
            <span>{bewerbung.firma}</span>
          </div>
        </div>

        <div className="card-menu-container">
          <button
            className="card-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Menü öffnen"
          >
            ⋮
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => { setShowMenu(false); onEdit(bewerbung); }}
              >
                <PencilIcon className="meta-icon" aria-hidden="true" />
                <span>{t("card.edit")}</span>
              </button>
              {onOpenVerlauf && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenVerlauf(bewerbung);
                  }}
                >
                  <CalendarIcon className="meta-icon" aria-hidden="true" />
                  <span>{t("card.addUpdate")}</span>
                </button>
              )}
              <div className="dropdown-divider" />
              {statusOptions.map((status) => {
                const isCurrentStatus = bewerbung.status === status;
                const StatusIcon = STATUS_ICON_COMPONENTS[status];

                return (
                  <button
                    key={status}
                    className={`dropdown-item ${isCurrentStatus ? "dropdown-item-current" : ""}`}
                    onClick={() => handleStatusChange(status)}
                    disabled={isCurrentStatus}
                  >
                    {StatusIcon && (
                      <StatusIcon className="meta-icon" aria-hidden="true" />
                    )}
                    <span>{t(`status.${status}`)}</span>
                  </button>
                );
              })}
              <div className="dropdown-divider" />
              <button
                className="dropdown-item dropdown-item-delete"
                onClick={handleDeleteClick}
              >
                <TrashIcon className="meta-icon" aria-hidden="true" />
                <span>{t("card.delete")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`status-badge status-${bewerbung.status}`}>
        {CurrentStatusIcon && (
          <CurrentStatusIcon className="meta-icon" aria-hidden="true" />
        )}
        <span>{t(`status.${bewerbung.status}`)}</span>
      </div>

      <div className="card-details">
        <div className="detail-item">
          <CalendarIcon className="meta-icon" aria-hidden="true" />
          <span>{formatDate(bewerbung.datum)}</span>
        </div>
        {bewerbung.standort && (
          <div className="detail-item">
            <MapIcon className="meta-icon" aria-hidden="true" />
            <span>{bewerbung.standort}</span>
          </div>
        )}
        <div className="detail-item">
          <GehaltIcon className="meta-icon" aria-hidden="true" />
          <span>{formatSalary(bewerbung.gehalt, bewerbung.waehrung)}</span>
        </div>
        {bewerbung.ansprechpartner && (
          <div className="detail-item">
            <PersonIcon className="meta-icon" aria-hidden="true" />
            <span>{bewerbung.ansprechpartner}</span>
          </div>
        )}
      </div>

      {bewerbung.notizen && (
        <div className="card-notes-wrap">
          {noteDay(bewerbung) && (
            <span className="card-entry-meta card-initial-note-meta">
              <PinIcon className="card-initial-note-icon" aria-hidden="true" />
              {formatShortDate(noteDay(bewerbung), i18n.language)}
              {" · "}
              {t("card.note")}
            </span>
          )}
          <p className="card-notizen">{bewerbung.notizen}</p>
        </div>
      )}

      {letzterEintrag && (
        <div className="card-notes-wrap card-latest-entry">
          <span className="card-entry-meta">
            {formatShortDate(letzterEintrag.datum, i18n.language)}
            {" · "}
            {entryTypeLabel(letzterEintrag, t)}
          </span>
          <p className="card-latest-text">{describeEntry(letzterEintrag, t)}</p>
        </div>
      )}

      <div className="card-actions-row">
        {onOpenVerlauf && hasVerlauf && (
          <button
            type="button"
            className="card-history-link"
            onClick={() =>
              isVerlaufOpen ? onCloseVerlauf?.() : onOpenVerlauf(bewerbung)
            }
            aria-expanded={isVerlaufOpen}
          >
            {t("card.historyCount", { count: verlaufAnzahl })}
          </button>
        )}

        {isHttpUrl(bewerbung.link) && (
          <div className="detail-item detail-item-link card-link-row">
            <ExternalIcon className="meta-icon link-icon" aria-hidden="true" />
            <a
              href={bewerbung.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card-link"
            >
              {t("card.openListing")}
            </a>
          </div>
        )}
      </div>

      {bewerbung.startdatum && bewerbung.status !== STATUS.ABGELEHNT && (
        <div className="card-footer">
          <div className="detail-item">
            <CalendarIcon className="meta-icon" aria-hidden="true" />
            <span>
              {bewerbung.status === STATUS.ANGENOMMEN
                ? t("card.startOn")
                : t("card.possibleStart")}
              {formatDate(bewerbung.startdatum)}
            </span>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          bewerbung={bewerbung}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </article>
  );
}

export default BewerbungsCard;

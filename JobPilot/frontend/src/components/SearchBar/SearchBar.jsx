import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./SearchBar.css";
import { STATUS } from "../../utils/constants";
import BeworbenIcon from "../../assets/icons/paperplane-applied.svg?react";
import StufeWeiterIcon from "../../assets/icons/arrow-step-further.svg?react";
import AngenommenIcon from "../../assets/icons/check-circle-accepted.svg?react";
import AbgelehntIcon from "../../assets/icons/cross-circle-denied.svg?react";
import KeineAntwortIcon from "../../assets/icons/clock-no-answer.svg?react";
import InPlanungIcon from "../../assets/icons/plan.svg?react";
import QuestionmarkIcon from "../../assets/icons/questionmark.svg?react";
import SearchIcon from "../../assets/icons/search.svg?react";
import SlidersIcon from "../../assets/icons/sliders-horizontal.svg?react";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg?react";
import CheckIcon from "../../assets/icons/check.svg?react";

function SearchBar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onToggleSortDirection,
}) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const sortOptions = useMemo(
    () => [
      { value: "datum", label: t("sortBar.date") },
      { value: "firma", label: t("sortBar.company") },
      { value: "status", label: t("sortBar.status") },
    ],
    [t],
  );

  const selectedSortOption =
    sortOptions.find((option) => option.value === sortBy) || sortOptions[0];

  const statusOptions = useMemo(
    () => [
      { value: "alle", label: t("filters.all"), icon: null },
      {
        value: STATUS.IN_PLANUNG,
        label: t("status.in_planung"),
        icon: InPlanungIcon,
      },
      {
        value: STATUS.BEWORBEN,
        label: t("status.beworben"),
        icon: BeworbenIcon,
      },
      {
        value: STATUS.STUFE_WEITER,
        label: t("status.stufe_weiter"),
        icon: StufeWeiterIcon,
      },
      {
        value: STATUS.ANGENOMMEN,
        label: t("status.angenommen"),
        icon: AngenommenIcon,
      },
      {
        value: STATUS.ABGELEHNT,
        label: t("status.abgelehnt"),
        icon: AbgelehntIcon,
      },
      {
        value: STATUS.KEINE_ANTWORT,
        label: t("status.keine_antwort"),
        icon: KeineAntwortIcon,
      },
      {
        value: STATUS.UNKLAR,
        label: t("status.unklar"),
        icon: QuestionmarkIcon,
      },
    ],
    [t],
  );

  const selectedOption =
    statusOptions.find((option) => option.value === filterStatus) ||
    statusOptions[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (!sortDropdownRef.current?.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleOptionSelect = (value) => {
    onFilterChange(value);
    setIsDropdownOpen(false);
  };

  const handleSortOptionSelect = (value) => {
    onSortByChange(value);
    setIsSortDropdownOpen(false);
  };

  return (
    <section className="controls">
      <div className="search-wrapper">
        <span className="search-icon">
          <SearchIcon className="search-icon-svg" aria-hidden="true" />
        </span>
        <input
          type="text"
          className="search-input"
          placeholder={t("searchBar.placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="sort-group">
        <div className="sort-dropdown" ref={sortDropdownRef}>
          <button
            type="button"
            className="sort-dropdown-trigger"
            onClick={() => setIsSortDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isSortDropdownOpen}
            title={t("sortBar.label")}
          >
            <span>
              <svg
                className="filter-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M6 12h12" />
                <path d="M10 18h4" />
              </svg>
            </span>
            <span>{selectedSortOption.label}</span>
            <span className="status-dropdown-chevron" aria-hidden="true">
              <ChevronDownIcon className="chevron-icon" aria-hidden="true" />
            </span>
          </button>

          {isSortDropdownOpen ? (
            <div
              className="status-dropdown-menu"
              role="listbox"
              aria-label={t("sortBar.label")}
            >
              {sortOptions.map((option) => {
                const isSelected = option.value === sortBy;

                return (
                  <button
                    type="button"
                    key={option.value}
                    className={`status-dropdown-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSortOptionSelect(option.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="status-dropdown-option-left">
                      <span>{option.label}</span>
                    </span>
                    {isSelected ? (
                      <span className="status-dropdown-check">
                        <CheckIcon
                          className="status-check-icon"
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="sort-direction-toggle"
          onClick={onToggleSortDirection}
          title={
            sortDirection === "asc"
              ? t("sortBar.ascending")
              : t("sortBar.descending")
          }
          aria-label={t("sortBar.directionToggle")}
        >
          <svg
            className={`sort-direction-icon ${sortDirection === "desc" ? "sort-direction-icon-desc" : ""}`}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="status-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className="status-dropdown-trigger"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        >
          <span>
            <SlidersIcon className="filter-icon" aria-hidden="true" />
          </span>
          <span>{selectedOption.label}</span>
          <span className="status-dropdown-chevron" aria-hidden="true">
            <ChevronDownIcon className="chevron-icon" aria-hidden="true" />
          </span>
        </button>

        {isDropdownOpen ? (
          <div
            className="status-dropdown-menu"
            role="listbox"
            aria-label="Status filtern"
          >
            {statusOptions.map((option) => {
              const isSelected = option.value === filterStatus;
              const OptionIcon = option.icon;

              return (
                <button
                  type="button"
                  key={option.value}
                  className={`status-dropdown-option ${option.value !== "alle" ? `status-option-${option.value}` : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleOptionSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="status-dropdown-option-left">
                    {OptionIcon ? (
                      <OptionIcon
                        className="status-dropdown-option-icon"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span>{option.label}</span>
                  </span>
                  {isSelected ? (
                    <span className="status-dropdown-check">
                      <CheckIcon
                        className="status-check-icon"
                        aria-hidden="true"
                      />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default SearchBar;

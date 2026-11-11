import { useTranslation } from "react-i18next";

/**
 * Umschalter Deutsch/Englisch (Flagge + Sprachkürzel).
 * Styles: .language-toggle / .language-flag / .language-code in header.css.
 */
function LanguageToggle() {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === "de";

  const toggleLanguage = () => {
    i18n.changeLanguage(isGerman ? "en" : "de");
  };

  return (
    <button
      className="language-toggle"
      onClick={toggleLanguage}
      title={isGerman ? "Switch to English" : "Zu Deutsch wechseln"}
      aria-label={isGerman ? "Switch to English" : "Switch to German"}
    >
      <img
        src={
          isGerman
            ? "/flags/flag-for-germany.svg"
            : "/flags/flag-for-united-kingdom.svg"
        }
        alt={isGerman ? "Deutsch" : "English"}
        className="language-flag"
      />
      <span className="language-code">{i18n.language.toUpperCase()}</span>
    </button>
  );
}

export default LanguageToggle;

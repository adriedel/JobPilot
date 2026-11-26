import { useTranslation } from "react-i18next";
import "./StatCards.css";
import BeworbenIcon from "../../assets/icons/paperplane-applied.svg?react";
import StufeWeiterIcon from "../../assets/icons/arrow-step-further.svg?react";
import AngenommenIcon from "../../assets/icons/check-circle-accepted.svg?react";
import AbgelehntIcon from "../../assets/icons/cross-circle-denied.svg?react";
import KeineAntwortIcon from "../../assets/icons/clock-no-answer.svg?react";
import InPlanungIcon from "../../assets/icons/plan.svg?react";
import UnklarIcon from "../../assets/icons/questionmark.svg?react";
import GesamtIcon from "../../assets/icons/trending.svg?react";

function StatCards({ stats }) {
  const { t } = useTranslation();

  return (
    <section className="stats-container">
      <section className="stat-card in_planung">
        <div className="stat-icon">
          <InPlanungIcon />
        </div>
        <div className="stat-number">{stats.in_planung ?? 0}</div>
        <div className="stat-label">{t("status.in_planung")}</div>
      </section>
      <section className="stat-card beworben">
        <div className="stat-icon">
          <BeworbenIcon />
        </div>
        <div className="stat-number">{stats.beworben ?? 0}</div>
        <div className="stat-label">{t("status.beworben")}</div>
      </section>

      <section className="stat-card stufe_weiter">
        <div className="stat-icon">
          <StufeWeiterIcon />
        </div>
        <div className="stat-number">{stats.stufe_weiter ?? 0}</div>
        <div className="stat-label">{t("status.stufe_weiter")}</div>
      </section>

      <section className="stat-card angenommen">
        <div className="stat-icon">
          <AngenommenIcon />
        </div>
        <div className="stat-number">{stats.angenommen ?? 0}</div>
        <div className="stat-label">{t("status.angenommen")}</div>
      </section>

      <section className="stat-card abgelehnt">
        <div className="stat-icon">
          <AbgelehntIcon />
        </div>
        <div className="stat-number">{stats.abgelehnt ?? 0}</div>
        <div className="stat-label">{t("status.abgelehnt")}</div>
      </section>

      <section className="stat-card keine_antwort">
        <div className="stat-icon">
          <KeineAntwortIcon />
        </div>
        <div className="stat-number">{stats.keine_antwort ?? 0}</div>
        <div className="stat-label">{t("status.keine_antwort")}</div>
      </section>

      <section className="stat-card unklar">
        <div className="stat-icon">
          <UnklarIcon />
        </div>
        <div className="stat-number">{stats.unklar ?? 0}</div>
        <div className="stat-label">{t("status.unklar")}</div>
      </section>

      <section className="stat-card gesamt">
        <div className="stat-icon">
          <GesamtIcon />
        </div>
        <div className="stat-number">{stats.gesamt ?? 0}</div>
        <div className="stat-label">{t("statCards.total")}</div>
      </section>
    </section>
  );
}

export default StatCards;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ArrowLeftIcon from "../assets/icons/back.svg?react";
import PinIcon from "../assets/icons/pin.svg?react";
import "./BookmarkletInstall.css";

function buildBookmarkletCode(origin) {
  const base = `${origin}/quick-add`;
  return (
    `(function(){` +
    `var b='${base}',` +
    `l=encodeURIComponent(location.href),` +
    `t=encodeURIComponent(document.title),` +
    `f='',` +
    `og=document.querySelector('meta[property="og:site_name"]');` +
    `if(og)f=og.content;` +
    `if(!f){` +
    `var map={` +
    `'linkedin.com':'.job-details-jobs-unified-top-card__company-name a,.topcard__org-name-link',` +
    `'indeed.com':'[data-testid="inlineHeader-companyName"] a',` +
    `'stepstone.de':'[data-at="job-header-company-name"]',` +
    `'xing.com':'[data-testid="job-detail-company-name"]',` +
    `'arbeitsagentur.de':'.jobdetails-header__company'` +
    `};` +
    `for(var k in map){` +
    `if(location.hostname.includes(k)){` +
    `var el=document.querySelector(map[k]);` +
    `if(el){f=el.textContent.trim();break;}` +
    `}}}` +
    `window.open(b+'?link='+l+'&position='+t+'&firma='+encodeURIComponent(f),` +
    `'JobPilot','width=460,height=700,left=200,top=80,resizable=yes,scrollbars=yes');` +
    `})()`
  );
}

const SUPPORTED_SITES = [
  { name: "LinkedIn", url: "linkedin.com" },
  { name: "Indeed", url: "indeed.com" },
  { name: "Stepstone", url: "stepstone.de" },
  { name: "XING", url: "xing.com" },
  { name: "Arbeitsagentur", url: "arbeitsagentur.de" },
  { name: null, url: null },
];

function BookmarkletInstall() {
  const navigate = useNavigate();
  const linkRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (linkRef.current) {
      const code = buildBookmarkletCode(window.location.origin);
      linkRef.current.setAttribute("href", "javascript:" + code);
    }
  }, []);

  const handleCopy = () => {
    if (!linkRef.current) return;
    const href = linkRef.current.getAttribute("href");
    navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const steps = [
    {
      num: "1",
      title: t("bookmarklet.step1"),
      text: t("bookmarklet.step1Hint"),
    },
    {
      num: "2",
      title: t("bookmarklet.step2"),
      text: t("bookmarklet.step2Hint"),
    },
    {
      num: "3",
      title: t("bookmarklet.step3"),
      text: t("bookmarklet.step3Hint"),
    },
  ];

  return (
    <div className="bm-page">
      <button
        className="bm-back"
        onClick={() => navigate(-1)}
        title={t("bookmarklet.back")}
      >
        <ArrowLeftIcon className="bm-back-icon" aria-hidden="true" />
      </button>

      <div className="bm-content">
        <div className="bm-hero">
          <img src="/Logo-JobPilot.svg" alt="JobPilot" className="bm-logo" />
          <div>
            <h1 className="bm-heading">{t("bookmarklet.title")}</h1>
            <p className="bm-lead">{t("bookmarklet.description")}</p>
          </div>
        </div>

        <div className="bm-drag-section">
          <p className="bm-drag-label">{t("bookmarklet.instructions")}</p>
          <div className="bm-drag-row">
            <a
              ref={linkRef}
              href="#"
              className="bm-bookmarklet-btn"
              draggable="true"
              onClick={(e) => e.preventDefault()}
              title={t("bookmarklet.dragTo")}
            >
              <PinIcon className="bm-bookmarklet-icon" aria-hidden="true" />
              {t("bookmarklet.jobMarkButton")}
            </a>
            <button
              className="bm-copy-btn"
              onClick={handleCopy}
              title={t("bookmarklet.copyCode")}
            >
              {copied ? t("bookmarklet.copied") : t("bookmarklet.copyCode")}
            </button>
          </div>
          <p className="bm-drag-hint">{t("bookmarklet.dragHint")}</p>
        </div>

        <div className="bm-steps">
          <h2 className="bm-section-title">{t("bookmarklet.howTo")}</h2>
          <div className="bm-step-list">
            {steps.map((step) => (
              <div key={step.num} className="bm-step">
                <div className="bm-step-num">{step.num}</div>
                <div className="bm-step-body">
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bm-sites">
          <h2 className="bm-section-title">{t("bookmarklet.autoCompany")}</h2>
          <p className="bm-sites-text">{t("bookmarklet.autoCompanyHint")}</p>
          <div className="bm-site-list">
            {SUPPORTED_SITES.map((site) => (
              <div key={site.name ?? "others"} className="bm-site-chip">
                {site.url ? (
                  <>
                    <span className="bm-site-dot bm-site-dot--auto" />
                    {site.name}
                  </>
                ) : (
                  <>
                    <span className="bm-site-dot bm-site-dot--manual" />
                    {t("bookmarklet.allOthers")} —{" "}
                    {t("bookmarklet.urlCaptured")}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bm-info">
          <strong>{t("bookmarklet.howItWorks")}</strong>
          <p>{t("bookmarklet.howItWorksHint")}</p>
        </div>
      </div>
    </div>
  );
}

export default BookmarkletInstall;

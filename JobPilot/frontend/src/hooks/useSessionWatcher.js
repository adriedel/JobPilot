import { useEffect } from "react";
import { DEMO_MODE } from "../utils/constants";
import { endExpiredSession, getTokenExpiry } from "../services/auth";

// setTimeout kann maximal ~24,8 Tage warten
const MAX_TIMEOUT = 2 ** 31 - 1;

/**
 * Meldet automatisch ab, sobald das Token abläuft – auch wenn die App gerade
 * offen ist. Prüft zusätzlich, wenn der Tab wieder sichtbar wird, weil Browser
 * Timer in Hintergrund-Tabs drosseln.
 */
export function useSessionWatcher() {
  useEffect(() => {
    if (DEMO_MODE) return undefined;

    let timer;
    const check = () => {
      clearTimeout(timer);
      const expiry = getTokenExpiry(localStorage.getItem("token"));
      if (expiry === null) return;

      const remaining = expiry - Date.now();
      if (remaining <= 0) {
        endExpiredSession();
        return;
      }
      timer = setTimeout(check, Math.min(remaining, MAX_TIMEOUT));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", check);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", check);
    };
  }, []);
}

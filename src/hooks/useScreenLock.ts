import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LOCK_DELAY = 3 * 60 * 1000;
const NO_LOCK = ["/login", "/lock", "/register", "/intro", "/auth/callback"];

/** Locks the app after 3 idle minutes; state is shared across tabs via localStorage. */
export function useScreenLock(enabled: boolean) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const path = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  path.current = pathname;

  useEffect(() => {
    if (!enabled) return;

    const lock = () => {
      if (NO_LOCK.includes(path.current)) return;
      localStorage.setItem("screen_locked", "true");
      navigate("/lock");
    };
    const reset = () => {
      clearTimeout(timer.current);
      localStorage.setItem("last_activity", Date.now().toString());
      timer.current = setTimeout(lock, LOCK_DELAY);
    };

    const last = Number(localStorage.getItem("last_activity") || 0);

    if (localStorage.getItem("screen_locked") === "true" && path.current !== "/lock") navigate("/lock");
    else if (last && Date.now() - last > LOCK_DELAY) lock();
    else reset();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== "screen_locked") return;
      if (e.newValue === "true" && !NO_LOCK.includes(path.current)) navigate("/lock");
      else if (e.newValue === "false") reset();
    };
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    events.forEach((ev) => document.addEventListener(ev, reset, true));
    window.addEventListener("storage", onStorage);

    return () => {
      clearTimeout(timer.current);
      events.forEach((ev) => document.removeEventListener(ev, reset, true));
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, navigate]);
}

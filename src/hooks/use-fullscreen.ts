"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

const isFullscreen = () => document.fullscreenElement !== null && document.fullscreenElement !== undefined;
const isSupported = () => Boolean(document.fullscreenEnabled);

/** Browser full-screen state. `supported` is false on browsers without the Fullscreen API (e.g. iPhone Safari). */
export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, isFullscreen, () => false);
  const supported = useSyncExternalStore(subscribe, isSupported, () => false);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // The browser refused (e.g. not triggered by a user action); nothing else to do.
    }
  }, []);

  return { active, supported, toggle };
}

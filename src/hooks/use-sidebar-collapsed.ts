"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "vivrant.sidebar.collapsed";
const CHANGE_EVENT = "vivrant-sidebar-collapsed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

// Collapsed by default; only an explicit "0" (user pinned it open) expands it.
function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) !== "0";
}

function getServerSnapshot() {
  return true;
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((value: boolean | ((current: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(getSnapshot()) : value;
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [collapsed, setCollapsed] as const;
}

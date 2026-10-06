"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** Temporary widget state belongs to this browser tab, independent of account data. */
export function useWidgetSessionState<T>(name: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean, boolean] {
  const key = `insurance-insight:widget:${name}`;
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        setValue(JSON.parse(saved) as T);
        setRestored(true);
      }
    } catch {
      // Invalid or unavailable session storage must not prevent opening a widget.
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* In-memory state still works. */ }
  }, [key, ready, value]);
  return [value, setValue, ready, restored];
}

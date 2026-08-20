"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, ListPlus, Table2 } from "lucide-react";

export type EntryMode = "form" | "sheet" | "paste";

export function useEntryMode(storageKey: string, fallback: EntryMode = "form") {
  const [mode, setMode] = useState<EntryMode>(fallback);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`vivrant-entry-${storageKey}`);
      if (saved === "form" || saved === "sheet" || saved === "paste") {
        setMode(saved);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function change(next: EntryMode) {
    setMode(next);
    try {
      window.localStorage.setItem(`vivrant-entry-${storageKey}`, next);
    } catch {
      /* ignore */
    }
  }

  return [mode, change] as const;
}

const OPTIONS: { value: EntryMode; label: string; hint: string; icon: typeof Table2 }[] = [
  { value: "form", label: "Form", hint: "One item at a time", icon: ListPlus },
  { value: "sheet", label: "Sheet", hint: "Excel-style table", icon: Table2 },
  { value: "paste", label: "Quick list", hint: "Paste names", icon: FileSpreadsheet },
];

export function EntryModeToggle({
  value,
  onChange,
  modes,
  className = "",
}: {
  value: EntryMode;
  onChange: (mode: EntryMode) => void;
  modes?: EntryMode[];
  className?: string;
}) {
  const options = modes?.length
    ? OPTIONS.filter((option) => modes.includes(option.value))
    : OPTIONS;
  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-black transition ${
                active
                  ? "bg-inverse text-inverse-fg shadow-sm"
                  : "border border-ink/10 bg-surface text-ink/80 hover:bg-panel hover:text-ink"
              }`}
            >
              <Icon size={13} />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{current?.hint}.</p>
    </div>
  );
}

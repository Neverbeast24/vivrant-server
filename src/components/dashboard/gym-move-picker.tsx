"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  filterGymMoveCatalog,
  formatGymMoveName,
  humanizeGymLabel,
  type GymMoveCatalogItem,
} from "@/lib/gym";

export function GymMovePicker({
  value,
  onChange,
  options,
  className,
  placeholder = "Search moves…",
  "aria-label": ariaLabel = "Move name",
}: {
  value: string;
  onChange: (name: string) => void;
  options: GymMoveCatalogItem[];
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = useMemo(
    () => filterGymMoveCatalog(open ? query : value, options),
    [open, options, query, value],
  );
  const q = query.trim();
  const exact = matches.some((item) => item.name.toLowerCase() === q.toLowerCase());
  const custom = q.length >= 2 && !exact ? formatGymMoveName(q) || q : "";
  const rows: Array<{ name: string; detail?: string; custom?: boolean }> = [
    ...matches.map((item) => ({
      name: item.name,
      detail: [humanizeGymLabel(item.muscle_group ?? ""), humanizeGymLabel(item.equipment ?? "")]
        .filter(Boolean)
        .join(" · "),
    })),
    ...(custom ? [{ name: custom, detail: "Use this name", custom: true }] : []),
  ];

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function commit(name: string) {
    const next = formatGymMoveName(name) || name.trim();
    onChange(next.slice(0, 80));
    setQuery(next);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const pick = rows[active];
      if (pick) commit(pick.name);
      else if (q) commit(q);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery(value);
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={open ? query : value}
        onChange={(event) => {
          setQuery(event.target.value.slice(0, 80));
          setOpen(true);
        }}
        onFocus={() => {
          setQuery(value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (wrapRef.current?.contains(event.relatedTarget as Node)) return;
          const next = formatGymMoveName(query) || query.trim();
          if (next && next !== value) onChange(next.slice(0, 80));
        }}
        className={twMerge(className, "pl-7 pr-7")}
        placeholder={placeholder}
        maxLength={80}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && rows[active] ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <ChevronDown
        size={12}
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition ${
          open ? "rotate-180" : ""
        }`}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-ink/10 bg-card py-1 shadow-lg"
        >
          {rows.map((row, index) => (
            <li key={`${row.custom ? "custom" : "cat"}-${row.name}`}>
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(row.name)}
                className={`flex w-full flex-col items-start px-2.5 py-1.5 text-left ${
                  index === active ? "bg-accent-soft/70" : "hover:bg-surface"
                }`}
              >
                <span className="truncate text-[11px] font-black">{row.name}</span>
                {row.detail ? <span className="truncate text-[10px] capitalize text-muted">{row.detail}</span> : null}
              </button>
            </li>
          ))}
          {!rows.length && (
            <li className="px-2.5 py-2 text-[11px] font-bold text-muted">
              {options.length ? "No matching moves. Keep typing a custom name." : "Type a move name."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

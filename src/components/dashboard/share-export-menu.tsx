"use client";

import { useEffect, useId, useState } from "react";
import {
  ClipboardCopy,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  canNativeShare,
  copyText,
  downloadFile,
  nativeShare,
  printDocument,
  type ShareExportDoc,
} from "@/lib/share-export";

type MenuKind = "share" | "export" | null;

function runAction(label: string, action: () => void | Promise<void>) {
  void (async () => {
    try {
      await action();
      toast.success(label);
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? null : "Couldn't complete that. Try another option.";
      if (message) toast.error(message);
    }
  })();
}

export function ShareExportMenu({
  doc,
  compact = false,
  disabled = false,
}: {
  doc: ShareExportDoc;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState<MenuKind>(null);
  const shareLabelId = useId();
  const empty = disabled || !doc.text.trim();
  const native = open === "share" && canNativeShare();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const btnClass = compact
    ? "inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 text-[11px] font-black text-ink transition hover:border-accent/30 hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3.5 text-xs font-black text-ink transition hover:border-accent/30 hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

  const optionClass =
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-ink transition hover:bg-accent-soft hover:text-accent";

  function closeAfter(action: () => void | Promise<void>, success: string) {
    setOpen(null);
    runAction(success, action);
  }

  const shareOptions = (
    <>
      {native && (
        <button
          type="button"
          className={optionClass}
          onClick={() => closeAfter(() => nativeShare(doc, "text"), "Opened share sheet")}
        >
          <Share2 size={16} className="shrink-0 text-accent" />
          Share via apps
        </button>
      )}
      <button
        type="button"
        className={optionClass}
        onClick={() => closeAfter(() => copyText(doc.text), "Copied as text")}
      >
        <ClipboardCopy size={16} className="shrink-0 text-accent" />
        Copy as text
      </button>
      <button
        type="button"
        className={optionClass}
        onClick={() => closeAfter(() => copyText(doc.csv), "Copied as CSV")}
      >
        <FileSpreadsheet size={16} className="shrink-0 text-accent" />
        Copy as CSV
      </button>
      {native && (
        <>
          <button
            type="button"
            className={optionClass}
            onClick={() => closeAfter(() => nativeShare(doc, "csv"), "Sharing CSV")}
          >
            <FileSpreadsheet size={16} className="shrink-0 text-accent" />
            Share CSV file
          </button>
          <button
            type="button"
            className={optionClass}
            onClick={() => closeAfter(() => nativeShare(doc, "json"), "Sharing JSON")}
          >
            <FileJson size={16} className="shrink-0 text-accent" />
            Share JSON file
          </button>
        </>
      )}
    </>
  );

  const exportOptions = (
    <>
      <button
        type="button"
        className={optionClass}
        onClick={() =>
          closeAfter(() => downloadFile(`${doc.filename}.txt`, doc.text, "text/plain"), "Downloaded text file")
        }
      >
        <FileText size={16} className="shrink-0 text-accent" />
        Download TXT
      </button>
      <button
        type="button"
        className={optionClass}
        onClick={() =>
          closeAfter(() => downloadFile(`${doc.filename}.csv`, doc.csv, "text/csv"), "Downloaded CSV")
        }
      >
        <FileSpreadsheet size={16} className="shrink-0 text-accent" />
        Download CSV
      </button>
      <button
        type="button"
        className={optionClass}
        onClick={() =>
          closeAfter(
            () => downloadFile(`${doc.filename}.json`, doc.json, "application/json"),
            "Downloaded JSON",
          )
        }
      >
        <FileJson size={16} className="shrink-0 text-accent" />
        Download JSON
      </button>
      <button
        type="button"
        className={optionClass}
        onClick={() => closeAfter(() => printDocument(doc.title, doc.text, doc.html), "Opening print dialog")}
      >
        <Printer size={16} className="shrink-0 text-accent" />
        Print / Save PDF
      </button>
    </>
  );

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={empty}
        aria-haspopup="dialog"
        aria-expanded={open === "share"}
        aria-controls={open === "share" ? shareLabelId : undefined}
        className={btnClass}
        onClick={() => setOpen((current) => (current === "share" ? null : "share"))}
      >
        <Share2 size={14} />
        Share
      </button>
      <button
        type="button"
        disabled={empty}
        aria-haspopup="dialog"
        aria-expanded={open === "export"}
        className={btnClass}
        onClick={() => setOpen((current) => (current === "export" ? null : "export"))}
      >
        <Download size={14} />
        Export
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[70] cursor-default bg-ink/40 sm:bg-transparent"
            onClick={() => setOpen(null)}
          />
          <div
            id={shareLabelId}
            role="dialog"
            aria-label={open === "share" ? "Share options" : "Export options"}
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] overflow-y-auto rounded-t-3xl border border-ink/10 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(var(--shadow-color),.18)] sm:absolute sm:inset-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:rounded-2xl sm:shadow-[0_16px_40px_rgba(var(--shadow-color),.16)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15 sm:hidden" />
            <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-accent">
              {open === "share" ? "Share" : "Export"}
            </p>
            <p className="mb-3 truncate px-1 text-xs font-semibold text-muted">{doc.title}</p>
            <div className="grid gap-0.5">{open === "share" ? shareOptions : exportOptions}</div>
          </div>
        </>
      )}
    </div>
  );
}

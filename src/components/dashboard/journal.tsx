"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteJournalEntry,
  reflectOnJournal,
  saveJournalEntry,
  updateJournalEntry,
} from "@/app/dashboard/journal/actions";
import { PageHeader, PrimaryButton } from "@/components/dashboard/ui";

type Entry = {
  id: number;
  entry_date: string;
  title: string;
  body: string;
  mood: number | null;
  tags: string[] | null;
};

const moods = [
  ["1", "😔"],
  ["2", "🙁"],
  ["3", "😐"],
  ["4", "🙂"],
  ["5", "😄"],
] as const;

function formatNoteDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return today.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function previewText(body: string) {
  return body.replace(/\s+/g, " ").trim();
}

export function JournalView({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | "new" | null>(
    entries[0]?.id ?? null,
  );
  const [mobilePane, setMobilePane] = useState<"list" | "editor">("list");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [mood, setMood] = useState<string>("");
  const [tags, setTags] = useState("");
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [reflectPending, startReflect] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [entries, query]);

  const selected = selectedId === "new" || selectedId == null
    ? null
    : entries.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId === "new") {
      setTitle("");
      setBody("");
      setEntryDate(today);
      setMood("");
      setTags("");
      return;
    }
    if (selected) {
      setTitle(selected.title);
      setBody(selected.body);
      setEntryDate(selected.entry_date);
      setMood(selected.mood != null ? String(selected.mood) : "");
      setTags((selected.tags ?? []).join(", "));
    }
  }, [selectedId, selected, today]);

  useEffect(() => {
    if (selectedId != null && selectedId !== "new") {
      if (!entries.some((e) => e.id === selectedId)) {
        setSelectedId(entries[0]?.id ?? null);
      }
    } else if (selectedId == null && entries[0]) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  function openNew() {
    setSelectedId("new");
    setMobilePane("editor");
  }

  function openNote(id: number) {
    setSelectedId(id);
    setMobilePane("editor");
  }

  function saveNote() {
    startSave(async () => {
      const nextTitle = title.trim() || "Untitled";
      const nextBody = body.trim();
      if (!nextBody) {
        toast.error("Write something before saving.");
        return;
      }

      const fd = new FormData();
      fd.set("title", nextTitle);
      fd.set("body", nextBody);
      fd.set("entry_date", entryDate);
      if (mood) fd.set("mood", mood);
      fd.set("tags", tags);

      let resolved: { ok: boolean; message: string; id?: number };
      if (selectedId === "new" || selectedId == null) {
        resolved = await saveJournalEntry(fd);
      } else {
        fd.set("id", String(selectedId));
        resolved = await updateJournalEntry(fd);
      }

      if (!resolved.ok) {
        toast.error(resolved.message);
        return;
      }
      toast.success(resolved.message);
      if ((selectedId === "new" || selectedId == null) && resolved.id) {
        setSelectedId(resolved.id);
      }
      router.refresh();
    });
  }

  async function removeNote() {
    if (selectedId === "new" || selectedId == null) {
      setSelectedId(entries[0]?.id ?? null);
      setMobilePane("list");
      return;
    }
    const result = await deleteJournalEntry(selectedId);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setSelectedId(null);
    setMobilePane("list");
    router.refresh();
  }

  const showEditor = selectedId != null;

  return (
    <>
      <PageHeader
        eyebrow="JOURNAL"
        title="Notes that"
        highlight="ground you."
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              disabled={reflectPending}
              onClick={() =>
                startReflect(async () => {
                  const result = await reflectOnJournal();
                  if (!result.ok || !("tip" in result) || !result.tip) {
                    toast.error(result.message);
                    return;
                  }
                  setTip(result.tip);
                  toast.success(result.message);
                })
              }
              className="rounded-full"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              {reflectPending ? "Reflecting…" : "AI reflect"}
            </PrimaryButton>
            <PrimaryButton onClick={openNew} className="rounded-full">
              <Plus size={14} className="mr-1.5 inline" />
              New note
            </PrimaryButton>
          </div>
        }
      />

      {tip && (
        <div className="mb-4 rounded-[1.4rem] border border-accent/20 bg-accent-soft/70 px-4 py-3">
          <p className="text-sm font-black text-ink">{tip.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{tip.body}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-[1.6rem] border border-ink/8 bg-card shadow-[0_14px_32px_rgba(var(--shadow-color),.08)]">
        <div className="grid min-h-[min(70vh,40rem)] lg:grid-cols-[minmax(16rem,22rem)_1fr]">
          {/* Notes list — Apple Notes style sidebar */}
          <aside
            className={`flex min-h-0 flex-col border-ink/8 bg-surface/40 lg:border-r ${
              mobilePane === "editor" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="border-b border-ink/6 px-4 py-3">
              <p className="text-[11px] font-black tracking-[0.16em] text-accent">ALL NOTES</p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {filtered.length} note{filtered.length === 1 ? "" : "s"}
              </p>
              <label className="mt-3 flex items-center gap-2 rounded-xl border border-ink/8 bg-card/80 px-3 py-2">
                <Search size={14} className="shrink-0 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.map((entry) => {
                const active = selectedId === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => openNote(entry.id)}
                    className={`block w-full border-b border-ink/5 px-4 py-3.5 text-left transition ${
                      active
                        ? "bg-accent-soft/80"
                        : "hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-black text-ink">
                        {entry.title || "Untitled"}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold text-muted">
                        {formatNoteDate(entry.entry_date)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                      {previewText(entry.body) || "No additional text"}
                    </p>
                    {entry.mood != null && (
                      <p className="mt-1.5 text-[10px] font-bold text-accent">
                        Mood {entry.mood}/5
                      </p>
                    )}
                  </button>
                );
              })}
              {!filtered.length && (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  {query
                    ? "No notes match that search."
                    : "No notes yet. Tap New note to begin."}
                </div>
              )}
            </div>
          </aside>

          {/* Editor pane */}
          <section
            className={`flex min-h-0 flex-col bg-card ${
              mobilePane === "list" ? "hidden lg:flex" : "flex"
            }`}
          >
            {!showEditor ? (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <div>
                  <p className="font-display text-2xl text-ink">Select a note</p>
                  <p className="mt-2 text-sm text-muted">
                    Or create one — like Notes on your phone.
                  </p>
                  <PrimaryButton onClick={openNew} className="mt-5 rounded-full">
                    <Plus size={14} className="mr-1.5 inline" />
                    New note
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-ink/6 px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setMobilePane("list")}
                    className="grid size-9 place-items-center rounded-xl text-accent lg:hidden"
                    aria-label="Back to notes"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="rounded-lg border border-ink/8 bg-surface/60 px-2 py-1.5 text-[11px] font-bold text-muted outline-none focus:border-accent/40"
                    />
                    <div className="flex items-center gap-1">
                      {moods.map(([value, emoji]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMood((m) => (m === value ? "" : value))}
                          className={`grid size-8 place-items-center rounded-lg text-base transition ${
                            mood === value
                              ? "bg-accent-soft ring-1 ring-accent"
                              : "hover:bg-surface"
                          }`}
                          aria-label={`Mood ${value}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={removeNote}
                      className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                    <PrimaryButton
                      disabled={saving}
                      onClick={saveNote}
                      className="rounded-full px-4 py-2"
                    >
                      {saving ? "Saving…" : "Done"}
                    </PrimaryButton>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-8 sm:py-6">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="font-display w-full bg-transparent text-3xl tracking-tight text-ink outline-none placeholder:text-muted/50 sm:text-4xl"
                  />
                  <p className="mt-2 text-[11px] font-bold text-muted">
                    {formatNoteDate(entryDate)}
                    {selectedId === "new" ? " · Draft" : ""}
                  </p>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Start writing…"
                    className="mt-5 min-h-0 w-full flex-1 resize-none bg-transparent text-[15px] leading-7 text-ink outline-none placeholder:text-muted/50"
                  />
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags · gratitude, gym (optional)"
                    className="mt-4 w-full border-t border-ink/6 bg-transparent pt-3 text-xs font-semibold text-muted outline-none placeholder:text-muted/60"
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { BookOpen, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteJournalEntry,
  reflectOnJournal,
  saveJournalEntry,
} from "@/app/dashboard/journal/actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Entry = {
  id: number;
  entry_date: string;
  title: string;
  body: string;
  mood: number | null;
  tags: string[] | null;
};

export function JournalView({ entries }: { entries: Entry[] }) {
  const { pending, submit } = useModuleAction(saveJournalEntry);
  const [reflectPending, startReflect] = useTransition();
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [q, setQ] = useState("");
  const filtered = entries.filter(
    (e) =>
      !q ||
      e.title.toLowerCase().includes(q.toLowerCase()) ||
      e.body.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        eyebrow="JOURNAL"
        title="Notes that"
        highlight="ground you."
        action={
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
            {reflectPending ? "Reflecting…" : "AI weekly reflect"}
          </PrimaryButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="New entry">
          <form action={submit} className="grid gap-3">
            <FormField label="Date">
              <input name="entry_date" type="date" defaultValue={today} className={fieldClass} />
            </FormField>
            <FormField label="Title">
              <input name="title" required placeholder="Today’s note" className={fieldClass} />
            </FormField>
            <FormField label="Body">
              <textarea name="body" required rows={6} className={fieldClass} />
            </FormField>
            <FormField label="Mood (1–5)" hint="optional">
              <input name="mood" type="number" min={1} max={5} className={fieldClass} />
            </FormField>
            <FormField label="Tags" hint="comma separated">
              <input name="tags" placeholder="gratitude, gym" className={fieldClass} />
            </FormField>
            <PrimaryButton disabled={pending}>
              <BookOpen size={14} className="mr-1.5 inline" />
              {pending ? "Saving…" : "Save entry"}
            </PrimaryButton>
          </form>
          {tip && (
            <div className="mt-4 rounded-2xl border border-ink/8 bg-surface/60 p-4">
              <p className="text-sm font-black">{tip.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{tip.body}</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Your notes"
          right={
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className={`${fieldClass} max-w-[10rem] py-2`}
            />
          }
        >
          <Stagger>
            <ul className="space-y-3">
              {filtered.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-ink/8 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-muted">{entry.entry_date}</p>
                      <h3 className="font-display mt-1 text-lg">{entry.title}</h3>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">{entry.body}</p>
                      {entry.mood != null && (
                        <p className="mt-2 text-xs font-bold text-accent">Mood {entry.mood}/5</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted hover:bg-ink/5 hover:text-ink"
                      onClick={async () => {
                        const result = await deleteJournalEntry(entry.id);
                        if (result.ok) toast.success(result.message);
                        else toast.error(result.message);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
              {!filtered.length && <EmptyState>No journal entries yet.</EmptyState>}
            </ul>
          </Stagger>
        </Panel>
      </div>
    </>
  );
}

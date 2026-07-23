"use client";

import { useState, useTransition } from "react";
import { Bell, BrainCircuit, Dumbbell, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  askVivaQuestion,
  generateInsight,
} from "@/app/dashboard/ai/actions";
import {
  createReminder,
  deleteReminder,
  draftAndSaveReminder,
  syncRemindersFromGymPlan,
  toggleReminder,
} from "@/app/dashboard/ai/reminder-actions";
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  Stagger,
  fieldClass,
} from "@/components/dashboard/ui";
import { ModuleSubNav } from "@/components/dashboard/module-subnav";
import { useModuleAction } from "@/components/dashboard/use-module-action";
import { formatScheduleLabel } from "@/lib/reminders/schedule";

type Insight = {
  id: number;
  title: string;
  body: string;
  score: number | null;
  created_at: string;
};

type ChatTurn = {
  role: "user" | "viva";
  text: string;
  followUp?: string;
};

type Reminder = {
  id: number;
  title: string;
  body: string;
  kind: string;
  schedule_time: string;
  days_of_week: number[] | null;
  enabled: boolean;
  next_fire_at: string | null;
  href: string | null;
};

const aiSubNav = [
  { href: "/dashboard/ai", label: "Ask VIVRΛNT" },
  { href: "/dashboard/ai/insights", label: "Insights" },
  { href: "/dashboard/ai/reminders", label: "Reminders" },
] as const;

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

export function AiView({
  insights,
  section = "ask",
  initialTurns = [],
  reminders = [],
}: {
  insights: Insight[];
  section?: "ask" | "insights" | "reminders";
  initialTurns?: ChatTurn[];
  reminders?: Reminder[];
}) {
  const { pending, submit } = useModuleAction(generateInsight);
  const createAction = useModuleAction(createReminder);
  const [chatPending, startChat] = useTransition();
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);

  function ask(formData: FormData) {
    startChat(async () => {
      const question = String(formData.get("question") ?? "").trim();
      if (!question) return;
      setTurns((prev) => [...prev, { role: "user", text: question }]);
      const result = await askVivaQuestion(formData);
      if (!result.ok || !("reply" in result) || !result.reply) {
        toast.error(result.message);
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          role: "viva",
          text: result.reply.answer,
          followUp: result.reply.follow_up,
        },
      ]);
      toast.success(result.message);
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="AI DECISION ENGINE"
        title={
          section === "insights"
            ? "Saved"
            : section === "reminders"
              ? "Scheduled"
              : "Your best"
        }
        highlight={
          section === "insights"
            ? "insights."
            : section === "reminders"
              ? "nudges."
              : "next action."
        }
        action={
          section === "insights" ? (
            <PrimaryButton
              disabled={pending}
              onClick={() => submit(new FormData())}
              className="rounded-full px-5"
            >
              {pending ? "Generating…" : "Generate insight"}
            </PrimaryButton>
          ) : section === "reminders" ? (
            <div className="flex flex-wrap gap-2">
              <PrimaryButton
                className="rounded-full"
                onClick={async () => {
                  const result = await draftAndSaveReminder();
                  if (result.ok) toast.success(result.message);
                  else toast.error(result.message);
                }}
              >
                <Sparkles size={14} className="mr-1.5 inline" />
                AI draft & save
              </PrimaryButton>
              <PrimaryButton
                className="rounded-full"
                onClick={async () => {
                  const result = await syncRemindersFromGymPlan();
                  if (result.ok) toast.success(result.message);
                  else toast.error(result.message);
                }}
              >
                <Dumbbell size={14} className="mr-1.5 inline" />
                Sync gym plan
              </PrimaryButton>
            </div>
          ) : undefined
        }
      />
      <ModuleSubNav items={aiSubNav} />

      {section === "ask" && (
        <Panel title="Ask VIVRΛNT" right={<MessageCircle size={16} className="text-accent" />}>
          <p className="mb-4 text-sm text-muted">
            Ask about your energy, meals, budget, or what to do next — answers use your live logs.
            Chat history is saved.
          </p>
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {turns.map((turn, index) => (
              <div
                key={`${turn.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  turn.role === "user"
                    ? "ml-8 bg-inverse text-inverse-fg"
                    : "mr-8 border border-ink/8 bg-surface/70 text-muted"
                }`}
              >
                <p className="text-[10px] font-black tracking-wider opacity-60">
                  {turn.role === "user" ? "YOU" : "VIVRΛNT"}
                </p>
                <p className="mt-1">{turn.text}</p>
                {turn.followUp && (
                  <p className="mt-2 text-xs font-semibold text-accent">
                    Try asking: {turn.followUp}
                  </p>
                )}
              </div>
            ))}
            {!turns.length && (
              <EmptyState>
                Ask something like “Why is my energy low?” or “What should I buy?”
              </EmptyState>
            )}
          </div>
          <form action={ask} className="flex flex-col gap-3 sm:flex-row">
            <FormField label="Your question" className="flex-1">
              <input
                name="question"
                required
                minLength={3}
                placeholder="e.g. What should I focus on this afternoon?"
                className={fieldClass}
                id="ask-question-input"
              />
            </FormField>
            <PrimaryButton disabled={chatPending} className="sm:self-end">
              {chatPending ? "Thinking…" : "Ask"}
            </PrimaryButton>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "What should I do first today?",
              "Suggest a simple meal",
              "How do I use gym demos?",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-ink/10 bg-surface/70 px-3 py-1.5 text-[11px] font-bold text-muted transition hover:border-accent/30 hover:text-accent"
                onClick={() => {
                  const input = document.getElementById(
                    "ask-question-input",
                  ) as HTMLInputElement | null;
                  if (!input) return;
                  input.value = prompt;
                  input.focus();
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {section === "reminders" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Create reminder" right={<Bell size={16} className="text-accent" />}>
            <form action={createAction.submit} className="grid gap-3">
              <FormField label="Title">
                <input name="title" required placeholder="Gym morning" className={fieldClass} />
              </FormField>
              <FormField label="Message">
                <textarea name="body" required rows={3} className={fieldClass} />
              </FormField>
              <FormField label="Kind">
                <select name="kind" className={fieldClass} defaultValue="custom">
                  {["custom", "gym", "plan", "hydration", "sleep", "habit", "mindfulness"].map(
                    (k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ),
                  )}
                </select>
              </FormField>
              <FormField label="Time">
                <input name="schedule_time" type="time" defaultValue="09:00" className={fieldClass} />
              </FormField>
              <FormField label="Days">
                <div className="flex flex-wrap gap-2 px-1 py-2">
                  {DAY_OPTIONS.map((d) => (
                    <label key={d.value} className="flex items-center gap-1 text-xs font-bold">
                      <input
                        type="checkbox"
                        name="days_of_week"
                        value={d.value}
                        defaultChecked={d.value <= 5}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </FormField>
              <FormField label="Link" hint="optional">
                <input name="href" placeholder="/dashboard/gym" className={fieldClass} />
              </FormField>
              <PrimaryButton disabled={createAction.pending}>
                {createAction.pending ? "Saving…" : "Schedule reminder"}
              </PrimaryButton>
            </form>
          </Panel>

          <Panel title="Your schedule">
            <ul className="space-y-3">
              {reminders.map((r) => (
                <li key={r.id} className="rounded-2xl border border-ink/8 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{r.title}</p>
                      <p className="mt-1 text-sm text-muted">{r.body}</p>
                      <p className="mt-2 text-xs font-bold text-accent">
                        {formatScheduleLabel(
                          String(r.schedule_time).slice(0, 5),
                          r.days_of_week?.length ? r.days_of_week : [1, 2, 3, 4, 5, 6, 7],
                        )}{" "}
                        · {r.kind}
                        {!r.enabled ? " · paused" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-ink/5"
                        onClick={async () => {
                          const result = await toggleReminder(r.id, !r.enabled);
                          if (result.ok) toast.success(result.message);
                          else toast.error(result.message);
                        }}
                      >
                        {r.enabled ? "Pause" : "On"}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-ink/5"
                        onClick={async () => {
                          const result = await deleteReminder(r.id);
                          if (result.ok) toast.success(result.message);
                          else toast.error(result.message);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {!reminders.length && (
                <EmptyState>No reminders yet. Draft with AI or sync your gym plan.</EmptyState>
              )}
            </ul>
          </Panel>
        </div>
      )}

      {section === "insights" && (
        <Stagger>
          <div className="grid gap-4">
            {insights.map((item) => (
              <Panel key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black tracking-[0.16em] text-accent">
                      VIVRΛNT INSIGHT
                    </p>
                    <h2 className="font-display mt-2 text-xl tracking-tight">{item.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <BrainCircuit size={18} />
                  </span>
                </div>
                {item.score != null && (
                  <p className="mt-4 text-xs font-bold text-muted">
                    Helpfulness: {item.score}/100
                  </p>
                )}
              </Panel>
            ))}
{!insights.length && (
            <EmptyState>
              <span className="inline-flex flex-col items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={16} /> No insights yet — generate your first recommendation.
                </span>
                <PrimaryButton
                  disabled={pending}
                  onClick={() => submit(new FormData())}
                  className="rounded-full"
                >
                  {pending ? "Generating…" : "Generate insight"}
                </PrimaryButton>
              </span>
            </EmptyState>
          )}
          </div>
        </Stagger>
      )}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  askVivaQuestion,
  generateInsight,
  generateReminderDraft,
} from "@/app/dashboard/ai/actions";
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

const aiSubNav = [
  { href: "/dashboard/ai", label: "Ask VIVA" },
  { href: "/dashboard/ai/insights", label: "Insights" },
  { href: "/dashboard/ai/reminders", label: "Reminders" },
] as const;

export function AiView({
  insights,
  section = "ask",
}: {
  insights: Insight[];
  section?: "ask" | "insights" | "reminders";
}) {
  const { pending, submit } = useModuleAction(generateInsight);
  const [chatPending, startChat] = useTransition();
  const [reminderPending, startReminder] = useTransition();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [reminder, setReminder] = useState<{ title: string; body: string } | null>(null);

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

  function draftReminder() {
    startReminder(async () => {
      const result = await generateReminderDraft();
      if (!result.ok || !("reminder" in result) || !result.reminder) {
        toast.error(result.message);
        return;
      }
      setReminder(result.reminder);
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
              ? "Gentle"
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
          ) : undefined
        }
      />
      <ModuleSubNav items={aiSubNav} />

      {section === "ask" && (
      <Panel title="Ask VIVA" right={<MessageCircle size={16} className="text-[#5f45e6]" />}>
          <p className="mb-4 text-sm text-[#77727f]">
            Ask about your energy, meals, budget, or what to do next — answers use your live logs only.
          </p>
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {turns.map((turn, index) => (
              <div
                key={`${turn.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  turn.role === "user"
                    ? "ml-8 bg-[#26222f] text-white"
                    : "mr-8 border border-[#26222f]/8 bg-[#f4efe4]/70 text-[#4c4757]"
                }`}
              >
                <p className="text-[10px] font-black tracking-wider opacity-60">
                  {turn.role === "user" ? "YOU" : "VIVA"}
                </p>
                <p className="mt-1">{turn.text}</p>
                {turn.followUp && (
                  <p className="mt-2 text-xs font-semibold text-[#5f45e6]">
                    Try asking: {turn.followUp}
                  </p>
                )}
              </div>
            ))}
            {!turns.length && (
              <EmptyState>Ask something like “Why is my energy low?” or “What should I buy?”</EmptyState>
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
              />
            </FormField>
            <PrimaryButton disabled={chatPending} className="sm:self-end">
              {chatPending ? "Thinking…" : "Ask"}
            </PrimaryButton>
          </form>
        </Panel>
      )}

      {section === "reminders" && (
        <Panel title="Push reminder draft" right={<Sparkles size={16} className="text-[#5f45e6]" />}>
          <p className="text-sm leading-6 text-[#77727f]">
            VIVA can draft a notification from today’s rhythm. Sending requires your Firebase VAPID key.
          </p>
          <PrimaryButton
            disabled={reminderPending}
            onClick={draftReminder}
            className="mt-4 w-full max-w-sm rounded-full"
          >
            {reminderPending ? "Drafting…" : "Draft reminder"}
          </PrimaryButton>
          {reminder && (
            <div className="mt-4 max-w-lg rounded-2xl border border-[#26222f]/8 bg-[#f4efe4]/60 p-4">
              <p className="text-sm font-black">{reminder.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6b79]">{reminder.body}</p>
            </div>
          )}
        </Panel>
      )}

      {section === "insights" && (
      <Stagger>
        <div className="grid gap-4">
          {insights.map((item) => (
            <Panel key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black tracking-[0.16em] text-[#5f45e6]">
                    VIVA INSIGHT
                  </p>
                  <h2 className="font-display mt-2 text-xl tracking-tight">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#6f6b79]">{item.body}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ece7fb] text-[#5f45e6]">
                  <BrainCircuit size={18} />
                </span>
              </div>
              {item.score != null && (
                <p className="mt-4 text-xs font-bold text-[#8a8491]">
                  Decision score: {item.score}/100
                </p>
              )}
            </Panel>
          ))}
          {!insights.length && (
            <EmptyState>
              <span className="inline-flex items-center gap-2">
                <Sparkles size={16} /> No insights yet. Generate your first recommendation.
              </span>
            </EmptyState>
          )}
        </div>
      </Stagger>
      )}
    </>
  );
}

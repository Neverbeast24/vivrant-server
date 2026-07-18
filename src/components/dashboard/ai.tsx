"use client";

import { motion } from "motion/react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { generateInsight } from "@/app/dashboard/ai/actions";
import { PageHeader, Panel, Stagger } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Insight = {
  id: number;
  title: string;
  body: string;
  score: number | null;
  created_at: string;
};

export function AiView({ insights }: { insights: Insight[] }) {
  const { pending, submit } = useModuleAction(generateInsight);

  return (
    <>
      <PageHeader
        eyebrow="AI DECISION ENGINE"
        title="Your best"
        highlight="next action."
        action={
          <motion.button
            whileHover={{ y: -2 }}
            disabled={pending}
            onClick={() => submit(new FormData())}
            className="rounded-full bg-[#24212e] px-5 py-3 text-sm font-bold text-white"
          >
            {pending ? "Generating…" : "Generate insight"}
          </motion.button>
        }
      />

      <Stagger>
        <div className="grid gap-4">
          {insights.map((item) => (
            <Panel key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-[#7557ff]">VIVA INSIGHT</p>
                  <h2 className="mt-2 text-lg font-black">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#6f6b79]">{item.body}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-[#f0edff] text-[#7557ff]">
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
            <Panel>
              <div className="flex items-center gap-3 text-[#8a8491]">
                <Sparkles size={18} />
                <p className="text-sm">No insights yet. Generate your first recommendation.</p>
              </div>
            </Panel>
          )}
        </div>
      </Stagger>
    </>
  );
}

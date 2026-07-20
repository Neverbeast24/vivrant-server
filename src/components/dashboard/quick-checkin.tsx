"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { saveCheckin, type CheckinState } from "@/app/dashboard/actions";

const moods = [
  ["1", "😔"],
  ["2", "🙁"],
  ["3", "😐"],
  ["4", "🙂"],
  ["5", "😄"],
];

export function QuickCheckin() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("4");
  const [state, formAction, pending] = useActionState<CheckinState, FormData>(
    saveCheckin,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      const timer = setTimeout(() => setOpen(false), 900);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#14221b] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0e7c66]"
      >
        <Plus size={16} /> Quick check-in
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[950] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[#191622]/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="glass relative w-full max-w-md rounded-[1.8rem] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl">Daily check-in</h2>
                  <p className="mt-1 text-xs text-[#817c88]">
                    A few seconds to capture how today feels.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="focus-ring grid size-9 place-items-center rounded-full bg-[#f6faf7]/85 text-[#726d79] transition hover:bg-[#f6faf7]"
                >
                  <X size={17} />
                </button>
              </div>

              <form action={formAction} className="space-y-4">
                <div>
                  <span className="mb-2 block text-xs font-bold text-[#615d69]">Mood</span>
                  <input type="hidden" name="mood" value={mood} />
                  <div className="flex justify-between gap-2">
                    {moods.map(([val, emoji]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMood(val)}
                        className={`focus-ring flex-1 rounded-2xl border py-3 text-xl transition ${
                          mood === val
                            ? "border-[#0e7c66]/40 bg-[#f6faf7] shadow-sm"
                            : "border-black/5 bg-[#f6faf7]/65 hover:bg-[#f6faf7]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Energy" name="energy" placeholder="0–100" />
                  <Field label="Steps" name="steps" placeholder="0" />
                  <Field label="Water (ml)" name="water_ml" placeholder="0" />
                  <Field label="Sleep (h)" name="sleep_hours" placeholder="7" />
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-[#615d69]">Note</span>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Anything worth remembering today?"
                    className="w-full resize-none rounded-2xl border border-black/7 bg-[#f6faf7]/85 px-4 py-3 text-sm outline-none transition focus:border-[#0e7c66]/40 focus:ring-4 focus:ring-[#0e7c66]/8"
                  />
                </label>

                {state && (
                  <p
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      state.ok
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                <button
                  disabled={pending}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14221b] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#0e7c66] disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : state?.ok ? (
                    <Check size={16} />
                  ) : null}
                  {state?.ok ? "Saved" : "Save check-in"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#615d69]">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/7 bg-[#f6faf7]/85 px-3 py-2.5 text-sm outline-none transition focus:border-[#0e7c66]/40 focus:ring-4 focus:ring-[#0e7c66]/8"
      />
    </label>
  );
}

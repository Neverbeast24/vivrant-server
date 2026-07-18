"use client";

import { Activity, BadgeInfo, HeartPulse, Ruler, Scale, Target } from "lucide-react";
import {
  saveHealthProfile,
  saveSettings,
} from "@/app/dashboard/settings/actions";
import { GoalsPanel, type HealthGoal } from "@/components/dashboard/goals";
import {
  FormField,
  PageHeader,
  Panel,
  PrimaryButton,
  fieldClass,
} from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Settings = {
  theme: string;
  notifications_enabled: boolean;
  weekly_report_enabled: boolean;
  timezone: string;
};

export type HealthProfile = {
  display_name: string;
  email: string | null;
  birth_date: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: string | null;
  health_focus: string | null;
  daily_step_goal: number;
  daily_water_goal_ml: number;
  monthly_health_budget: number;
  bio: string | null;
};

export function SettingsView({
  settings,
  profile,
  goals,
}: {
  settings: Settings;
  profile: HealthProfile;
  goals: HealthGoal[];
}) {
  const preferencesAction = useModuleAction(saveSettings);
  const profileAction = useModuleAction(saveHealthProfile);
  const bmi =
    profile.height_cm && profile.weight_kg
      ? profile.weight_kg / (profile.height_cm / 100) ** 2
      : null;

  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="Make VIVA" highlight="yours." />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
        <Panel title="Health profile">
          <form action={profileAction.submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Display name" hint="Required">
                <input
                  name="display_name"
                  defaultValue={profile.display_name}
                  required
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Email" hint="Managed by authentication">
                <input value={profile.email ?? ""} disabled className={`${fieldClass} opacity-60`} />
              </FormField>
              <FormField label="Birth date">
                <input
                  name="birth_date"
                  type="date"
                  defaultValue={profile.birth_date ?? ""}
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Sex">
                <select name="sex" defaultValue={profile.sex ?? ""} className={fieldClass}>
                  <option value="">Prefer not to set</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </FormField>
              <FormField label="Height" hint="cm">
                <input
                  name="height_cm"
                  type="number"
                  min={50}
                  max={250}
                  step="0.1"
                  defaultValue={profile.height_cm ?? ""}
                  placeholder="170"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Current weight" hint="kg">
                <input
                  name="weight_kg"
                  type="number"
                  min={20}
                  max={400}
                  step="0.1"
                  defaultValue={profile.weight_kg ?? ""}
                  placeholder="65"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Goal weight" hint="kg">
                <input
                  name="goal_weight_kg"
                  type="number"
                  min={20}
                  max={400}
                  step="0.1"
                  defaultValue={profile.goal_weight_kg ?? ""}
                  placeholder="60"
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Activity level">
                <select
                  name="activity_level"
                  defaultValue={profile.activity_level ?? ""}
                  className={fieldClass}
                >
                  <option value="">Select activity level</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly active</option>
                  <option value="moderate">Moderately active</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very active</option>
                </select>
              </FormField>
              <FormField label="Primary health focus" className="sm:col-span-2">
                <select
                  name="health_focus"
                  defaultValue={profile.health_focus ?? "general"}
                  className={fieldClass}
                >
                  <option value="general">General vitality</option>
                  <option value="weight">Weight management</option>
                  <option value="strength">Strength</option>
                  <option value="endurance">Endurance</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="sleep">Sleep</option>
                  <option value="stress">Stress management</option>
                </select>
              </FormField>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Daily step goal">
                <input
                  name="daily_step_goal"
                  type="number"
                  min={1000}
                  defaultValue={profile.daily_step_goal}
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Water goal" hint="ml">
                <input
                  name="daily_water_goal_ml"
                  type="number"
                  min={250}
                  defaultValue={profile.daily_water_goal_ml}
                  className={fieldClass}
                />
              </FormField>
              <FormField label="Health budget" hint="PHP / month">
                <input
                  name="monthly_health_budget"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={profile.monthly_health_budget}
                  className={fieldClass}
                />
              </FormField>
            </div>

            <FormField label="About your health" hint="Up to 500 characters">
              <textarea
                name="bio"
                rows={4}
                defaultValue={profile.bio ?? ""}
                placeholder="Anything VIVA should consider when creating your insights…"
                className={fieldClass}
              />
            </FormField>
            <PrimaryButton disabled={profileAction.pending}>
              {profileAction.pending ? "Saving profile…" : "Save health profile"}
            </PrimaryButton>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel title="Profile snapshot">
            <div className="grid grid-cols-2 gap-3">
              {[
                [Scale, "Weight", profile.weight_kg ? `${profile.weight_kg} kg` : "Not set"],
                [Ruler, "Height", profile.height_cm ? `${profile.height_cm} cm` : "Not set"],
                [HeartPulse, "BMI", bmi ? bmi.toFixed(1) : "Not set"],
                [Activity, "Activity", profile.activity_level?.replace("_", " ") ?? "Not set"],
              ].map(([Icon, label, value]) => {
                const SnapshotIcon = Icon as typeof Scale;
                return (
                  <div key={String(label)} className="rounded-2xl bg-[#f4efe4]/60 p-4">
                    <SnapshotIcon size={16} className="text-[#5f45e6]" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-[#948e99]">
                      {String(label)}
                    </p>
                    <p className="mt-1 text-sm font-black capitalize">{String(value)}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#ece7fb]/70 p-4 text-xs leading-5 text-[#645a78]">
              <BadgeInfo size={16} className="mt-0.5 shrink-0 text-[#5f45e6]" />
              BMI is a general screening measure, not a diagnosis. VIVA uses your profile only
              to personalize wellness guidance.
            </div>
          </Panel>

          <Panel title="Daily targets">
            <div className="space-y-3">
              {[
                ["Steps", `${profile.daily_step_goal.toLocaleString()} / day`],
                ["Hydration", `${(profile.daily_water_goal_ml / 1000).toFixed(1)} L / day`],
                ["Budget", `₱${profile.monthly_health_budget.toLocaleString()} / month`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-[#f4efe4]/50 p-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-[#5f45e6]">
                    <Target size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#8a8491]">{label}</p>
                    <p className="text-sm font-black">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <GoalsPanel goals={goals} />

      <Panel title="App preferences" className="mt-4">
        <form action={preferencesAction.submit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Appearance">
              <select name="theme" defaultValue={settings.theme} className={fieldClass}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </FormField>
            <FormField label="Timezone" hint="IANA name">
              <input name="timezone" defaultValue={settings.timezone} className={fieldClass} />
            </FormField>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-[#26222f]/7 bg-white/40 px-4 py-3 text-sm font-bold">
            <span>
              <span className="block">Push notifications</span>
              <span className="mt-0.5 block text-xs font-normal text-[#918b96]">
                Receive reminders and new VIVA insights
              </span>
            </span>
            <input
              type="checkbox"
              name="notifications_enabled"
              defaultChecked={settings.notifications_enabled}
              className="size-5 accent-[#5f45e6]"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-[#26222f]/7 bg-white/40 px-4 py-3 text-sm font-bold">
            <span>
              <span className="block">Weekly report</span>
              <span className="mt-0.5 block text-xs font-normal text-[#918b96]">
                Email a summary of your wellbeing trends
              </span>
            </span>
            <input
              type="checkbox"
              name="weekly_report_enabled"
              defaultChecked={settings.weekly_report_enabled}
              className="size-5 accent-[#5f45e6]"
            />
          </label>
          <PrimaryButton disabled={preferencesAction.pending}>
            {preferencesAction.pending ? "Saving…" : "Save preferences"}
          </PrimaryButton>
        </form>
      </Panel>
    </>
  );
}

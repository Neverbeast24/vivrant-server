"use client";

import { saveSettings } from "@/app/dashboard/settings/actions";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { useModuleAction } from "@/components/dashboard/use-module-action";

type Settings = {
  theme: string;
  notifications_enabled: boolean;
  weekly_report_enabled: boolean;
  timezone: string;
};

export function SettingsView({ settings }: { settings: Settings }) {
  const { pending, submit } = useModuleAction(saveSettings);

  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="Make VIVA" highlight="yours." />
      <Panel title="Preferences">
        <form action={submit} className="space-y-4">
          <label className="block text-sm font-bold">
            Theme
            <select
              name="theme"
              defaultValue={settings.theme}
              className="mt-2 w-full rounded-2xl border border-black/8 bg-white px-4 py-3"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="block text-sm font-bold">
            Timezone
            <input
              name="timezone"
              defaultValue={settings.timezone}
              className="mt-2 w-full rounded-2xl border border-black/8 bg-white px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="notifications_enabled"
              defaultChecked={settings.notifications_enabled}
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="weekly_report_enabled"
              defaultChecked={settings.weekly_report_enabled}
            />
            Weekly report emails
          </label>
          <button
            disabled={pending}
            className="rounded-2xl bg-[#24212e] px-5 py-3 text-sm font-bold text-white"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </form>
      </Panel>
    </>
  );
}

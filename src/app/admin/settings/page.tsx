import { createClient } from "@/lib/supabase/server";

function statusChip(ok: boolean, okLabel: string, missingLabel: string) {
  return ok ? (
    <span className="rounded-full bg-[#e6faf6] px-2.5 py-1 text-[10px] font-black text-[#0f8f80]">
      {okLabel}
    </span>
  ) : (
    <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[10px] font-black text-[#c24a1a]">
      {missingLabel}
    </span>
  );
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  const services = [
    {
      name: "Supabase database",
      detail: "Auth, Postgres, and row-level security",
      ok: !dbError,
      okLabel: "Connected",
      missingLabel: "Error",
    },
    {
      name: "Gemini AI engine",
      detail: "Personalized insights on the AI Engine page",
      ok: Boolean(process.env.GEMINI_API_KEY),
      okLabel: "Configured",
      missingLabel: "Add GEMINI_API_KEY",
    },
    {
      name: "Firebase messaging",
      detail: "Web push notifications for reminders",
      ok: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      okLabel: "Configured",
      missingLabel: "Not configured",
    },
  ];

  const environment = [
    ["Project", "gcqbuccazplfpmuhperg", "Supabase project reference"],
    ["Region", "ap-southeast-2", "Sydney (closest to PH/SG)"],
    ["App URL", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", "Used in auth email links"],
    ["AI model", process.env.GEMINI_MODEL ?? "gemini-flash-latest", "Gemini Developer API"],
  ] as const;

  return (
    <>
      <h1 className="font-display text-4xl">Admin Settings</h1>
      <p className="mt-2 text-sm text-[#77727f]">
        Platform configuration and service health for the VIVA web console.
      </p>

      <div className="mt-8">
        <p className="mb-3 text-xs font-black tracking-wide text-[#8a8491]">SERVICE HEALTH</p>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.name}
              className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4] p-5 shadow-[0_14px_32px_rgba(64,49,38,.07)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{service.name}</p>
                {statusChip(service.ok, service.okLabel, service.missingLabel)}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#8a8491]">{service.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-black tracking-wide text-[#8a8491]">ENVIRONMENT</p>
        <div className="grid gap-4 md:grid-cols-2">
          {environment.map(([label, value, detail]) => (
            <article
              key={label}
              className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4] p-5 shadow-[0_14px_32px_rgba(64,49,38,.07)]"
            >
              <p className="text-[11px] font-black tracking-[0.16em] text-[#5f45e6]">
                {label.toUpperCase()}
              </p>
              <p className="font-display mt-3 break-all text-2xl tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-[#8a8491]">{detail}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-8 rounded-2xl border border-dashed border-[#26222f]/12 bg-[#f4efe4]/40 px-4 py-4 text-xs leading-5 text-[#8a8491]">
        Secrets are managed in <span className="font-bold">.env.local</span> for local
        development and Vercel environment variables for production. They are never stored
        in this dashboard or in git.
      </p>
    </>
  );
}

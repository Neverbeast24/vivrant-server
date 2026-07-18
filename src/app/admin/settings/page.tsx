export default function AdminSettingsPage() {
  return (
    <>
      <h1 className="font-display text-4xl">Admin Settings</h1>
      <p className="mt-2 text-sm text-[#77727f]">
        Platform configuration for the VIVA web console.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white bg-white/75 p-5 shadow-sm">
          <p className="text-xs font-black text-[#7557ff]">PROJECT</p>
          <p className="mt-3 font-bold">gcqbuccazplfpmuhperg</p>
          <p className="mt-1 text-xs text-[#8a8491]">Supabase project reference</p>
        </article>
        <article className="rounded-[1.5rem] border border-white bg-white/75 p-5 shadow-sm">
          <p className="text-xs font-black text-[#7557ff]">REGION</p>
          <p className="mt-3 font-bold">ap-southeast-2</p>
          <p className="mt-1 text-xs text-[#8a8491]">Sydney (closest to PH/SG)</p>
        </article>
      </div>
    </>
  );
}

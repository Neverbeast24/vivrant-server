export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[#14221b]/8" />
        <div className="h-10 w-72 max-w-full rounded-2xl bg-[#14221b]/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-[1.4rem] bg-[#14221b]/6" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-[1.4rem] bg-[#14221b]/6" />
        <div className="h-72 rounded-[1.4rem] bg-[#14221b]/6" />
      </div>
    </div>
  );
}

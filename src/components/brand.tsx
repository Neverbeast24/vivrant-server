import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

export function Brand({
  compact = false,
  tone = "light",
  className = "",
}: BrandProps) {
  const titleClass = tone === "dark" ? "text-white" : "text-[#14221b]";
  const subtitleClass = tone === "dark" ? "text-white/45" : "text-[#5a6b62]";

  if (compact) {
    return (
      <Link
        href="/"
        className={`focus-ring inline-flex size-10 items-center justify-center overflow-hidden rounded-xl bg-black ${className}`}
        aria-label="VIVRΛNT home"
      >
        <Image
          src="/vivrant-mark.png"
          alt=""
          width={40}
          height={40}
          priority
          className="block size-10 object-cover object-center"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`focus-ring inline-grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-2.5 rounded-xl ${className}`}
      aria-label="VIVRΛNT home"
    >
      <span className="flex size-10 overflow-hidden rounded-xl bg-black">
        <Image
          src="/vivrant-mark.png"
          alt=""
          width={40}
          height={40}
          priority
          className="block size-10 object-cover object-center"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center gap-[0.3rem] leading-none">
        <span className={`text-[1rem] font-black tracking-[0.14em] ${titleClass}`}>
          VIVRΛNT
        </span>
        <span
          className={`truncate text-[0.55rem] font-bold tracking-[0.14em] uppercase ${subtitleClass}`}
          title="VIVRΛNT · Long live life"
        >
          Long live life
        </span>
      </span>
    </Link>
  );
}

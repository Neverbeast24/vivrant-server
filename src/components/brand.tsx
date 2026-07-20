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

  return (
    <Link
      href="/"
      className={`focus-ring inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-xl ${className}`}
      aria-label="VIVRΛNT home"
    >
      <span className="flex size-10 shrink-0 items-center justify-center">
        <Image
          src="/vivrant-mark.png"
          alt=""
          width={40}
          height={40}
          priority
          className="block size-9 rounded-lg object-contain"
        />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col justify-center gap-1 leading-none">
          <span className={`text-[1.02rem] font-black tracking-[0.16em] ${titleClass}`}>
            VIVRΛNT
          </span>
          <span
            className={`truncate text-[0.55rem] font-bold tracking-[0.16em] uppercase ${subtitleClass}`}
            title="VIVRΛNT · Long live life"
          >
            Long live life
          </span>
        </span>
      )}
    </Link>
  );
}

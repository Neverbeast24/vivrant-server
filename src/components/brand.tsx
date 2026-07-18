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
  const titleClass = tone === "dark" ? "text-white" : "text-[#242131]";
  const subtitleClass = tone === "dark" ? "text-white/45" : "text-[#868291]";

  return (
    <Link
      href="/"
      className={`focus-ring inline-flex min-w-0 max-w-full items-center gap-3 rounded-xl ${className}`}
      aria-label="VIVA home"
    >
      <Image
        src="/viva-mark.svg"
        alt=""
        width={40}
        height={40}
        priority
        className="size-10 shrink-0"
      />
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={`text-[1.05rem] font-black tracking-[0.22em] ${titleClass}`}>
            VIVA
          </span>
          <span
            className={`mt-1.5 truncate text-[0.55rem] font-bold tracking-[0.18em] uppercase ${subtitleClass}`}
            title="Virtual Intelligent Vitality Assistant · Long live life"
          >
            Long live life
          </span>
        </span>
      )}
    </Link>
  );
}

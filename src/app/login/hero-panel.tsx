"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { Brand } from "@/components/brand";

type FoodKind = "healthy" | "unhealthy";

type Food = {
  id: string;
  emoji: string;
  name: string;
  kind: FoodKind;
  tip: string;
};

type Toast = {
  id: string;
  tone: "good" | "warn";
  text: string;
};

type ClickRipple = {
  id: string;
  x: number;
  y: number;
};

const FOODS: Food[] = [
  { id: "apple", emoji: "🍎", name: "Apple", kind: "healthy", tip: "Fiber + steady energy" },
  { id: "salad", emoji: "🥗", name: "Salad", kind: "healthy", tip: "Greens keep you light" },
  { id: "salmon", emoji: "🐟", name: "Salmon", kind: "healthy", tip: "Omega-3 for focus" },
  { id: "yogurt", emoji: "🥣", name: "Yogurt", kind: "healthy", tip: "Protein that lasts" },
  { id: "broccoli", emoji: "🥦", name: "Broccoli", kind: "healthy", tip: "A quiet micronutrient win" },
  { id: "berries", emoji: "🫐", name: "Berries", kind: "healthy", tip: "Antioxidant snack" },
  { id: "avocado", emoji: "🥑", name: "Avocado", kind: "healthy", tip: "Good fats, calm brain" },
  { id: "donut", emoji: "🍩", name: "Donut", kind: "unhealthy", tip: "Sugar spike, then a crash" },
  { id: "fries", emoji: "🍟", name: "Fries", kind: "unhealthy", tip: "Heavy oil, low payoff" },
  { id: "soda", emoji: "🥤", name: "Soda", kind: "unhealthy", tip: "Empty calories" },
  { id: "burger", emoji: "🍔", name: "Burger", kind: "unhealthy", tip: "Save it for a treat day" },
  { id: "candy", emoji: "🍬", name: "Candy", kind: "unhealthy", tip: "Quick hit, quick fade" },
  { id: "pizza", emoji: "🍕", name: "Pizza", kind: "unhealthy", tip: "Fun, not everyday fuel" },
  { id: "icecream", emoji: "🍦", name: "Ice cream", kind: "unhealthy", tip: "Dessert energy only" },
];

/* Fixed slots around the panel. `dx`/`dy` size the idle wander; `size` is emoji scale. */
const SLOTS = [
  { className: "left-[6%] top-[16%]", duration: 9.5, dx: 14, dy: 18, size: "text-[2.35rem]" },
  { className: "right-[10%] top-[12%]", duration: 11, dx: -16, dy: 12, size: "text-[2.5rem]" },
  { className: "left-[24%] top-[30%]", duration: 8.8, dx: 11, dy: 16, size: "text-[2.1rem]" },
  { className: "right-[5%] top-[40%]", duration: 10.5, dx: -13, dy: 18, size: "text-[2.4rem]" },
  { className: "left-[4%] top-[74%]", duration: 9.8, dx: 15, dy: 11, size: "text-[2.55rem]" },
  { className: "right-[22%] top-[58%]", duration: 10.2, dx: -10, dy: 15, size: "text-[2.2rem]" },
  { className: "left-[30%] top-[66%]", duration: 9.2, dx: 16, dy: 14, size: "text-[2.45rem]" },
];

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Idle float only — no cursor tracking / magnetic pull. */
function FloatingFood({
  food,
  slotIndex,
  duration,
  dx,
  dy,
  size,
  onCollect,
}: {
  food: Food;
  slotIndex: number;
  duration: number;
  dx: number;
  dy: number;
  size: string;
  onCollect: () => void;
}) {
  const scale = useSpring(1, { stiffness: 220, damping: 24, mass: 0.7 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.45 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative size-[3.4rem]"
    >
      <motion.div
        animate={{
          x: [0, dx, -dx * 0.55, 0],
          y: [0, -dy, dy * 0.45, 0],
          rotate: [0, 4, -3.5, 0],
        }}
        transition={{
          x: {
            duration: duration * 1.35,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          },
          y: {
            duration,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          },
          rotate: {
            duration: duration * 1.7,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          },
        }}
        className="grid size-full place-items-center"
      >
        <motion.button
          type="button"
          draggable
          title={`${food.name} — drag or tap to add to the cart`}
          style={{ scale }}
          onHoverStart={() => scale.set(1.14)}
          onHoverEnd={() => scale.set(1)}
          onTapStart={() => scale.set(0.92)}
          onTapCancel={() => scale.set(1)}
          onDragStartCapture={(event) => {
            const data = (event as unknown as React.DragEvent<HTMLButtonElement>)
              .dataTransfer;
            data.setData("text/food-slot", `${food.id}:${slotIndex}`);
            data.effectAllowed = "copy";
          }}
          onClick={(event) => {
            event.stopPropagation();
            onCollect();
          }}
          className={`focus-ring relative grid size-full cursor-grab place-items-center rounded-full bg-transparent ${size} leading-none drop-shadow-[0_14px_28px_rgba(0,0,0,.45)] transition-[filter] duration-300 active:cursor-grabbing hover:drop-shadow-[0_18px_36px_rgba(14,124,102,.35)]`}
        >
          <span className="select-none" aria-hidden>
            {food.emoji}
          </span>
          <span className="sr-only">{food.name}</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function HeroPanel() {
  const [slots, setSlots] = useState<(Food | null)[]>(() =>
    FOODS.slice(0, SLOTS.length),
  );
  const [cartCount, setCartCount] = useState(0);
  const [healthyCount, setHealthyCount] = useState(0);
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [cartPulse, setCartPulse] = useState<"good" | "warn" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respawnTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rippleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timers = respawnTimers.current;
    const ripplesCleanup = rippleTimers.current;
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      timers.forEach(clearTimeout);
      ripplesCleanup.forEach(clearTimeout);
    };
  }, []);

  function showToast(tone: "good" | "warn", text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: crypto.randomUUID(), tone, text });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function spawnRipple(clientX: number, clientY: number) {
    const bounds = sectionRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const id = crypto.randomUUID();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    setRipples((current) => [...current.slice(-4), { id, x, y }]);
    const timer = setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 900);
    rippleTimers.current.push(timer);
  }

  function respawn(slotIndex: number) {
    const timer = setTimeout(() => {
      setSlots((current) => {
        const onScreen = new Set(current.filter(Boolean).map((food) => food!.id));
        const candidate = shuffle(FOODS.filter((food) => !onScreen.has(food.id)))[0];
        if (!candidate) return current;
        const next = [...current];
        next[slotIndex] = candidate;
        return next;
      });
    }, 1400);
    respawnTimers.current.push(timer);
  }

  function collect(food: Food, slotIndex: number) {
    const isHealthy = food.kind === "healthy";
    setSlots((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
    setCartCount((value) => value + 1);
    setHealthyCount((value) => value + (isHealthy ? 1 : 0));
    setScore((value) => value + (isHealthy ? 12 : -6));
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setCartPulse(isHealthy ? "good" : "warn");
    pulseTimer.current = setTimeout(() => setCartPulse(null), 500);
    showToast(
      isHealthy ? "good" : "warn",
      `${food.emoji} ${isHealthy ? "+12" : "−6"} · ${food.tip}`,
    );
    respawn(slotIndex);
  }

  function onDropFood(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const payload = event.dataTransfer.getData("text/food-slot");
    const [id, slot] = payload.split(":");
    const slotIndex = Number(slot);
    const food = slots[slotIndex];
    if (food && food.id === id) collect(food, slotIndex);
  }

  return (
    <section
      ref={sectionRef}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        spawnRipple(event.clientX, event.clientY);
      }}
      className="relative hidden overflow-hidden bg-[#08110e] p-12 text-white lg:flex lg:flex-col"
    >
      {/* Organic botanical atmosphere — no SaaS grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 18% 35%, rgba(14,124,102,.28), transparent 62%), radial-gradient(ellipse 55% 50% at 88% 78%, rgba(42,157,143,.18), transparent 58%), radial-gradient(ellipse 40% 35% at 70% 12%, rgba(61,184,150,.1), transparent 55%), linear-gradient(165deg, #06100c 0%, #0a1511 42%, #0c1814 100%)",
        }}
      />
      <div className="animate-glow pointer-events-none absolute -left-24 top-10 size-[28rem] rounded-[45%_55%_60%_40%] bg-[#0e7c66]/20 blur-[90px]" />
      <div className="animate-glow-slow pointer-events-none absolute -bottom-36 -right-16 size-[32rem] rounded-[55%_45%_40%_60%] bg-[#2a9d8f]/14 blur-[100px]" />

      {/* Soft leaf silhouettes */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/4 h-[70%] w-[48%] opacity-[0.07]"
        viewBox="0 0 400 640"
        fill="none"
      >
        <path
          d="M210 40C140 120 90 220 120 340C150 460 240 540 320 600C250 480 260 360 290 250C320 140 280 70 210 40Z"
          fill="currentColor"
          className="text-[#3db896]"
        />
        <path
          d="M80 180C40 260 50 360 110 440C170 520 260 560 320 580C240 500 200 400 180 300C160 200 130 160 80 180Z"
          fill="currentColor"
          className="text-[#0e7c66]"
        />
      </svg>

      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Click bloom ripples */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.55 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="absolute size-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                background:
                  "radial-gradient(circle, rgba(61,184,150,.35) 0%, rgba(14,124,102,.12) 42%, transparent 70%)",
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {slots.map((food, index) =>
          food ? (
            <div
              key={`slot-${index}-${food.id}`}
              className={`absolute z-10 ${SLOTS[index].className}`}
            >
              <FloatingFood
                food={food}
                slotIndex={index}
                duration={SLOTS[index].duration}
                dx={SLOTS[index].dx}
                dy={SLOTS[index].dy}
                size={SLOTS[index].size}
                onCollect={() => collect(food, index)}
              />
            </div>
          ) : null,
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <Brand tone="dark" />
      </div>

      <div className="relative z-20 my-auto max-w-[22rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-5 text-[0.65rem] font-bold tracking-[0.28em] text-[#7dcfb8]/80 uppercase">
            Long live life
          </p>
          <h1 className="font-display text-[3.35rem] leading-[1.02] tracking-[-0.035em] text-white">
            VIVRΛNT
            <span className="mt-3 block text-[2.15rem] leading-[1.15] font-medium tracking-[-0.02em] text-white/88">
              starts with the{" "}
              <em className="text-[#7dcfb8]">next quiet choice.</em>
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-[0.95rem] leading-7 text-white/48">
            Notice patterns. Celebrate progress. Keep your next decision kind.
          </p>
          <p className="mt-8 text-[0.7rem] font-bold tracking-[0.18em] text-white/28 uppercase">
            Tap a food into the basket
          </p>
        </motion.div>
      </div>

      <div className="relative z-20 flex items-end justify-between gap-6">
        <p className="max-w-[14rem] text-[0.7rem] leading-5 text-white/30">
          Every choice shapes your health.
          {cartCount > 0 ? (
            <span className="mt-1.5 block text-white/45">
              {score} pts · {healthyCount}/{cartCount} healthy
            </span>
          ) : null}
        </p>
      </div>

      <motion.button
        type="button"
        title="Your cart — drop foods here"
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropFood}
        onPointerDown={(event) => event.stopPropagation()}
        animate={{
          y: [0, -8, 0],
          scale: cartPulse || dragOver ? 1.1 : 1,
          borderColor:
            cartPulse === "good"
              ? "rgba(52, 211, 153, 0.55)"
              : cartPulse === "warn"
                ? "rgba(248, 113, 113, 0.5)"
                : dragOver
                  ? "rgba(61, 184, 150, 0.55)"
                  : "rgba(255, 255, 255, 0.14)",
        }}
        transition={{
          y: { duration: 6.4, repeat: Infinity, ease: "easeInOut" },
          scale: { type: "spring", stiffness: 260, damping: 20 },
          borderColor: { duration: 0.25 },
        }}
        className="absolute right-[9%] bottom-[15%] z-20 grid size-[3.75rem] place-items-center rounded-full border bg-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,.4)] backdrop-blur-md"
      >
        <ShoppingCart size={20} className="text-white/80" />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-[#0e7c66] text-[10px] font-black text-white shadow-lg"
            >
              {cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute right-[6%] bottom-[7%] z-20 max-w-64 px-1 py-1 text-xs font-bold ${
              toast.tone === "good" ? "text-emerald-200/90" : "text-red-200/85"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

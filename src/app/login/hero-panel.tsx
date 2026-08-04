"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
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

/* Fixed slots around the panel. `depth` is subtle parallax strength;
   `dx`/`dy` size the idle wander; `size` is emoji scale. */
const SLOTS = [
  { className: "left-[7%] top-[14%]", duration: 9.5, depth: 0.18, dx: 10, dy: 14, size: "text-[2.35rem]" },
  { className: "right-[12%] top-[11%]", duration: 11, depth: 0.28, dx: -12, dy: 10, size: "text-[2.5rem]" },
  { className: "left-[28%] top-[26%]", duration: 8.8, depth: 0.14, dx: 8, dy: 12, size: "text-[2.1rem]" },
  { className: "right-[6%] top-[36%]", duration: 10.5, depth: 0.24, dx: -10, dy: 14, size: "text-[2.4rem]" },
  { className: "left-[5%] top-[76%]", duration: 9.8, depth: 0.3, dx: 11, dy: 9, size: "text-[2.55rem]" },
  { className: "right-[26%] top-[56%]", duration: 10.2, depth: 0.16, dx: -8, dy: 12, size: "text-[2.2rem]" },
  { className: "left-[32%] top-[68%]", duration: 9.2, depth: 0.22, dx: 12, dy: 11, size: "text-[2.45rem]" },
];

const SPRING = { stiffness: 90, damping: 22, mass: 0.85 } as const;
const SPOT_SPRING = { stiffness: 70, damping: 24, mass: 0.9 } as const;

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

type Parallax = { x: MotionValue<number>; y: MotionValue<number> };

/** Soft global drift — depth is a fraction of a small max travel. */
function ParallaxLayer({
  parallax,
  depth,
  className,
  children,
}: {
  parallax: Parallax;
  depth: number;
  className?: string;
  children: React.ReactNode;
}) {
  const max = 28;
  const x = useTransform(parallax.x, (value) => value * depth * max);
  const y = useTransform(parallax.y, (value) => value * depth * max);
  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Idle float + magnetic nudge when the pointer is nearby. */
function FloatingFood({
  food,
  slotIndex,
  duration,
  dx,
  dy,
  size,
  pointerX,
  pointerY,
  onCollect,
}: {
  food: Food;
  slotIndex: number;
  duration: number;
  dx: number;
  dy: number;
  size: string;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  onCollect: () => void;
}) {
  // Anchor stays put so magnetic math ignores float/scale transforms.
  const anchorRef = useRef<HTMLDivElement>(null);
  const magneticX = useSpring(0, SPRING);
  const magneticY = useSpring(0, SPRING);
  const scale = useSpring(1, { stiffness: 220, damping: 24, mass: 0.7 });

  useEffect(() => {
    let frame = 0;

    function updateMagnetic() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = pointerX.get();
      const py = pointerY.get();

      if (px < -200 || py < -200) {
        magneticX.set(0);
        magneticY.set(0);
        return;
      }

      const dxp = cx - px;
      const dyp = cy - py;
      const dist = Math.hypot(dxp, dyp);
      const radius = 130;

      if (dist < radius && dist > 0.01) {
        const force = (1 - dist / radius) ** 1.35;
        const push = 18 * force;
        magneticX.set((dxp / dist) * push);
        magneticY.set((dyp / dist) * push);
      } else {
        magneticX.set(0);
        magneticY.set(0);
      }
    }

    const unsubX = pointerX.on("change", () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateMagnetic);
    });
    const unsubY = pointerY.on("change", () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateMagnetic);
    });

    return () => {
      unsubX();
      unsubY();
      cancelAnimationFrame(frame);
    };
  }, [pointerX, pointerY, magneticX, magneticY]);

  return (
    <div ref={anchorRef} className="relative size-[3.4rem]">
      <motion.div
        style={{ x: magneticX, y: magneticY }}
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.45 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {/* Idle wander lives on its own layer so hover scale never fights it. */}
        <motion.div
          animate={{
            x: [0, dx, -dx * 0.55, 0],
            y: [0, -dy, dy * 0.45, 0],
            rotate: [0, 3.5, -3, 0],
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
              duration: duration * 1.6,
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
            onClick={onCollect}
            className={`focus-ring relative grid size-full cursor-grab place-items-center rounded-full bg-transparent ${size} leading-none drop-shadow-[0_14px_28px_rgba(0,0,0,.45)] transition-[filter] duration-300 active:cursor-grabbing hover:drop-shadow-[0_18px_36px_rgba(14,124,102,.35)]`}
          >
            <span className="select-none" aria-hidden>
              {food.emoji}
            </span>
            <span className="sr-only">{food.name}</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respawnTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sectionRef = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, SPRING);
  const parallaxY = useSpring(rawY, SPRING);
  const parallax: Parallax = { x: parallaxX, y: parallaxY };

  // Absolute pointer for magnetic food repulsion (client coords).
  const pointerX = useMotionValue(-9999);
  const pointerY = useMotionValue(-9999);

  const spotRawX = useMotionValue(-400);
  const spotRawY = useMotionValue(-400);
  const spotX = useSpring(spotRawX, SPOT_SPRING);
  const spotY = useSpring(spotRawY, SPOT_SPRING);
  const spotlight = useMotionTemplate`radial-gradient(26rem circle at ${spotX}px ${spotY}px, rgba(61,184,150,.14), transparent 68%)`;

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const bounds = sectionRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    rawX.set((px / bounds.width) * 2 - 1);
    rawY.set((py / bounds.height) * 2 - 1);
    spotRawX.set(px);
    spotRawY.set(py);
    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
  }

  function handlePointerLeave() {
    rawX.set(0);
    rawY.set(0);
    spotRawX.set(-400);
    spotRawY.set(-400);
    pointerX.set(-9999);
    pointerY.set(-9999);
  }

  useEffect(() => {
    const timers = respawnTimers.current;
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      timers.forEach(clearTimeout);
    };
  }, []);

  function showToast(tone: "good" | "warn", text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: crypto.randomUUID(), tone, text });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
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
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative hidden overflow-hidden bg-[#0c1210] p-12 text-white lg:flex lg:flex-col"
    >
      {/* Botanical ambient glow + grid */}
      <div className="animate-glow absolute -left-32 top-20 size-[30rem] rounded-full bg-[#0e7c66]/22 blur-[110px]" />
      <div className="animate-glow-slow absolute -bottom-44 right-0 size-[34rem] rounded-full bg-[#2a9d8f]/18 blur-[120px]" />
      <div className="animate-glow-slow absolute left-1/3 top-1/2 size-[20rem] rounded-full bg-[#3db896]/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,240,235,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(232,240,235,.55) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: spotlight }}
      />

      <AnimatePresence mode="popLayout">
        {slots.map((food, index) =>
          food ? (
            <ParallaxLayer
              key={`slot-${index}-${food.id}`}
              parallax={parallax}
              depth={SLOTS[index].depth}
              className={`absolute z-10 ${SLOTS[index].className}`}
            >
              <FloatingFood
                food={food}
                slotIndex={index}
                duration={SLOTS[index].duration}
                dx={SLOTS[index].dx}
                dy={SLOTS[index].dy}
                size={SLOTS[index].size}
                pointerX={pointerX}
                pointerY={pointerY}
                onCollect={() => collect(food, index)}
              />
            </ParallaxLayer>
          ) : null,
        )}
      </AnimatePresence>

      <div className="relative z-20 flex items-start justify-between gap-4">
        <Brand tone="dark" />
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-black backdrop-blur-xl"
          >
            {score} pts
            <span className="ml-2 font-semibold text-white/40">
              {healthyCount}/{cartCount} healthy
            </span>
          </motion.div>
        )}
      </div>

      <div className="relative z-20 my-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-6xl leading-[1.02] tracking-[-0.03em]">
            Your healthier rhythm starts{" "}
            <em className="gradient-text not-italic">quietly.</em>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/55">
            One private space to notice patterns, celebrate progress, and make
            your next choice with confidence.
          </p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2"
          aria-label="Product pillars"
        >
          {["Nutrition", "Movement", "Sleep", "Groceries", "AI insights"].map(
            (label, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 + i * 0.05, duration: 0.45 }}
                whileHover={{ y: -2, color: "rgba(255,255,255,0.95)" }}
                className="cursor-default text-[13px] font-bold tracking-wide text-white/80 transition-colors"
              >
                {label}
              </motion.span>
            ),
          )}
        </motion.nav>
      </div>

      <p className="relative z-20 text-xs text-white/35">
        Every choice shapes your health.
      </p>

      <motion.button
        type="button"
        title="Your cart — drop foods here"
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropFood}
        animate={{
          y: [0, -7, 0],
          scale: cartPulse || dragOver ? 1.12 : 1,
          borderColor:
            cartPulse === "good"
              ? "rgba(52, 211, 153, 0.55)"
              : cartPulse === "warn"
                ? "rgba(248, 113, 113, 0.5)"
                : dragOver
                  ? "rgba(61, 184, 150, 0.55)"
                  : "rgba(255, 255, 255, 0.16)",
        }}
        transition={{
          y: { duration: 6.2, repeat: Infinity, ease: "easeInOut" },
          scale: { type: "spring", stiffness: 260, damping: 20 },
          borderColor: { duration: 0.25 },
        }}
        className="absolute bottom-[16%] right-[10%] z-20 grid size-16 place-items-center rounded-full border bg-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,.45)] backdrop-blur-xl"
      >
        <ShoppingCart size={22} className="text-white/85" />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[#0e7c66] text-[10px] font-black text-white shadow-lg"
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
            className={`absolute bottom-[7%] right-[6%] z-20 max-w-64 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-[0_18px_45px_rgba(0,0,0,.35)] backdrop-blur-xl ${
              toast.tone === "good"
                ? "border-emerald-400/30 bg-emerald-950/70 text-emerald-100"
                : "border-red-400/25 bg-red-950/65 text-red-100"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

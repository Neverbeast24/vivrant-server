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

/* Fixed slots around the panel; each floating food lives in one.
   `depth` controls how far it drifts with the pointer, `dx`/`dy` control
   the size of its own wandering loop. */
const SLOTS = [
  { className: "left-[8%] top-[16%]", duration: 7, depth: 34, dx: 14, dy: 18 },
  { className: "right-[14%] top-[13%]", duration: 8.5, depth: 52, dx: -18, dy: 14 },
  { className: "left-[30%] top-[28%]", duration: 6.5, depth: 24, dx: 12, dy: 20 },
  { className: "right-[8%] top-[38%]", duration: 9, depth: 44, dx: -14, dy: 22 },
  { className: "left-[6%] top-[78%]", duration: 7.5, depth: 58, dx: 16, dy: 12 },
  { className: "right-[28%] top-[58%]", duration: 8, depth: 30, dx: -12, dy: 18 },
  { className: "left-[34%] top-[70%]", duration: 6.8, depth: 48, dx: 18, dy: 16 },
];

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

type Parallax = { x: MotionValue<number>; y: MotionValue<number> };

/** Wrapper that drifts with the pointer; higher depth moves further. */
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
  const x = useTransform(parallax.x, (value) => value * depth);
  const y = useTransform(parallax.y, (value) => value * depth);
  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respawnTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Pointer-follow effects: parallax drift for floating items + spotlight.
  const sectionRef = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { stiffness: 55, damping: 16, mass: 0.6 });
  const parallaxY = useSpring(rawY, { stiffness: 55, damping: 16, mass: 0.6 });
  const parallax: Parallax = { x: parallaxX, y: parallaxY };
  const spotX = useMotionValue(-400);
  const spotY = useMotionValue(-400);
  const spotlight = useMotionTemplate`radial-gradient(24rem circle at ${spotX}px ${spotY}px, rgba(139,112,255,.15), transparent 70%)`;

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const bounds = sectionRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    rawX.set((px / bounds.width) * 2 - 1);
    rawY.set((py / bounds.height) * 2 - 1);
    spotX.set(px);
    spotY.set(py);
  }

  function handlePointerLeave() {
    rawX.set(0);
    rawY.set(0);
    spotX.set(-400);
    spotY.set(-400);
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
      className="relative hidden overflow-hidden bg-[#1b1826] p-12 text-white lg:flex lg:flex-col"
    >
      {/* Ambient glow + grid backdrop */}
      <div className="animate-glow absolute -left-32 top-24 size-[30rem] rounded-full bg-accent/28 blur-[100px]" />
      <div className="animate-glow-slow absolute -bottom-44 right-0 size-[32rem] rounded-full bg-[#0fb3ab]/20 blur-[110px]" />
      <div className="animate-glow-slow absolute left-1/3 top-1/2 size-[22rem] rounded-full bg-ember/10 blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Cursor spotlight follows the pointer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: spotlight }}
      />

      {/* Floating foods — they wander on their own and drift with the cursor */}
      {slots.map((food, index) =>
        food ? (
          <ParallaxLayer
            key={`${food.id}-${index}`}
            parallax={parallax}
            depth={SLOTS[index].depth}
            className={`absolute z-10 ${SLOTS[index].className}`}
          >
            <motion.button
              type="button"
              draggable
              title={`${food.name} — drag or tap to add to the cart`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: [0, SLOTS[index].dx, -SLOTS[index].dx * 0.6, 0],
                y: [0, -SLOTS[index].dy, SLOTS[index].dy * 0.5, 0],
                rotate: [0, 4, -4, 0],
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                x: { duration: SLOTS[index].duration * 1.4, repeat: Infinity, ease: "easeInOut" },
                y: { duration: SLOTS[index].duration, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: SLOTS[index].duration * 1.8, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              onDragStartCapture={(event) => {
                const data = (event as unknown as React.DragEvent<HTMLButtonElement>)
                  .dataTransfer;
                data.setData("text/food-slot", `${food.id}:${index}`);
                data.effectAllowed = "copy";
              }}
              onClick={() => collect(food, index)}
              className="focus-ring grid size-12 cursor-grab place-items-center rounded-2xl border border-panel/10 bg-panel/6 text-2xl backdrop-blur-md transition-colors active:cursor-grabbing hover:border-panel/30 hover:bg-panel/12"
            >
              {food.emoji}
            </motion.button>
          </ParallaxLayer>
        ) : null,
      )}

      <div className="relative z-20 flex items-start justify-between gap-4">
        <Brand tone="dark" />
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-panel/10 bg-panel/6 px-3.5 py-2 text-xs font-black backdrop-blur-xl"
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
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-6xl leading-[1.02]">
            Your healthier rhythm starts quietly.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/55">
            One private space to notice patterns, celebrate progress, and make
            your next choice with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap gap-2.5"
        >
          {["Nutrition", "Movement", "Sleep", "Groceries", "AI insights"].map((label) => (
            <motion.span
              key={label}
              whileHover={{ y: -3, scale: 1.05, backgroundColor: "rgba(255,255,255,0.14)" }}
              className="cursor-default rounded-full border border-panel/12 bg-panel/6 px-4 py-1.5 text-xs font-bold text-white/75 backdrop-blur-md"
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <p className="relative z-20 text-xs text-white/35">Every choice shapes your health.</p>

      {/* Floating cart — icon only */}
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
          y: [0, -8, 0],
          scale: cartPulse || dragOver ? 1.15 : 1,
          borderColor:
            cartPulse === "good"
              ? "rgba(52, 211, 153, 0.6)"
              : cartPulse === "warn"
                ? "rgba(228, 87, 31, 0.6)"
                : dragOver
                  ? "rgba(182, 168, 255, 0.6)"
                  : "rgba(255, 255, 255, 0.14)",
        }}
        transition={{
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          scale: { type: "spring", stiffness: 300, damping: 18 },
        }}
        className="absolute bottom-[16%] right-[10%] z-20 grid size-16 place-items-center rounded-full border bg-panel/8 shadow-[0_20px_50px_rgba(10,6,30,.5)] backdrop-blur-xl"
      >
        <ShoppingCart size={22} className="text-white/85" />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              key={cartCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-accent text-[10px] font-black text-white shadow-lg"
            >
              {cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Feedback toast near the cart */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`absolute bottom-[7%] right-[6%] z-20 max-w-64 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-[0_18px_45px_rgba(0,0,0,.35)] backdrop-blur-xl ${
              toast.tone === "good"
                ? "border-emerald-400/30 bg-emerald-950/70 text-emerald-100"
                : "border-accent/30 bg-accent-soft/80 text-accent"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

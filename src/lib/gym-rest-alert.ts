/** Browser rest-timer alarm: beep, vibrate, and an optional notification. */

let audioCtx: AudioContext | null = null;
let notifyAsked = false;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx ??= new Ctor();
  return audioCtx;
}

export function unlockGymRestAlert() {
  const audio = ctx();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
}

function beep(at: number, freq: number, duration: number) {
  const audio = ctx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export async function playGymRestAlarm(label?: string) {
  if (typeof window === "undefined") return;
  unlockGymRestAlert();
  const audio = ctx();
  if (audio) {
    const now = audio.currentTime;
    beep(now, 880, 0.18);
    beep(now + 0.22, 1174, 0.22);
  }
  try {
    navigator.vibrate?.([180, 70, 180, 70, 240]);
  } catch {
    // vibration not available
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Rest done — next set", {
        body: label ? `${label} rest is over.` : "Time for your next set.",
        silent: false,
        tag: "vivrant-gym-rest",
      });
    } catch {
      // ignore blocked notifications
    }
  }
}

export function requestGymRestNotifyPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (notifyAsked || Notification.permission !== "default") return;
  notifyAsked = true;
  void Notification.requestPermission();
}

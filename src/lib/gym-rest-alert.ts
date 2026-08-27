/** Browser rest-timer alarm: beep, vibrate, and an optional notification. */

let audioCtx: AudioContext | null = null;
let notifyAsked = false;
let fired = false;
let alarmTimer: number | null = null;
const scheduled: OscillatorNode[] = [];

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
  try {
    const gain = audio.createGain();
    gain.gain.value = 0.0001;
    const osc = audio.createOscillator();
    osc.frequency.value = 440;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.04);
  } catch {
    // unlock best-effort
  }
}

function beep(at: number, freq: number, duration: number): OscillatorNode | null {
  const audio = ctx();
  if (!audio) return null;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.14, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
  scheduled.push(osc);
  return osc;
}

function buzz() {
  try {
    navigator.vibrate?.([180, 70, 180, 70, 240, 80, 320]);
  } catch {
    // vibration not available (desktop browsers)
  }
}

export function cancelGymRestAlarm() {
  fired = false;
  if (alarmTimer != null) {
    window.clearTimeout(alarmTimer);
    alarmTimer = null;
  }
  while (scheduled.length) {
    const osc = scheduled.pop();
    try {
      osc?.stop();
    } catch {
      // already stopped
    }
  }
}

export function scheduleGymRestAlarm(seconds: number, label?: string) {
  if (typeof window === "undefined") return;
  cancelGymRestAlarm();
  unlockGymRestAlert();
  requestGymRestNotifyPermission();
  const audio = ctx();
  const wait = Math.max(0, seconds);
  if (audio) {
    const when = audio.currentTime + wait;
    beep(when, 880, 0.18);
    beep(when + 0.22, 1174, 0.22);
    beep(when + 0.5, 988, 0.28);
  }
  alarmTimer = window.setTimeout(() => {
    alarmTimer = null;
    void playGymRestAlarm(label, { skipBeep: Boolean(audio) });
  }, wait * 1000);
}

export async function playGymRestAlarm(label?: string, opts?: { skipBeep?: boolean }) {
  if (typeof window === "undefined") return;
  if (fired) return;
  fired = true;
  unlockGymRestAlert();
  if (!opts?.skipBeep) {
    const audio = ctx();
    if (audio) {
      const now = audio.currentTime;
      beep(now, 880, 0.18);
      beep(now + 0.22, 1174, 0.22);
      beep(now + 0.5, 988, 0.28);
    }
  }
  buzz();
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Rest done — next set", {
        body: label ? `${label} rest is over.` : "Time for your next set.",
        silent: false,
        tag: "vivrant-gym-rest",
        vibrate: [180, 70, 180, 70, 240],
      } as NotificationOptions);
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

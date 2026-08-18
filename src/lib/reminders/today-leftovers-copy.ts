export function leftoverReminderCopy(parts: string[]) {
  if (!parts.length) return null;
  return {
    title: "Evening catch-up",
    body: `Still open today: ${parts.join("; ")}. Open Today to check them off.`.slice(0, 500),
  };
}

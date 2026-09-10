"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use client"
// directive only from the entry point — the ones on `ui/Timer.tsx` and
// `lib/useCountdown.ts` behind this barrel are dropped on the way into dist/. So the
// boundary is declared here, where the built consumer actually sees it. `Timer` holds
// state and an interval, so a Next.js app importing it from a server component without
// this fails at build time.

export { Timer, timerVariants } from "@/molecules/Timer/ui/Timer";
export type { TimerProps } from "@/molecules/Timer/ui/Timer";

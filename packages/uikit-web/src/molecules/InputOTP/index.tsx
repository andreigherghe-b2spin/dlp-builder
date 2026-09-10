"use client";

// tsup bundles this whole directory into one entry, and esbuild keeps a "use
// client" directive only from the entry point — the ones on the files behind
// this barrel are dropped on the way into dist/. So the boundary is declared
// here, where the built consumer actually sees it. Every part reads context and
// the field holds a real input, so none of it is server-renderable anyway.

export { InputOTP, type InputOTPProps } from "@/molecules/InputOTP/ui/InputOTP";
export {
  InputOTPSlot,
  slotVariants,
  type InputOTPSlotProps,
} from "@/molecules/InputOTP/ui/InputOTPSlot";
export { InputOTPGroup } from "@/molecules/InputOTP/ui/InputOTPGroup";
export { InputOTPSeparator } from "@/molecules/InputOTP/ui/InputOTPSeparator";

// The library's, re-exported so a field restricted to digits does not need
// `input-otp` in the consumer's package.json for the sake of one string. They
// are regular-expression sources, not our code, and there is nothing to restyle
// about them — the same reason `Sonner` re-exports `toast` untouched.
export { REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

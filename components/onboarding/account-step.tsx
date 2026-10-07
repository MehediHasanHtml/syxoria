"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { Field } from "@/components/ui/field";
import { account as copy } from "@/content/onboarding";
import { cn } from "@/lib/cn";
import { ServiceError } from "@/services/_client";
import { createAccount, requestPasswordReset, signIn } from "@/services/onboarding";
import type { AccountSession } from "@/types";
import { OnbButton } from "./onboarding-button";
import { BigInput, DemoNote, Notice, PasswordInput, QuietButton, rise, StageHeading } from "./primitives";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Mode = "create" | "signin" | "reset" | "sent";

/**
 * The first moment: the Core, closed and almost dark — Syxoria doesn't know the company yet — and
 * the two things it needs to begin. Creating an account, signing back in and resetting a password
 * all happen here, in place. Once in, the Core rises into the bar (a shared element, "syx-core").
 */
export function AccountStep({ initialMode, plan, onAuthenticated }: { initialMode: "create" | "signin"; plan: string | null; onAuthenticated: (s: AccountSession) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<{ text: string; switchTo?: Mode } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const rules = copy.passwordRules.map((r) => ({ ...r, ok: r.test(password) }));
  const head = mode === "create" ? copy.create : mode === "signin" ? copy.signin : mode === "reset" ? copy.reset : copy.sent;

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (!EMAIL.test(email.trim())) err.email = "Enter a valid email address.";
    if (mode === "create" && !rules.every((r) => r.ok)) err.password = "Your password doesn’t meet all three requirements yet.";
    if (mode === "signin" && !password) err.password = "Enter your password.";
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      if (mode === "reset") {
        await requestPasswordReset(email.trim());
        setBusy(false);
        setMode("sent");
        return;
      }
      if (mode === "create") {
        const session = await createAccount({ email: email.trim(), password });
        setDone("Your workspace is ready.");
        setTimeout(() => onAuthenticated(session), 800);
        return;
      }
      const { onboarded, ...session } = await signIn({ email: email.trim(), password });
      if (onboarded) {
        setDone(`Welcome back${session.firstName ? `, ${session.firstName}` : ""}. Opening Syxoria…`);
        router.push("/app");
        return;
      }
      setDone("Welcome back. Let’s finish where you left off.");
      setTimeout(() => onAuthenticated(session), 800);
    } catch (error) {
      setBusy(false);
      if (error instanceof ServiceError && error.code === "validation") setFormError({ text: error.message, switchTo: "signin" });
      else if (error instanceof ServiceError) setFormError({ text: error.message });
      else setFormError({ text: "Something interrupted us. Nothing was lost — please try again." });
    }
  }

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      {/* the Core, closed: it doesn't know the company yet */}
      <span className="onb-rise onb-core-rest mb-8 block w-fit">
        <SyxoriaCore state={busy || done ? "initializing" : "dormant"} intensity={1.6} vtName="syx-core" label="Syxoria" className="w-[clamp(4.75rem,2.5rem+5vh,6.75rem)]" />
      </span>
      <div>
        <StageHeading key={mode} lead={head.lead} accent={head.accent}>
          {head.body}
        </StageHeading>
        {plan && mode === "create" && (
          <p className="onb-rise mt-3 text-[13px] text-fg-3" style={rise(2)}>
            Plan: <span className="text-fg-2">{plan}</span> · 14 days free, no card
          </p>
        )}

        {mode === "sent" ? (
          <div className="onb-rise mt-8" style={rise(2)}>
            <Notice tone="success">
              We sent it to <span className="text-fg">{email}</span>. The link stays valid for one hour.
            </Notice>
            <QuietButton className="mt-6" onClick={() => switchMode("signin")}>
              Back to sign in
            </QuietButton>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className="mt-8 grid gap-5" aria-busy={busy || undefined}>
            {formError && (
              <Notice
                tone="error"
                action={
                  formError.switchTo ? (
                    <QuietButton onClick={() => switchMode(formError.switchTo!)} className="text-fg">
                      Sign in instead
                    </QuietButton>
                  ) : undefined
                }
              >
                {formError.text}
              </Notice>
            )}
            <div className="onb-rise" style={rise(2)}>
              <Field label="Email" error={errors.email}>
                <BigInput type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} placeholder="you@company.com" />
              </Field>
            </div>

            {mode !== "reset" && (
              <div className="onb-rise" style={rise(3)}>
                <Field
                  label="Password"
                  error={errors.password}
                  labelAction={
                    mode === "signin" ? (
                      <button type="button" onClick={() => switchMode("reset")} className="text-xs text-fg-3 transition-colors hover:text-fg">
                        Forgot password?
                      </button>
                    ) : undefined
                  }
                >
                  <PasswordInput autoComplete={mode === "create" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
                </Field>
                {mode === "create" && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Password requirements">
                    {rules.map((r) => (
                      <li key={r.id} className={cn("flex items-center gap-1.5 text-xs transition-colors duration-300", r.ok ? "text-accent-strong" : "text-fg-3")}>
                        <Check className={cn("size-3.5 transition-opacity", !r.ok && "opacity-30")} aria-hidden="true" />
                        {r.label}
                        <span className="sr-only">{r.ok ? "(met)" : "(not met)"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="onb-rise mt-2 grid gap-5" style={rise(4)}>
              {done ? (
                <Notice tone="success">{done}</Notice>
              ) : (
                <OnbButton type="submit" busy={busy} className="w-full">
                  {busy
                    ? mode === "create"
                      ? "Creating your workspace"
                      : mode === "signin"
                        ? "Signing in"
                        : "Sending the link"
                    : mode === "create"
                      ? "Create my workspace"
                      : mode === "signin"
                        ? "Sign in"
                        : "Send me a link"}
                </OnbButton>
              )}
              <p className="text-[13.5px] text-fg-3">
                {mode === "create" ? (
                  <>
                    Already have an account?{" "}
                    <QuietButton onClick={() => switchMode("signin")} disabled={busy} className="text-fg-2">
                      Sign in
                    </QuietButton>
                  </>
                ) : (
                  <>
                    New to Syxoria?{" "}
                    <QuietButton onClick={() => switchMode("create")} disabled={busy} className="text-fg-2">
                      Create an account
                    </QuietButton>
                  </>
                )}
              </p>
            </div>
            {mode === "create" && (
              <p className="text-[12px] leading-relaxed text-fg-3">
                By continuing you agree to the{" "}
                <Link href="/legal/terms" className="underline decoration-white/15 underline-offset-2 hover:text-fg">
                  Terms
                </Link>{" "}
                and the{" "}
                <Link href="/legal/privacy" className="underline decoration-white/15 underline-offset-2 hover:text-fg">
                  Privacy policy
                </Link>
                .
              </p>
            )}
          </form>
        )}
      </div>
      <DemoNote lines={copy.demo} />
    </div>
  );
}

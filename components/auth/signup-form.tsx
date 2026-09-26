"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowNudge, Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ServiceError } from "@/services/_client";
import { signUp, type SignUpInput } from "@/services/auth";
import type { PricingPlan } from "@/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Errors = Partial<Record<keyof SignUpInput | "terms", string>>;

export function SignupForm({ plan }: { plan: PricingPlan | null }) {
  const router = useRouter();
  const [v, setV] = useState<SignUpInput>({ name: "", company: "", email: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof SignUpInput) => (e: ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const pwChecks = [
    { ok: v.password.length >= 10, label: "10+ characters" },
    { ok: /\d/.test(v.password), label: "A number" },
    { ok: /[A-Z]/.test(v.password), label: "An upper-case letter" },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: Errors = {};
    if (!v.name.trim()) err.name = "Tell us your name.";
    if (!v.company.trim()) err.company = "Your company name is required.";
    if (!EMAIL.test(v.email)) err.email = "Enter a valid work email.";
    if (!pwChecks.every((c) => c.ok)) err.password = "Your password doesn’t meet all requirements yet.";
    if (!terms) err.terms = "Please accept the terms to continue.";
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      await signUp(v);
      router.push("/app");
    } catch (error) {
      if (error instanceof ServiceError && error.code === "validation") setErrors({ email: error.message });
      else setFormError("We couldn’t create your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="animate-fade-in">
      <h1 className="text-2xl font-medium tracking-tight text-fg sm:text-[28px]">Create your workspace</h1>
      <p className="mt-2 text-sm text-fg-2">14 days free · all six modules · no credit card.</p>
      {plan && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-sm border border-accent-line bg-accent-soft px-2.5 py-1.5 text-xs text-accent-strong">
          Selected plan: {plan.name}
          <Link href="/#pricing" className="text-fg-2 underline underline-offset-2 hover:text-fg">
            Change
          </Link>
        </p>
      )}
      {formError && (
        <p role="alert" className="mt-6 rounded-md border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-[13px] text-negative">
          {formError}
        </p>
      )}
      <div className="mt-8 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <Input autoComplete="name" value={v.name} onChange={set("name")} disabled={loading} />
          </Field>
          <Field label="Company" error={errors.company}>
            <Input autoComplete="organization" value={v.company} onChange={set("company")} disabled={loading} />
          </Field>
        </div>
        <Field label="Work email" error={errors.email} hint="Tip: taken@… shows the “already registered” state.">
          <Input type="email" autoComplete="email" value={v.email} onChange={set("email")} disabled={loading} />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input type="password" autoComplete="new-password" value={v.password} onChange={set("password")} disabled={loading} />
        </Field>
        <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Password requirements">
          {pwChecks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-1.5 text-xs transition-colors", c.ok ? "text-positive" : "text-fg-3")}>
              <Check className={cn("size-3.5", !c.ok && "opacity-30")} aria-hidden="true" />
              {c.label}
              <span className="sr-only">{c.ok ? "(met)" : "(not met)"}</span>
            </li>
          ))}
        </ul>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-fg-2">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={Boolean(errors.terms) || undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
              disabled={loading}
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="text-fg underline decoration-line-strong underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-fg underline decoration-line-strong underline-offset-2">
                Privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-2 text-[13px] text-negative">
              {errors.terms}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" loading={loading} loadingLabel="Creating your workspace" className="mt-1">
          Create my account
          <ArrowNudge />
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-fg-3">
        Already have an account?{" "}
        <Link href="/login" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}

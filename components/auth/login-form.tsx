"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ArrowNudge, Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ServiceError, simulateLatency } from "@/services/_client";
import { signIn } from "@/services/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset" | "reset-sent">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (!EMAIL.test(email)) err.email = "Enter a valid email address.";
    if (!password) err.password = "Enter your password.";
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      await signIn({ email, password });
      router.push("/app");
    } catch (error) {
      setFormError(error instanceof ServiceError ? error.message : "Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setLoading(true);
    await simulateLatency(); // TODO(auth): request password reset email
    setLoading(false);
    setMode("reset-sent");
  }

  if (mode === "reset-sent") {
    return (
      <div className="animate-fade-in" role="status">
        <span className="grid size-11 place-items-center rounded-full border border-accent-line bg-accent-soft text-accent">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-medium tracking-tight text-fg">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-2">
          If an account exists for <span className="text-fg">{email}</span>, you’ll receive a link to reset your password within a few minutes.
        </p>
        <Button variant="outline" className="mt-8 w-full" onClick={() => setMode("signin")}>
          <ArrowLeft aria-hidden="true" /> Back to sign in
        </Button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <form noValidate onSubmit={onReset} className="animate-fade-in">
        <h1 className="text-2xl font-medium tracking-tight text-fg">Reset your password</h1>
        <p className="mt-2 text-sm text-fg-2">We’ll email you a secure link.</p>
        <div className="mt-8 grid gap-5">
          <Field label="Email" error={errors.email}>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} autoFocus />
          </Field>
          <Button type="submit" size="lg" loading={loading} loadingLabel="Sending link">
            Send reset link
          </Button>
          <Button variant="ghost" onClick={() => setMode("signin")} disabled={loading}>
            <ArrowLeft aria-hidden="true" /> Back to sign in
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={onSignIn} className="animate-fade-in">
      <h1 className="text-2xl font-medium tracking-tight text-fg sm:text-[28px]">Welcome back</h1>
      <p className="mt-2 text-sm text-fg-2">Sign in to your workspace.</p>
      {formError && (
        <p role="alert" className="mt-6 rounded-md border border-negative/30 bg-negative-soft px-3.5 py-2.5 text-[13px] text-negative">
          {formError}
        </p>
      )}
      <div className="mt-8 grid gap-5">
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder="you@company.com" />
        </Field>
        <Field
          label="Password"
          error={errors.password}
          hint="Demo: any password with 8+ characters signs in."
          labelAction={
            <button type="button" onClick={() => setMode("reset")} className="text-xs text-fg-3 transition-colors hover:text-fg">
              Forgot password?
            </button>
          }
        >
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </Field>
        <Button type="submit" size="lg" loading={loading} loadingLabel="Signing in" className="mt-1">
          Sign in
          <ArrowNudge />
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-fg-3">
        New to Syxoria?{" "}
        <Link href="/signup" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
          Create an account
        </Link>
      </p>
    </form>
  );
}

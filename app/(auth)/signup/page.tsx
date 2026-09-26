import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { pricing } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start your 14-day Syxoria trial. All six modules, no credit card.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { plan } = await searchParams;
  const selected = pricing.plans.find((p) => p.id === plan && p.price.monthly !== null) ?? null;
  return <SignupForm plan={selected} />;
}

import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Official brand marks for integrations, served from /public/integrations.
 * Sources: svgl.app and Simple Icons (HubSpot, Stripe). Use them only to show that
 * Syxoria connects to these tools, per each brand's guidelines.
 */
const logos: Record<string, string> = {
  gmail: "/integrations/gmail.svg",
  outlook: "/integrations/outlook.svg",
  slack: "/integrations/slack.svg",
  drive: "/integrations/drive.svg",
  notion: "/integrations/notion.svg",
  excel: "/integrations/excel.svg",
  hubspot: "/integrations/hubspot.svg",
  salesforce: "/integrations/salesforce.svg",
  stripe: "/integrations/stripe.svg",
  paypal: "/integrations/paypal.svg",
};

export function IntegrationLogo({ id, size = 24, className }: { id: string; size?: number; className?: string }) {
  const src = logos[id];
  if (!src) return null;
  // Decorative: the tool's name is always rendered next to the mark.
  return <Image src={src} alt="" width={size} height={size} className={cn("shrink-0 object-contain", className)} style={{ width: size, height: size }} />;
}

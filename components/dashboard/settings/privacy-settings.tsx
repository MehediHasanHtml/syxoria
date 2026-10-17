"use client";

import { Download, MapPin, ScrollText } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "./settings-section";

/**
 * Privacy: where the company's data lives, how long Syxoria keeps what it reads, the guarantee that
 * it never trains shared models, the record of who did what, and a full export.
 */
export function PrivacySettings() {
  const [retention, setRetention] = useState("24 months");
  const [summaries, setSummaries] = useState(true);
  const [exported, setExported] = useState(false);

  return (
    <>
      <SettingsSection title="Your data" description="Where it is kept, and for how long.">
        <ul className="grid gap-3">
          <li className="flex items-start gap-3 rounded-lg border border-line px-4 py-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 text-fg-3" />
            <span>
              <span className="block text-[13px] text-fg">Stored in the European Union</span>
              <span className="block text-[12.5px] text-fg-3">Paris and Frankfurt data centres. Encrypted at rest and in transit.</span>
            </span>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
            <span>
              <span className="block text-[13px] text-fg">Keep what Syxoria reads for</span>
              <span className="block text-[12.5px] text-fg-3">Emails and documents older than this are forgotten. The memory keeps only what you confirm.</span>
            </span>
            <label className="ws-select">
              <span className="sr-only">Retention</span>
              <select value={retention} onChange={(e) => setRetention(e.target.value)}>
                {["6 months", "12 months", "24 months", "As long as connected"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </li>
        </ul>
      </SettingsSection>

      <SettingsSection title="How Syxoria uses it" description="Only to work for your company.">
        <div className="grid gap-4">
          <Switch checked disabled onCheckedChange={() => undefined} label="Never used to train shared models" description="Your data stays yours. This cannot be turned off." />
          <Switch checked={summaries} onCheckedChange={setSummaries} label="Keep conversation summaries" description="So the assistant remembers context from one conversation to the next." />
        </div>
      </SettingsSection>

      <SettingsSection title="Accountability" description="A complete record of who did what, Syxoria included.">
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/app/history" size="sm" variant="secondary">
            <ScrollText aria-hidden="true" />
            Open the activity record
          </ButtonLink>
          <Button size="sm" variant="secondary" onClick={() => setExported(true)}>
            <Download aria-hidden="true" />
            Export all company data
          </Button>
        </div>
        {exported && <p className="ax-preview">Preview: in the product, a complete export is prepared and sent to the owner’s address.</p>}
      </SettingsSection>
    </>
  );
}

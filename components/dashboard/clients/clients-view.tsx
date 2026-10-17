"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, Lightbulb, Mail, Phone, Plus, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { INTERACTION } from "@/components/dashboard/business/sales-view";
import { ActionState, Chip, KpiRow, Mark, Panel, WsHead, euro, type ChipTone } from "@/components/dashboard/ws/kit";
import { Button } from "@/components/ui/button";
import type { BriefingActionStatus } from "@/types";
import type { CalendarEvent, Client, ClientHealth } from "@/types/workspace";

export const HEALTH: Record<ClientHealth, { word: string; tone: ChipTone }> = {
  strong: { word: "Strong", tone: "emerald" },
  steady: { word: "Steady", tone: "neutral" },
  attention: { word: "Needs attention", tone: "owner" },
  risk: { word: "At risk", tone: "warn" },
};
type Tab = "all" | "client" | "prospect" | "attention";
const needs = (c: Client) => c.health === "attention" || c.health === "risk";

/**
 * Clients & Prospects: every relationship with where it stands, the last thing that happened and
 * the next, and Syxoria's suggestion for it; one opened as a profile (contact, opportunities,
 * history, documents, what to do next); the meetings coming up; and the relationships that need
 * the owner first. Search and filters narrow the list; the profile follows the address (?client=).
 */
export function ClientsView({ clients, events, statuses, initial, initialTab }: { clients: Client[]; events: CalendarEvent[]; statuses: Record<string, BriefingActionStatus>; initial?: string; initialTab?: Tab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(initialTab ?? "all");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("Everyone");
  const [open, setOpen] = useState(initial && clients.some((c) => c.id === initial) ? initial : ((initialTab === "attention" ? clients.find(needs)?.id : undefined) ?? clients[0].id));
  const owners = ["Everyone", ...Array.from(new Set(clients.map((c) => c.owner)))];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        (tab === "all" || (tab === "attention" ? needs(c) : c.kind === tab)) &&
        (owner === "Everyone" || c.owner === owner) &&
        (!q || [c.name, c.contact.name, c.sector, c.city, c.status].some((v) => v.toLowerCase().includes(q))),
    );
  }, [clients, tab, query, owner]);

  const client = clients.find((c) => c.id === open) ?? clients[0];
  const choose = (id: string) => {
    setOpen(id);
    router.replace(`${pathname}?client=${id}`, { scroll: false });
  };
  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "all", label: "All", n: clients.length },
    { id: "client", label: "Clients", n: clients.filter((c) => c.kind === "client").length },
    { id: "prospect", label: "Prospects", n: clients.filter((c) => c.kind === "prospect").length },
    { id: "attention", label: "Needs attention", n: clients.filter(needs).length },
  ];
  const attention = clients.filter(needs);
  const coming = events.filter((e) => e.kind === "meeting" || e.kind === "call" || e.kind === "follow-up");

  return (
    <div className="ws">
      <WsHead eyebrow="Business" title="Clients & Prospects" lead="The relationships that matter most, where each one stands, and what should happen next.">
        <Button variant="secondary" size="sm">
          <Plus aria-hidden="true" />
          Add a contact
        </Button>
      </WsHead>

      <KpiRow
        label="Relationships at a glance"
        items={[
          { id: "c", label: "Active clients", value: String(tabs[1].n), caption: `${euro(clients.reduce((n, c) => n + (c.lifetime ?? 0), 0))} earned with them`, delta: { text: "2 contracts signed this month", direction: "up", good: true } },
          { id: "p", label: "Prospects", value: String(tabs[2].n), caption: `${euro(clients.filter((c) => c.kind === "prospect").reduce((n, c) => n + c.value, 0))} in open opportunities`, delta: { text: "1 new lead yesterday", direction: "up", good: true } },
          { id: "a", label: "Need attention", value: String(attention.length), caption: "quiet, overdue or returned", delta: { text: "2 more than last week", direction: "up", good: false } },
          { id: "m", label: "Coming up", value: String(coming.length), caption: "calls, meetings and follow ups", delta: { text: "Next: tomorrow 9:30", direction: "up", good: true } },
        ]}
      />

      <div className="ws-toolbar">
        <div role="tablist" aria-label="Show" className="ws-subnav ws-subnav--flat">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              <span className="ws-count">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="ws-toolbar__tools">
          <label className="ws-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search clients and prospects</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a name, a sector, a city" />
          </label>
          <label className="ws-select">
            <span className="sr-only">Owner</span>
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {owners.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="ws-grid ws-grid--wide">
        <Panel title="Relationships" meta={`${list.length} shown`}>
          {list.length === 0 ? (
            <p className="ws-empty">Nothing matches. Try another name, or show everyone.</p>
          ) : (
            <ul className="ws-people" role="listbox" aria-label="Open a profile">
              {list.map((c) => (
                <li key={c.id} role="option" aria-selected={c.id === open}>
                  <button type="button" onClick={() => choose(c.id)} className="ws-person">
                    <Mark name={c.name} tone={c.health === "risk" ? "warn" : c.health === "strong" ? "emerald" : undefined} />
                    <span className="ws-person__main">
                      <span className="ws-person__name">
                        {c.name}
                        <span className="ws-person__kind">{c.kind === "client" ? "Client" : "Prospect"}</span>
                      </span>
                      <span className="ws-person__sub">
                        {c.contact.name} · {c.sector}, {c.city}
                      </span>
                    </span>
                    <span className="ws-person__status ws-hide-sm">
                      <span>{c.status}</span>
                      <span className="ws-person__sub">{c.last.at}</span>
                    </span>
                    <span className="ws-person__value tabular ws-hide-md">{euro(c.value)}</span>
                    <Chip tone={HEALTH[c.health].tone}>{HEALTH[c.health].word}</Chip>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Profile" meta={client.kind === "client" ? "Client" : "Prospect"}>
          <article key={client.id} className="ws-profile">
            <header className="ws-profile__head">
              <Mark name={client.name} tone={client.health === "risk" ? "warn" : client.health === "strong" ? "emerald" : undefined} />
              <div className="min-w-0">
                <h2 className="ws-profile__name">{client.name}</h2>
                <p className="ws-profile__sub">
                  {client.sector} · {client.city} · {client.since}
                </p>
              </div>
              <Chip tone={HEALTH[client.health].tone}>{HEALTH[client.health].word}</Chip>
            </header>

            <dl className="ws-facts ws-facts--4">
              <div>
                <dt>Status</dt>
                <dd>{client.status}</dd>
              </div>
              <div>
                <dt>{client.kind === "client" ? "Open value" : "Potential"}</dt>
                <dd className="tabular">{euro(client.value)}</dd>
              </div>
              {client.lifetime !== undefined && (
                <div>
                  <dt>Earned to date</dt>
                  <dd className="tabular">{euro(client.lifetime)}</dd>
                </div>
              )}
              <div>
                <dt>Owner</dt>
                <dd>{client.owner}</dd>
              </div>
            </dl>

            <div className="ws-contact">
              <span className="ws-contact__who">
                <UserRound aria-hidden="true" />
                {client.contact.name}, {client.contact.role}
              </span>
              <a href={`mailto:${client.contact.email}`}>
                <Mail aria-hidden="true" />
                {client.contact.email}
              </a>
              <a href={`tel:${client.contact.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" />
                {client.contact.phone}
              </a>
            </div>

            <div className="ws-nextup">
              <p>
                <span className="bd-label">Last</span>
                <span>{client.last.text}</span>
                <span className="ws-cell-sub">{client.last.at}</span>
              </p>
              <p>
                <span className="bd-label">Next</span>
                <span>{client.next.text}</span>
                <span className="ws-cell-sub">{client.next.at}</span>
              </p>
            </div>

            {client.recommendation && (
              <div className="ws-suggest">
                <p className="ws-suggest__label">
                  <Lightbulb aria-hidden="true" strokeWidth={1.7} />
                  Syxoria suggests
                </p>
                <p className="ws-suggest__title">{client.recommendation.title}</p>
                <p className="ws-suggest__why">{client.recommendation.why}</p>
                <p className="ws-suggest__meta">
                  {client.recommendation.actionId && statuses[client.recommendation.actionId] && <ActionState status={statuses[client.recommendation.actionId]} />}
                  <span>{client.recommendation.approval ? "Needs your approval" : "No approval needed"}</span>
                  {client.recommendation.actionId && (
                    <Link href={`/app/actions?action=${client.recommendation.actionId}`} className="ws-link">
                      Review the action
                    </Link>
                  )}
                </p>
              </div>
            )}

            {client.opportunities.length > 0 && (
              <section className="ws-profile__block">
                <h3 className="bd-label">Open opportunities</h3>
                <ul>
                  {client.opportunities.map((o) => (
                    <li key={o.name} className="ws-profile__line">
                      <span>{o.name}</span>
                      <Chip>{o.stage}</Chip>
                      <span className="tabular">{euro(o.value)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="ws-profile__block">
              <h3 className="bd-label">Relationship history</h3>
              <ol className="ws-timeline ws-timeline--tight">
                {client.timeline.map((t) => {
                  const Icon = INTERACTION[t.kind];
                  return (
                    <li key={t.at + t.text}>
                      <span className="ws-timeline__icon" aria-hidden="true">
                        <Icon strokeWidth={1.7} />
                      </span>
                      <span className="ws-timeline__title">{t.text}</span>
                      <span className="ws-timeline__at tabular">{t.at}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {client.documents.length > 0 && (
              <section className="ws-profile__block">
                <h3 className="bd-label">Documents</h3>
                <ul>
                  {client.documents.map((d) => (
                    <li key={d.name} className="ws-profile__line">
                      <Link href="/app/documents" className="ws-link">
                        {d.name}
                      </Link>
                      <span className="ws-cell-sub">{d.type}</span>
                      <span className="ws-cell-sub">{d.date}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </Panel>
      </div>

      <div className="ws-grid ws-grid--half">
        <Panel title="Upcoming meetings and follow ups" link={{ href: "/app", label: "Your agenda" }}>
          <ul className="ws-agenda">
            {coming.map((e) => (
              <li key={e.id}>
                <Link href={e.href} className="ws-agenda__item">
                  <span className="ws-agenda__when">
                    <span>{e.day}</span>
                    <span className="tabular">{e.time}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="ws-row__title">{e.title}</span>
                    <span className="ws-row__detail">{[e.with, e.note].filter(Boolean).join(" · ")}</span>
                  </span>
                  <CalendarClock aria-hidden="true" className="ws-agenda__icon" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Needs your attention first" meta={`${attention.length} relationships`}>
          <ul className="ws-rows">
            {attention.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => choose(c.id)} className="ws-row w-full text-left">
                  <Mark name={c.name} tone={c.health === "risk" ? "warn" : undefined} />
                  <span className="min-w-0">
                    <span className="ws-row__title">{c.name}</span>
                    <span className="ws-row__detail">{c.attention ?? c.status}</span>
                  </span>
                  <span className="ws-row__value tabular">{euro(c.value)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

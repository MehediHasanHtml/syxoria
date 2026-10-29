"use client";

import Link from "next/link";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { STATUS_ORDER, StatusIcon } from "@/components/briefing/marks";
import { ActionState } from "@/components/dashboard/ws/kit";
import { assistant as copy } from "@/content/assistant";
import { AUTONOMY_HREF } from "@/lib/app-nav";
import type { BriefingActionStatus } from "@/types";
import type { CalendarEvent, Conversation, MemoryItem, WorkspaceAction } from "@/types/workspace";
import type { AssistantData } from "./data";

/** A conversation as the owner sees it in the rail: where it stands, read from its actions */
export type Thread = Conversation & { fresh?: boolean };

const NEEDS: BriefingActionStatus[] = ["unsuccessful", "awaiting-approval", "drafted"];
const FOLLOWING: BriefingActionStatus[] = ["approved", "scheduled", "in-progress", "sent", "suggested"];
const pressing = (statuses: BriefingActionStatus[]) => [...statuses].sort((a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b))[0];
const when = (c: Conversation) => (c.group === "Yesterday" ? "Yesterday" : c.updated);

/**
 * Between us: the conversations as shared work rather than a history. What waits for the owner
 * first, then what Syxoria is following up, then what was simply talked through. On narrow
 * screens it opens over the page.
 */
export function Threads({
  threads,
  open,
  statusOf,
  onOpen,
  onNew,
  drawer,
  onClose,
}: {
  threads: Thread[];
  open: string | null;
  statusOf: (id: string) => BriefingActionStatus | undefined;
  onOpen: (id: string) => void;
  onNew: () => void;
  drawer: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");
  const shown = threads.filter((t) => t.title.toLowerCase().includes(filter.trim().toLowerCase()));
  const state = (t: Thread) => pressing(t.actions.map(statusOf).filter(Boolean) as BriefingActionStatus[]);
  const groups = [
    { id: "now", label: copy.threads.groups.now, items: shown.filter((t) => t.fresh) },
    { id: "needs", label: copy.threads.groups.needs, items: shown.filter((t) => !t.fresh && NEEDS.includes(state(t))) },
    { id: "following", label: copy.threads.groups.following, items: shown.filter((t) => !t.fresh && FOLLOWING.includes(state(t))) },
    { id: "done", label: copy.threads.groups.done, items: shown.filter((t) => !t.fresh && !NEEDS.includes(state(t)) && !FOLLOWING.includes(state(t))) },
  ].filter((g) => g.items.length);

  return (
    <aside className="ar-threads" data-open={drawer || undefined} aria-label={copy.threads.open}>
      <div className="ar-threads__head">
        <h2 className="cx-label">{copy.threads.title}</h2>
        <button type="button" className="ar-threads__close" onClick={onClose}>
          <X aria-hidden="true" />
          <span className="sr-only">{copy.threads.close}</span>
        </button>
      </div>
      <button type="button" className="ar-new" onClick={onNew} aria-current={open === null ? "true" : undefined}>
        <Plus aria-hidden="true" />
        {copy.threads.newConversation}
      </button>
      <label className="ar-find">
        <Search aria-hidden="true" />
        <span className="sr-only">{copy.threads.search}</span>
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={copy.threads.search} />
      </label>
      <div className="ar-threads__list">
        {groups.length ? (
          groups.map((g) => (
            <section key={g.id}>
              <h3 className="ar-threads__group">{g.label}</h3>
              <ul>
                {g.items.map((t) => {
                  const s = state(t);
                  return (
                    <li key={t.id}>
                      <button type="button" className="ar-convo" aria-current={t.id === open ? "true" : undefined} onClick={() => onOpen(t.id)}>
                        <span className="ar-convo__title">{t.title}</span>
                        <span className="ar-convo__meta">
                          {t.fresh ? <span /> : s && (NEEDS.includes(s) || FOLLOWING.includes(s)) ? <ActionState status={s} /> : <span>{copy.threads.settled}</span>}
                          <span className="tabular">{when(t)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        ) : (
          <p className="ar-quiet">{copy.threads.none}</p>
        )}
      </div>
    </aside>
  );
}

/**
 * On the table: what the conversation in view is about (the people, what was set in motion and
 * what Syxoria remembered to answer), or before any conversation, what is coming up. Under it,
 * always, the rules Syxoria works under: the reason it can be trusted to act.
 */
export function Table({
  people,
  actions,
  recalls,
  events,
  isHeld,
  thread,
}: {
  people: AssistantData["people"];
  actions: WorkspaceAction[];
  recalls: MemoryItem[];
  events: CalendarEvent[];
  isHeld: (id: string) => boolean;
  thread: boolean;
}) {
  return (
    <div className="ar-table__in">
      <h2 className="ar-table__title">{copy.table.title}</h2>
      {thread ? (
        <>
          {people.length > 0 && (
            <section>
              <h3 className="cx-label">{copy.table.people}</h3>
              <ul className="ar-people">
                {people.map((p) => (
                  <li key={p.id}>
                    <Link href={p.href}>
                      <span className="ar-people__initials" aria-hidden="true">
                        {p.name
                          .split(" ")
                          .filter((w) => /^[A-ZÀ-Ý]/.test(w))
                          .slice(-2)
                          .map((w) => w[0])
                          .join("")}
                      </span>
                      <span className="min-w-0">
                        <span className="ar-people__name">{p.name}</span>
                        <span className="ar-people__where">
                          {p.company} · {p.status}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {actions.length > 0 && (
            <section>
              <h3 className="cx-label">{copy.table.actions}</h3>
              <ul className="ar-moves">
                {actions.map((a) => (
                  <li key={a.id}>
                    <Link href={`/app/actions?action=${a.id}`}>
                      <StatusIcon status={a.status} />
                      <span className="min-w-0">
                        <span className="ar-moves__title">{a.title}</span>
                        <ActionState status={a.status} held={isHeld(a.id)} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!people.length && !actions.length && !recalls.length && <p className="ar-quiet ar-quiet--table">{copy.table.empty}</p>}
          {recalls.length > 0 && (
            <section>
              <h3 className="cx-label">{copy.table.recalls}</h3>
              <ul className="ar-recalls">
                {recalls.map((m) => (
                  <li key={m.id}>
                    {m.text}
                    <span>{m.source}</span>
                  </li>
                ))}
              </ul>
              <Link href="/app/documents" className="ar-more">
                {copy.table.memory}
                <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          )}
        </>
      ) : (
        <section>
          <h3 className="cx-label">{copy.table.coming}</h3>
          <ul className="ar-coming">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={e.href}>
                  <span className="ar-coming__when tabular">
                    {e.day === "Today" ? e.time : `${e.day} ${e.time}`}
                  </span>
                  <span className="min-w-0">
                    <span className="ar-coming__title">{e.title}</span>
                    {e.note && <span className="ar-coming__note">{e.note}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** How we work together: the mode, what Syxoria does alone, what always waits, what it never does */
export function Pact({ mode, own, ask, never, held }: { mode: string; own: string[]; ask: string[]; never: string[]; held: boolean }) {
  return (
    <section className="ar-pact" data-held={held || undefined}>
      <h3 className="cx-label">{copy.agreement.title}</h3>
      {held ? <p className="ar-pact__held">{copy.held}</p> : <p className="ar-pact__mode">{copy.agreement.mode(mode)}</p>}
      <dl>
        <div>
          <dt>{copy.agreement.own}</dt>
          <dd>
            <ul>
              {own.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>{copy.agreement.ask}</dt>
          <dd>
            <ul>
              {ask.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>{copy.agreement.never}</dt>
          <dd>
            <ul>
              {never.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <Link href={AUTONOMY_HREF} className="ar-more">
        {copy.agreement.change}
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

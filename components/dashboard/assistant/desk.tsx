"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle, UserRound } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { StatusIcon } from "@/components/briefing/marks";
import { ActionState } from "@/components/dashboard/ws/kit";
import { assistant as copy } from "@/content/assistant";
import { AUTONOMY_HREF } from "@/lib/app-nav";
import type { Conversation, WorkspaceAction } from "@/types/workspace";
import type { AssistantData } from "./data";
import type { Activity } from "./day";
import { whenOf } from "./day-score";
import { slipNote, TurnView, Working, type Turn } from "./turns";

/** What the desk holds: the day's summary, one item's story, an exchange, or every exchange */
export type DeskMode = { kind: "day" } | { kind: "item"; id: string } | { kind: "exchange"; id: string } | { kind: "history" };

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="sw-back" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      {copy.desk.back}
    </button>
  );
}

function Row({ when, title, children, onClick, on }: { when: string; title: string; children?: ReactNode; onClick: () => void; on?: boolean }) {
  return (
    <li>
      <button type="button" className="sw-row" onClick={onClick} aria-current={on || undefined}>
        <span className="sw-row__when tabular">{when}</span>
        <span className="sw-row__title">{title}</span>
        {children}
      </button>
    </li>
  );
}

/** The day, as the desk sums it up: what waits for the owner, what is planned, the mandate */
export function DeskDay({ items, mode, onFocus, held }: { items: Activity[]; mode: string; onFocus: (id: string) => void; held: boolean }) {
  const waiting = items.filter((i) => i.lane === "deciding" && i.state === "waiting");
  const tonight = items.filter((i) => !i.day && i.state === "ahead");
  const tomorrow = items.filter((i) => i.day);
  return (
    <div className="sw-desk__in">
      <section>
        <h2 className="cx-label">{copy.desk.waiting}</h2>
        {waiting.length ? (
          <ul className="sw-rows">
            {waiting.map((i) => (
              <Row key={i.id} when={copy.desk.waited(i.at)} title={i.title} onClick={() => onFocus(i.id)} />
            ))}
          </ul>
        ) : (
          <p className="sw-quiet">{copy.desk.nothingWaits}</p>
        )}
      </section>
      <section>
        <h2 className="cx-label">{copy.desk.ahead}</h2>
        <ul className="sw-rows sw-rows--ahead">
          {tonight.map((i) => (
            <Row key={i.id} when={i.at} title={i.title} onClick={() => onFocus(i.id)} />
          ))}
          {tomorrow.map((i) => (
            <Row key={i.id} when={`${copy.desk.tomorrow} ${i.at}`} title={i.title} onClick={() => onFocus(i.id)} />
          ))}
        </ul>
      </section>
      <section className="sw-mandate" data-held={held || undefined}>
        <p className="sw-mandate__mode">{held ? copy.now.held : copy.desk.mandate(mode)}</p>
        <p>{held ? copy.statement.held : copy.desk.mandateLine}</p>
        <Link href={AUTONOMY_HREF} className="sw-more">
          {copy.desk.mandateLink}
          <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

/** One item's story: what it is, where it stands, what Syxoria does next, and what can be done about it */
export function DeskItem({
  item,
  action,
  client,
  held,
  onBack,
  onAsk,
  onExchange,
  canAsk,
}: {
  item: Activity;
  action?: WorkspaceAction;
  client?: AssistantData["clients"][number];
  held: boolean;
  onBack: () => void;
  onAsk: (q: string) => void;
  onExchange: (id: string) => void;
  canAsk: boolean;
}) {
  return (
    <div className="sw-desk__in sw-story" key={item.id}>
      <Back onBack={onBack} />
      <p className="sw-story__kicker">
        <span className="sw-story__lane" data-lane={item.lane}>
          {copy.lanes[item.lane].name}
        </span>
        <span className="tabular">{whenOf(item)}</span>
      </p>
      <h2 className="sw-story__title">{item.title}</h2>
      <p className="sw-story__state" data-state={item.state}>
        {copy.states[item.state]}
        {item.by && item.state !== "waiting" && ` · ${copy.decidedBy[item.by]}`}
        {item.horizon && ` · ${copy.until(item.horizon)}`}
      </p>
      <p className="sw-story__detail">{item.detail}</p>

      {item.progress && (
        <div className="sw-progress" role="img" aria-label={`${item.progress.done} of ${item.progress.of}`}>
          <span style={{ width: `${(item.progress.done / item.progress.of) * 100}%` }} />
          <em className="tabular">
            {item.progress.done} of {item.progress.of}
          </em>
        </div>
      )}

      {item.marks && (
        <ul className="sw-moments">
          {item.marks.map((m) => (
            <li key={m.at}>
              <span className="tabular">{m.at}</span>
              {m.label}
            </li>
          ))}
        </ul>
      )}

      {held && <p className="sw-story__held">{copy.desk.held}</p>}

      {item.next && (
        <div className="sw-next">
          <p className="cx-label">{copy.desk.next}</p>
          <p>{item.next}</p>
        </div>
      )}

      {action && (
        <Link href={`/app/actions?action=${action.id}`} className="ar-slip">
          <StatusIcon status={action.status} />
          <span className="ar-slip__text">
            <span className="ar-slip__title">{action.title}</span>
            <span className="ar-slip__meta">
              <ActionState status={action.status} held={held} />
              <span>{slipNote(action)}</span>
            </span>
          </span>
          <span className="ar-slip__go">
            {copy.slip.review}
            <ArrowRight aria-hidden="true" />
          </span>
        </Link>
      )}

      <div className="sw-story__do">
        {item.ask && (
          <button type="button" className="sw-btn sw-btn--ask" onClick={() => onAsk(item.ask!)} disabled={!canAsk}>
            <MessageCircle aria-hidden="true" />
            {copy.desk.ask}
          </button>
        )}
        {item.conversationId && (
          <button type="button" className="sw-btn" onClick={() => onExchange(item.conversationId!)}>
            {copy.desk.exchange}
          </button>
        )}
        {client && (
          <Link href={`/app/clients?client=${client.id}`} className="sw-btn">
            <UserRound aria-hidden="true" />
            {client.contact}, {client.name}
          </Link>
        )}
        {!client && !action && item.href && (
          <Link href={item.href} className="sw-btn">
            {copy.desk.open}
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** An exchange, read like the notes of a conversation between two people */
export function DeskExchange({
  conversation,
  turns,
  work,
  initials,
  action,
  isHeld,
  onBack,
  end,
}: {
  conversation?: Conversation & { fresh?: boolean };
  turns: Turn[];
  work: { reads: string[]; step: number } | null;
  initials: string;
  action: (id: string) => WorkspaceAction | undefined;
  isHeld: (id: string) => boolean;
  onBack: () => void;
  end: RefObject<HTMLDivElement | null>;
}) {
  const first = turns[0]?.at;
  return (
    <div className="sw-desk__in sw-exchange">
      <Back onBack={onBack} />
      <p className="sw-story__kicker">
        <span className="sw-story__lane" data-lane="talk">
          {copy.exchange}
        </span>
        {first && <span className="tabular">{conversation?.group === "Today" ? first : `${conversation?.group === "Yesterday" ? "Yesterday" : conversation?.updated}, ${first}`}</span>}
      </p>
      <h2 className={conversation?.fresh ? "sr-only" : "sw-story__title"}>{conversation?.title}</h2>
      <div className="sw-exchange__turns" aria-live="polite">
        {turns.map((t) => (
          <TurnView key={t.id} turn={t} initials={initials} action={action} isHeld={isHeld} />
        ))}
        {work && <Working reads={work.reads} step={work.step} />}
        <div ref={end} />
      </div>
    </div>
  );
}

/** Every exchange, quietly: today's, yesterday's and the week's */
export function DeskHistory({ conversations, open, onOpen, onBack }: { conversations: Conversation[]; open: string | null; onOpen: (id: string) => void; onBack: () => void }) {
  const groups = (["Today", "Yesterday", "Previous 7 days"] as const).map((g) => ({ g, items: conversations.filter((c) => c.group === g) })).filter((x) => x.items.length);
  return (
    <div className="sw-desk__in">
      <Back onBack={onBack} />
      <h2 className="sw-story__title">{copy.history.title}</h2>
      {groups.map(({ g, items }) => (
        <section key={g}>
          <h3 className="cx-label">{copy.history.groups[g]}</h3>
          <ul className="sw-rows">
            {items.map((c) => (
              <Row key={c.id} when={c.updated} title={c.title} onClick={() => onOpen(c.id)} on={open === c.id} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Check, FileText } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { StatusIcon } from "@/components/briefing/marks";
import { ActionState } from "@/components/dashboard/ws/kit";
import { assistant as copy } from "@/content/assistant";
import type { AssistantBlock, AssistantMessage, WorkspaceAction } from "@/types/workspace";

/** What an action asks of the owner: approval while it waits, nothing once given or never needed */
export const slipNote = (a: WorkspaceAction) =>
  !a.needsApproval ? copy.slip.own : ["suggested", "drafted", "awaiting-approval"].includes(a.status) ? copy.slip.waits : copy.slip.approved;

/** A turn in the conversation; `fresh` when it has just been said, so its words arrive one by one */
export type Turn = AssistantMessage & { tag?: "prepared" | "not-yet"; fresh?: boolean };

/** How long a fresh answer takes to arrive in full, to know when Syxoria has finished speaking */
const WORD = 24;
const BLOCK = 220;
export function arrival(blocks: AssistantBlock[] = []) {
  let at = 0;
  for (const b of blocks) at += b.kind === "text" ? b.text.split(/\s+/).length * WORD + 160 : BLOCK;
  return at;
}

/** The words of a sentence, each carrying its place, so they can be said one after the other */
function Words({ text, from }: { text: string; from: number }) {
  const words = text.split(/\s+/);
  return words.map((w, i) => (
    <span key={i}>
      <span className="ar-w" style={{ "--d": `${from + i * WORD}ms` } as CSSProperties}>
        {w}
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

/**
 * One turn: the owner's few words, or Syxoria's answer said as a colleague would (sentences in
 * Spectral, the figures that matter, what it suggests, the message it wrote, the action it put in
 * motion with its live status, and how it knows).
 */
export function TurnView({ turn, initials, action, isHeld }: { turn: Turn; initials: string; action: (id: string) => WorkspaceAction | undefined; isHeld: (id: string) => boolean }) {
  if (turn.from === "you")
    return (
      <article className="ar-turn" data-from="you" data-fresh={turn.fresh || undefined}>
        <p className="ar-turn__who">
          <span className="ar-initials" aria-hidden="true">
            {initials}
          </span>
          {copy.turn.you}
          <time className="tabular">{turn.at}</time>
        </p>
        <p className="ar-turn__said">{turn.text}</p>
      </article>
    );

  let at = 0;
  return (
    <article className="ar-turn" data-from="syxoria" data-fresh={turn.fresh || undefined}>
      <p className="ar-turn__who">
        <span className="ar-seal" aria-hidden="true" />
        {copy.name}
        <time className="tabular">{turn.at}</time>
        {turn.tag && <span className="cx-tag">{turn.tag === "prepared" ? copy.turn.prepared : copy.turn.notYet}</span>}
      </p>
      <div className="ar-turn__body">
        {turn.blocks?.map((b, i) => {
          const from = at;
          at += b.kind === "text" ? b.text.split(/\s+/).length * WORD + 160 : BLOCK;
          return <Block key={i} block={b} from={from} fresh={!!turn.fresh} action={action} isHeld={isHeld} />;
        })}
      </div>
    </article>
  );
}

function Block({ block, from, fresh, action, isHeld }: { block: AssistantBlock; from: number; fresh: boolean; action: (id: string) => WorkspaceAction | undefined; isHeld: (id: string) => boolean }) {
  const rise = (node: ReactNode, className: string) => (
    <div className={`ar-block ${className}`} style={{ "--d": `${from}ms` } as CSSProperties}>
      {node}
    </div>
  );

  switch (block.kind) {
    case "text":
      return <p className="ar-say">{fresh ? <Words text={block.text} from={from} /> : block.text}</p>;
    case "figures":
      return rise(
        block.items.map((f) => (
          <div key={f.label}>
            <span className="cx-label">{f.label}</span>
            <span className="ar-figures__value tabular">{f.value}</span>
            {f.note && <span className="ar-figures__note">{f.note}</span>}
          </div>
        )),
        "ar-figures",
      );
    case "list":
      return rise(
        <>
          {block.title && <p className="cx-label">{block.title}</p>}
          <ul>
            {block.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </>,
        "ar-points",
      );
    case "draft":
      return rise(
        <figure>
          <figcaption>
            <span className="cx-label">{copy.draft.label}</span>
            <span className="ar-draft__to">
              <span className="sr-only">{copy.draft.to} </span>
              {block.to}
            </span>
            <span className="ar-draft__subject">{block.subject}</span>
          </figcaption>
          <div className="ar-draft__body">
            {block.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </figure>,
        "ar-draft",
      );
    case "action": {
      const a = action(block.actionId);
      if (!a) return null;
      const held = isHeld(a.id);
      return rise(
        <Link href={`/app/actions?action=${a.id}`} className="ar-slip">
          <StatusIcon status={a.status} />
          <span className="ar-slip__text">
            <span className="ar-slip__title">{a.title}</span>
            <span className="ar-slip__meta">
              <ActionState status={a.status} held={held} />
              <span>{slipNote(a)}</span>
            </span>
          </span>
          <span className="ar-slip__go">
            {copy.slip.review}
            <ArrowRight aria-hidden="true" />
          </span>
        </Link>,
        "ar-slip-wrap",
      );
    }
    case "sources":
      return rise(
        <>
          <span className="cx-label">{copy.howIKnow}</span>
          <ul>
            {block.items.map((s) => (
              <li key={s.label + s.detail}>
                <FileText aria-hidden="true" />
                <Link href={s.href}>{s.label}</Link>
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
        </>,
        "ar-know",
      );
  }
}

/** Syxoria at work on the question: what it is reading, one source after another, then writing */
export function Working({ reads, step }: { reads: string[]; step: number }) {
  const lines = [...reads.map((r) => `${copy.reading} ${r}`), copy.writing];
  return (
    <article className="ar-turn ar-working" data-from="syxoria" role="status" aria-live="polite">
      <p className="ar-turn__who">
        <span className="ar-seal" data-busy="" aria-hidden="true" />
        {copy.name}
      </p>
      <ul className="ar-working__steps">
        {lines.map((l, i) =>
          i <= step ? (
            <li key={l} data-state={i < step ? "done" : "now"}>
              {i < step ? <Check aria-hidden="true" /> : <span className="ar-working__dot" aria-hidden="true" />}
              {l}
            </li>
          ) : null,
        )}
      </ul>
    </article>
  );
}

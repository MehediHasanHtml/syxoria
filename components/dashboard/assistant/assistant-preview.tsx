"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { StatusIcon } from "@/components/briefing/marks";
import { dailyBriefing as words } from "@/content/briefing";
import { assistant as copy } from "@/content/assistant";
import type { AssistantSample, BriefingActionItem } from "@/types";

/** A question as typed or as suggested, the same: case, curly apostrophes and the closing mark aside */
const same = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[?.!\s]+$/, "")
    .trim();

type Message =
  | { id: string; from: "you"; text: string }
  | { id: string; from: "syxoria"; sample: AssistantSample }
  | { id: string; from: "syxoria"; unavailable: true };

/**
 * The assistant, before it is connected: one conversation, Syxoria's answers set apart from the
 * owner's words. Only the suggested questions have an answer, and it is a prepared sample (said
 * on it); anything else is told plainly that answers arrive with the assistant. A question asked
 * from the top bar (?q=) opens the conversation. Nothing here acts: actions only link to where
 * they are reviewed. Styles: "ASSISTANT" in globals.css.
 */
export function AssistantPreview({ samples, actions, initial }: { samples: AssistantSample[]; actions: BriefingActionItem[]; initial?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const seq = useRef(0);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const sample = samples.find((s) => same(s.question) === same(q));
    seq.current += 1;
    const n = seq.current;
    setMessages((m) => [...m, { id: `you-${n}`, from: "you", text: q }]);
    setThinking(true);
    // a short pause, so the answer reads as a reply
    setTimeout(() => {
      setMessages((m) => [...m, sample ? { id: `sx-${n}`, from: "syxoria", sample } : { id: `sx-${n}`, from: "syxoria", unavailable: true }]);
      setThinking(false);
    }, 650);
  };

  useEffect(() => {
    if (initial && !asked.current) {
      asked.current = true;
      ask(initial);
    }
    // the question from the top bar is asked once, when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ask(field.current?.value ?? "");
    if (field.current) field.current.value = "";
  };
  const open = new Set(messages.flatMap((m) => (m.from === "you" ? [same(m.text)] : [])));

  return (
    <div className="hm as">
      <header className="as-head">
        <SyxoriaCore state={thinking ? "understanding" : "active"} detail="mark" className="as-core" />
        <div className="min-w-0">
          <p className="bd-label">{copy.preview}</p>
          <h1 className="hm-title">{copy.title}</h1>
          <p className="hm-lead">{copy.intro}</p>
        </div>
      </header>

      <div className="as-thread" aria-live="polite">
        {messages.map((m) =>
          m.from === "you" ? (
            <p key={m.id} className="as-you">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className="as-reply">
              <p className="as-tag">{"sample" in m ? copy.sampleTag : copy.notYetTag}</p>
              {"sample" in m ? <Answer sample={m.sample} actions={actions} /> : <p className="as-text">{copy.notYet}</p>}
            </div>
          ),
        )}
        {thinking && (
          <p className="as-thinking" role="status">
            <span aria-hidden="true" />
            {copy.thinking}
          </p>
        )}
        <div ref={end} />
      </div>

      {samples.some((s) => !open.has(same(s.question))) && (
        <div className="as-suggest">
          <p className="bd-label">{copy.suggestions}</p>
          <ul>
            {samples
              .filter((s) => !open.has(same(s.question)))
              .map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => ask(s.question)} disabled={thinking}>
                    {s.question}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="as-form">
        <label htmlFor="as-field" className="sr-only">
          {copy.label}
        </label>
        <textarea
          ref={field}
          id="as-field"
          rows={1}
          placeholder={copy.placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" aria-label={copy.send} disabled={thinking}>
          <ArrowUp aria-hidden="true" className="size-4" />
        </button>
      </form>
      <p className="hm-foot as-note">{copy.note}</p>
    </div>
  );
}

function Answer({ sample, actions }: { sample: AssistantSample; actions: BriefingActionItem[] }) {
  const action = sample.actionId ? actions.find((a) => a.id === sample.actionId) : undefined;
  return (
    <>
      <p className="as-text">{sample.answer}</p>
      {action && (
        <Link href="/app/actions" className="hm-row as-action" data-status={action.status}>
          <StatusIcon status={action.status} />
          <span className="min-w-0">
            <span className="hm-row__name">{action.name}</span>
            <span className="hm-row__meta">
              <span className="hm-row__status">{words.actions.statuses[action.status]}</span> · {action.timing}
            </span>
          </span>
        </Link>
      )}
      <ul className="as-refs">
        {sample.references.map((r) => (
          <li key={r.href + r.label}>
            <Link href={r.href} className="hm-link">
              {r.label}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

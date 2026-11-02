"use client";

import { ArrowUp, Mic, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { assistant as copy } from "@/content/assistant";
import { globalHold, isHeld as heldIn } from "@/lib/automation";
import type { AssistantBlock, Conversation, PreparedAnswer } from "@/types/workspace";
import type { AssistantData } from "./data";
import { readDay } from "./day";
import { DayScore, type ExchangeMark } from "./day-score";
import { DeskDay, DeskExchange, DeskHistory, DeskItem, type DeskMode } from "./desk";
import { arrival, type Turn } from "./turns";
import { useVoice } from "./use-voice";

type Phase = "idle" | "thinking" | "answering";
type Thread = Conversation & { fresh?: boolean };

/* ---------- Understanding a question well enough to find its prepared answer ---------- */
const STOP = new Set(["what", "why", "is", "are", "the", "a", "an", "to", "my", "our", "me", "in", "of", "for", "did", "does", "do", "can", "you", "it", "this", "with", "on", "at", "and", "or", "be", "we", "your", "how", "where", "about", "tell", "please"]);
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

/** The prepared answer a question asks for, typed or spoken loosely: most of its words are there */
function answerFor(question: string, answers: PreparedAnswer[]) {
  const asked = new Set(words(question));
  let best: PreparedAnswer | undefined;
  let score = 0;
  for (const a of answers) {
    const own = words(a.question);
    const s = own.filter((w) => asked.has(w)).length / Math.max(own.length, 1);
    if (s > score) [best, score] = [a, s];
  }
  return score >= 0.6 ? best : undefined;
}

const motionQuery = "(prefers-reduced-motion: reduce)";
const onMotion = (cb: () => void) => {
  const m = window.matchMedia(motionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/**
 * The assistant as the workspace of an executive at work for the company. No figure and no chat
 * window: Syxoria says where things stand in one sentence, and its day is drawn as four lanes on
 * one line of time (what it is monitoring, analysing, deciding and doing), up to the line of now
 * and beyond it. Choosing any mark puts its story on the desk beside it, with what Syxoria will do
 * next and what the owner can do about it. Conversation is one part of the day: a single quiet
 * field (typed or spoken), answers that open on the desk like notes, and the exchanges as a thin
 * line under the lanes. Answers are prepared examples: nothing is generated or sent.
 * Styles: app/styles/assistant.css.
 */
export function AssistantRoom({ data, initialQuestion, initialConversation }: { data: AssistantData; initialQuestion?: string; initialConversation?: string }) {
  const { ctx, state } = useAutomation();
  const held = globalHold(state) !== null;
  const isHeld = useCallback((id?: string) => (id ? heldIn(state, ctx, id) : false), [state, ctx]);
  // what Syxoria would carry out on its own: everything stops under a global hold, a held workflow stops its own
  const holds = useCallback((id?: string) => held || isHeld(id), [held, isHeld]);
  const calm = useSyncExternalStore(onMotion, () => window.matchMedia(motionQuery).matches, () => false);
  const items = readDay(data.day, data.actions);

  // a question from the top bar or the overview opens straight on its own exchange
  const [boot] = useState(() => (initialQuestion?.trim() ? { key: "new0", q: initialQuestion.trim() } : null));
  const [threads, setThreads] = useState<Thread[]>(() =>
    boot ? [{ id: boot.key, title: boot.q, group: "Today", updated: data.day.now, messages: [], actions: [], fresh: true }, ...data.conversations] : data.conversations,
  );
  const [desk, setDesk] = useState<DeskMode>(() =>
    boot ? { kind: "exchange", id: boot.key } : initialConversation && data.conversations.some((c) => c.id === initialConversation) ? { kind: "exchange", id: initialConversation } : { kind: "day" },
  );
  const [extra, setExtra] = useState<Record<string, Turn[]>>(() => (boot ? { [boot.key]: [{ id: "u0", from: "you", at: data.day.now, text: boot.q, fresh: true }] } : {}));
  const [phase, setPhase] = useState<Phase>(boot ? "thinking" : "idle");
  const [work, setWork] = useState<{ reads: string[]; step: number } | null>(() => (boot ? { reads: answerFor(boot.q, data.answers)?.reads ?? ["your connected tools"], step: 0 } : null));
  const [text, setText] = useState("");
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const score = useRef<HTMLDivElement>(null);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Syxoria works on the question (reading, then writing), then answers */
  const respond = (key: string, question: string) => {
    const answer = answerFor(question, data.answers);
    const reads = answer?.reads ?? ["your connected tools"];
    const step = calm ? 160 : 640;
    for (let i = 1; i <= reads.length; i++) later(i * step, () => setWork((w) => w && { ...w, step: i }));
    later(reads.length * step + (calm ? 120 : 560), () => {
      const blocks: AssistantBlock[] = answer ? answer.blocks : [{ kind: "text", text: copy.notYet }];
      seq.current += 1;
      setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `s${seq.current}`, from: "syxoria", at: data.day.now, blocks, tag: answer ? "prepared" : "not-yet", fresh: !calm }] }));
      setWork(null);
      setPhase("answering");
      later(calm ? 0 : Math.min(arrival(blocks) + 500, 4200), () => setPhase("idle"));
    });
  };

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || phase !== "idle") return;
    seq.current += 1;
    const key = desk.kind === "exchange" ? desk.id : `new${seq.current}`;
    if (desk.kind !== "exchange") {
      setThreads((t) => [{ id: key, title: q, group: "Today", updated: data.day.now, messages: [], actions: [], fresh: true }, ...t]);
      setDesk({ kind: "exchange", id: key });
    }
    setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `u${seq.current}`, from: "you", at: data.day.now, text: q, fresh: !calm }] }));
    setPhase("thinking");
    setWork({ reads: answerFor(q, data.answers)?.reads ?? ["your connected tools"], step: 0 });
    respond(key, q);
  };

  const voice = useVoice((spoken) => ask(spoken));

  useEffect(() => {
    const list = timers.current;
    if (boot) respond(boot.key, boot.q);
    return () => list.forEach((t) => window.clearTimeout(t));
    // the question that opened the page is answered once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // where the day scrolls (phones), it opens on now
  useEffect(() => {
    const el = score.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth - el.clientWidth;
  }, []);

  useEffect(() => {
    if (desk.kind === "day") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesk({ kind: "day" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [desk.kind]);

  /* ---------- What is open ---------- */
  const exchangeId = desk.kind === "exchange" ? desk.id : null;
  const thread = exchangeId ? threads.find((t) => t.id === exchangeId) : undefined;
  const turns: Turn[] = thread ? [...thread.messages, ...(extra[thread.id] ?? [])] : [];
  const focus = desk.kind === "item" ? items.find((i) => i.id === desk.id) : undefined;

  // what was just said comes into view on the desk
  const said = exchangeId ? (extra[exchangeId]?.length ?? 0) : 0;
  useEffect(() => {
    if (said) end.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "end" });
  }, [said, work?.step, calm]);

  // what stays lit on the day: what shares the chosen item's action, client or exchange, or what the open exchange is about
  const related = new Set<string>();
  if (focus)
    for (const i of items)
      if (i.id !== focus.id && ((focus.actionId && i.actionId === focus.actionId) || (focus.clientId && i.clientId === focus.clientId) || (focus.conversationId && i.conversationId === focus.conversationId))) related.add(i.id);
  if (thread) {
    const ids = new Set([...thread.actions, ...turns.flatMap((t) => t.blocks?.flatMap((b) => (b.kind === "action" ? [b.actionId] : [])) ?? [])]);
    const people = new Set([...(thread.people ?? []), ...turns.flatMap((t) => (t.from === "you" ? (answerFor(t.text ?? "", data.answers)?.people ?? []) : []))]);
    for (const i of items) if ((i.actionId && ids.has(i.actionId)) || (i.clientId && people.has(i.clientId)) || i.conversationId === thread.id) related.add(i.id);
  }

  const exchanges: ExchangeMark[] = threads
    .filter((t) => t.group === "Today")
    .map((t) => {
      const all = [...t.messages, ...(extra[t.id] ?? [])];
      const moments = t.fresh ? [data.day.now] : all.map((m) => m.at);
      return { id: t.id, title: t.title, from: moments[0] ?? t.updated, to: moments[moments.length - 1] ?? t.updated, moments };
    });

  /* ---------- What Syxoria says first ---------- */
  const watching = items.filter((i) => i.lane === "monitoring").length;
  const waiting = items.filter((i) => i.lane === "deciding" && i.state === "waiting");
  const oldest = waiting[0]?.at;
  const right = [
    ...items.filter((i) => !i.day && i.state === "ongoing" && i.lane === "doing"),
    ...items.filter((i) => !i.day && i.state === "ongoing" && i.lane === "analysing"),
    ...items.filter((i) => !i.day && i.state === "ahead").slice(0, 1),
  ];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
    setText("");
  };
  const listening = voice.listening;
  const asked = new Set(turns.filter((t) => t.from === "you").map((t) => answerFor(t.text ?? "", data.answers)?.id));
  const offer = thread
    ? data.answers
        .filter((a) => !asked.has(a.id) && answerFor(thread.title, data.answers)?.id !== a.id)
        .slice(0, 3)
        .map((a) => a.question)
    : data.prompts.slice(0, 3).map((p) => p.text);

  const focusItem = (id: string) => setDesk((d) => (d.kind === "item" && d.id === id ? { kind: "day" } : { kind: "item", id }));
  const openExchange = (id: string) => setDesk((d) => (d.kind === "exchange" && d.id === id ? { kind: "day" } : { kind: "exchange", id }));

  return (
    <div className="sw" data-desk={desk.kind} data-phase={listening ? "listening" : phase} data-held={held || undefined}>
      <section className="sw-main" aria-labelledby="sw-statement">
        <header className="sw-head">
          <div className="sw-voice">
            <p className="sw-eyebrow">
              <span className="sw-live" aria-hidden="true" />
              {copy.eyebrow(data.date, data.day.now)}
            </p>
            <h1 id="sw-statement" className="sw-statement">
              <span>{data.greeting}</span>{" "}
              {held ? (
                copy.statement.held
              ) : (
                <>
                  {copy.statement.watching(watching)}, {copy.statement.deciding(waiting.length)}
                </>
              )}
            </h1>
            {!held && oldest && <p className="sw-sub">{copy.statement.oldest(oldest)}</p>}
          </div>

          <div className="sw-now" aria-label={copy.now.label}>
            <p className="cx-label">{copy.now.label}</p>
            <ul>
              {right.map((i) => (
                <li key={i.id}>
                  <button type="button" className="sw-now__row" data-state={i.state} data-held={(i.lane === "doing" && holds(i.actionId)) || undefined} onClick={() => focusItem(i.id)}>
                    <span className="sw-now__when">{i.lane === "doing" && holds(i.actionId) ? copy.now.paused : i.state === "ahead" ? `${copy.now.next} ${i.at}` : copy.lanes[i.lane].name}</span>
                    <span className="sw-now__title">{i.title}</span>
                    {i.progress && (
                      <span className="sw-now__bar" aria-hidden="true">
                        <span style={{ width: `${(i.progress.done / i.progress.of) * 100}%` }} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div ref={score} className="sw-score">
          <DayScore
            day={data.day}
            items={items}
            exchanges={exchanges}
            focus={focus?.id ?? null}
            related={related}
            onFocus={focusItem}
            onExchange={openExchange}
            onHistory={() => setDesk({ kind: "history" })}
            isHeld={holds}
            openExchange={exchangeId}
          />
        </div>

        <div className="sw-compose">
          <form onSubmit={onSubmit} className="ar-ask" data-listening={listening || undefined}>
            {thread && (
              <span className="sw-in">
                <span className="sw-in__label">{copy.composer.in}</span>
                <span className="sw-in__title">{thread.title}</span>
                <button type="button" onClick={() => setDesk({ kind: "day" })} aria-label={copy.composer.leave}>
                  <X aria-hidden="true" />
                </button>
              </span>
            )}
            <label htmlFor="sw-field" className="sr-only">
              {copy.composer.label}
            </label>
            <textarea
              ref={field}
              id="sw-field"
              rows={1}
              value={listening ? voice.heard : text}
              readOnly={listening}
              onChange={(e) => setText(e.target.value)}
              placeholder={listening ? copy.composer.listening : copy.composer.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            {voice.supported && (
              <button type="button" className="ar-mic" aria-pressed={listening} onClick={listening ? voice.stop : voice.start} disabled={phase !== "idle"}>
                {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                <span className="sr-only">{listening ? copy.composer.stop : copy.composer.speak}</span>
              </button>
            )}
            <button type="submit" className="ar-send" disabled={phase !== "idle" || listening || !text.trim()}>
              <ArrowUp aria-hidden="true" />
              <span className="sr-only">{copy.composer.send}</span>
            </button>
          </form>
          {voice.problem ? (
            <p className="ar-problem" role="status">
              {voice.problem === "denied" ? copy.composer.micOff : copy.composer.micFailed}
            </p>
          ) : (
            offer.length > 0 && (
              <p className="sw-try">
                <span>{copy.composer.try}</span>
                {offer.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} disabled={phase !== "idle" || listening}>
                    {q}
                  </button>
                ))}
              </p>
            )
          )}
        </div>
      </section>

      <aside className="sw-desk" aria-label={desk.kind === "exchange" ? copy.exchange : copy.desk.waiting}>
        {desk.kind === "day" && <DeskDay items={items} mode={ctx.levelName} onFocus={focusItem} held={held} />}
        {desk.kind === "item" && focus && (
          <DeskItem
            item={focus}
            action={focus.actionId ? data.actions.find((a) => a.id === focus.actionId) : undefined}
            client={focus.clientId ? data.clients.find((c) => c.id === focus.clientId) : undefined}
            held={focus.lane === "doing" && holds(focus.actionId) && (focus.state === "ahead" || focus.state === "ongoing")}
            onBack={() => setDesk({ kind: "day" })}
            onAsk={ask}
            onExchange={openExchange}
            canAsk={phase === "idle"}
          />
        )}
        {desk.kind === "exchange" && (
          <DeskExchange
            conversation={thread}
            turns={turns}
            work={work}
            initials={data.initials}
            action={(id) => data.actions.find((a) => a.id === id)}
            isHeld={isHeld}
            onBack={() => setDesk({ kind: "day" })}
            end={end}
          />
        )}
        {desk.kind === "history" && <DeskHistory conversations={threads} open={exchangeId} onOpen={(id) => setDesk({ kind: "exchange", id })} onBack={() => setDesk({ kind: "day" })} />}
        <p className="sw-preview">{copy.previewNote}</p>
      </aside>
      {desk.kind !== "day" && <div className="sw-scrim" aria-hidden="true" onClick={() => setDesk({ kind: "day" })} />}
    </div>
  );
}

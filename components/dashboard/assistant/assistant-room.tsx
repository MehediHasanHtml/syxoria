"use client";

import { ArrowRight, ArrowUp, MessagesSquare, Mic, Plus, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { ActionState } from "@/components/dashboard/ws/kit";
import { assistant as copy } from "@/content/assistant";
import { globalHold, isHeld as heldIn } from "@/lib/automation";
import type { CoreState } from "@/lib/core/core-states";
import type { AssistantBlock, PreparedAnswer } from "@/types/workspace";
import type { AssistantData } from "./data";
import { Pact, Table, Threads, type Thread } from "./rails";
import { arrival, TurnView, Working, type Turn } from "./turns";
import { useVoice } from "./use-voice";

type Phase = "idle" | "thinking" | "answering";

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

const unique = <T,>(xs: T[]) => Array.from(new Set(xs));

const motionQuery = "(prefers-reduced-motion: reduce)";
const onMotion = (cb: () => void) => {
  const m = window.matchMedia(motionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** The line under Syxoria's name: what it is busy with, one thing after another */
function useRotation(count: number, still: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (still || count < 2) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % count), 5200);
    return () => window.clearInterval(t);
  }, [count, still]);
  return i % Math.max(count, 1);
}

/**
 * The assistant, as a colleague rather than a chat window. Syxoria is present: the Core is its
 * face, with a status and what it is busy with at this moment. It speaks first, greeting the
 * owner and bringing up what is worth a minute; a conversation reads like an exchange between
 * two people (its answers said in Spectral, word after word, after it shows what it is reading),
 * and what it prepares is handed over as a slip with its live status. The owner can type or
 * simply speak. Beside it: the conversations as shared work, and what is on the table with the
 * rules it works under. Answers are prepared examples: nothing is generated or sent.
 * Styles: app/styles/assistant.css.
 */
export function AssistantRoom({ data, initialQuestion, initialConversation }: { data: AssistantData; initialQuestion?: string; initialConversation?: string }) {
  const { ctx, state } = useAutomation();
  const held = globalHold(state) !== null;
  const isHeld = useCallback((id: string) => heldIn(state, ctx, id), [state, ctx]);
  const calm = useSyncExternalStore(onMotion, () => window.matchMedia(motionQuery).matches, () => false);

  // a question from the top bar or the overview opens straight on its own conversation
  const [boot] = useState(() => (initialQuestion?.trim() ? { key: "new0", q: initialQuestion.trim() } : null));
  const [threads, setThreads] = useState<Thread[]>(() =>
    boot ? [{ id: boot.key, title: boot.q, group: "Today", updated: "Now", messages: [], actions: [], fresh: true }, ...data.conversations] : data.conversations,
  );
  const [open, setOpen] = useState<string | null>(() => (boot ? boot.key : initialConversation && data.conversations.some((c) => c.id === initialConversation) ? initialConversation : null));
  const [extra, setExtra] = useState<Record<string, Turn[]>>(() => (boot ? { [boot.key]: [{ id: "u0", from: "you", at: "Now", text: boot.q, fresh: true }] } : {}));
  const [asked, setAsked] = useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<Phase>(boot ? "thinking" : "idle");
  const [work, setWork] = useState<{ reads: string[]; step: number } | null>(() => (boot ? { reads: answerFor(boot.q, data.answers)?.reads ?? ["your connected tools"], step: 0 } : null));
  const [text, setText] = useState("");
  const [pulse, setPulse] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Moving between the opening and a conversation: the Core travels to its place */
  const go = (fn: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (calm || !doc.startViewTransition) return fn();
    doc.startViewTransition(() => flushSync(fn));
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
      setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `s${seq.current}`, from: "syxoria", at: "Now", blocks, tag: answer ? "prepared" : "not-yet", fresh: !calm }] }));
      if (answer) setAsked((a) => ({ ...a, [key]: [...(a[key] ?? []), answer.id] }));
      setWork(null);
      setPhase("answering");
      setPulse((p) => p + 1);
      later(calm ? 0 : Math.min(arrival(blocks) + 500, 4200), () => setPhase("idle"));
    });
  };

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || phase !== "idle") return;
    seq.current += 1;
    const fresh = open === null;
    const key = open ?? `new${seq.current}`;
    const begin = () => {
      if (fresh) {
        setThreads((t) => [{ id: key, title: q, group: "Today", updated: "Now", messages: [], actions: [], fresh: true }, ...t]);
        setOpen(key);
      }
      setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `u${seq.current}`, from: "you", at: "Now", text: q, fresh: !calm }] }));
      setPhase("thinking");
      setWork({ reads: answerFor(q, data.answers)?.reads ?? ["your connected tools"], step: 0 });
    };
    if (fresh) go(begin);
    else begin();
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

  // a conversation opens at its beginning; what is said next comes into view
  const turns: Turn[] = open ? [...(threads.find((t) => t.id === open)?.messages ?? []), ...(extra[open] ?? [])] : [];
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [open]);
  const said = open ? (extra[open]?.length ?? 0) : 0;
  useEffect(() => {
    if (!said) return;
    const el = scroller.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: calm ? "auto" : "smooth" });
  }, [said, work?.step, calm]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const openThread = (id: string) => {
    setDrawer(false);
    if (id === open) return;
    if (open === null) go(() => setOpen(id));
    else setOpen(id);
  };
  const newConversation = () => {
    setDrawer(false);
    if (open !== null) go(() => setOpen(null));
    window.setTimeout(() => field.current?.focus(), 0);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
    setText("");
  };

  /* ---------- What Syxoria shows of itself ---------- */
  const listening = voice.listening;
  const coreState: CoreState = held ? "paused" : listening ? "receiving" : phase === "thinking" ? "understanding" : phase === "answering" ? "executing" : text.trim() ? "ready" : "active";
  const status = held ? copy.status.held : listening ? copy.status.listening : phase === "thinking" ? copy.status.thinking : phase === "answering" ? copy.status.answering : copy.status.available;
  const tone = held ? "held" : listening || phase !== "idle" ? "busy" : "here";
  const turn = useRotation(data.doing.length, calm || held);
  const doing = data.doing[turn];

  const action = (id: string) => data.actions.find((a) => a.id === id);
  const statusOf = (id: string) => action(id)?.status;

  /* ---------- What is on the table ---------- */
  const current = open ? threads.find((t) => t.id === open) : undefined;
  const answered = (open ? (asked[open] ?? []) : []).map((id) => data.answers.find((a) => a.id === id)).filter(Boolean) as PreparedAnswer[];
  const actionIds = unique([...(current?.actions ?? []), ...turns.flatMap((t) => t.blocks?.flatMap((b) => (b.kind === "action" ? [b.actionId] : [])) ?? [])]);
  const peopleIds = unique([...(current?.people ?? []), ...answered.flatMap((a) => a.people ?? [])]);
  const recallIds = unique([...(current?.recalls ?? []), ...answered.flatMap((a) => a.recalls ?? [])]);

  // one click away: in a conversation, what follows from it; before one, a question of each kind
  const already = new Set(turns.filter((t) => t.from === "you").map((t) => answerFor(t.text ?? "", data.answers)?.id));
  const offer = current
    ? data.answers.filter((a) => !already.has(a.id) && answerFor(current.title, data.answers)?.id !== a.id).slice(0, 3).map((a) => ({ label: "", text: a.question }))
    : data.prompts;

  const presence = (
    <>
      <p className="ar-name">
        {copy.name}
        <span className="ar-status" data-tone={tone}>
          <span aria-hidden="true" />
          {status}
        </span>
      </p>
      <p className="ar-doing" aria-live="off">
        {held ? (
          <span className="ar-doing__line">{copy.held}</span>
        ) : (
          doing && (
            <span key={turn} className="ar-doing__line">
              <span className="ar-doing__when">{doing.when}</span>
              {doing.text}
            </span>
          )
        )}
      </p>
    </>
  );

  return (
    <div className="ar" data-view={open ? "thread" : "opening"} data-phase={listening ? "listening" : phase}>
      <Threads threads={threads} open={open} statusOf={statusOf} onOpen={openThread} onNew={newConversation} drawer={drawer} onClose={() => setDrawer(false)} />
      {drawer && <div className="ar-scrim" aria-hidden="true" onClick={() => setDrawer(false)} />}

      <section className="ar-stage" aria-label={copy.name}>
        <header className="ar-presence">
          {open && (
            <>
              <SyxoriaCore state={coreState} pulse={pulse} vtName="ar-core" detail="mark" label={copy.name} className="ar-presence__core" />
              <div className="ar-presence__who">{presence}</div>
            </>
          )}
          <div className="ar-presence__tools">
            <button type="button" className="ar-tool ar-tool--threads" onClick={() => setDrawer(true)} aria-expanded={drawer}>
              <MessagesSquare aria-hidden="true" />
              <span>{copy.threads.open}</span>
            </button>
            {open && (
              <button type="button" className="ar-tool ar-tool--new" onClick={newConversation}>
                <Plus aria-hidden="true" />
                <span>{copy.threads.newConversation}</span>
              </button>
            )}
          </div>
        </header>

        <div ref={scroller} className="ar-scroll">
          {open === null ? (
            <div className="ar-open">
              <div className="ar-open__presence">
                <SyxoriaCore state={coreState} pulse={pulse} vtName="ar-core" label={copy.name} className="ar-open__core" />
                {presence}
                <p className="ar-role">
                  {copy.role(data.company)} · {copy.since}
                </p>
              </div>
              <h1 className="ar-open__greet">{data.greeting}</h1>
              <p className="ar-open__lead">{data.lead}</p>
              <div className="ar-brought">
                <p className="cx-label">{copy.opening.brought}</p>
                <ul>
                  {data.brought.map((b) => {
                    const a = action(b.actionId);
                    return (
                      <li key={b.id}>
                        <button type="button" className="ar-card" onClick={() => openThread(b.conversationId)}>
                          {a && <ActionState status={a.status} held={isHeld(a.id)} />}
                          <span className="ar-card__title">{b.title}</span>
                          <span className="ar-card__line">{b.line}</span>
                          <span className="ar-card__go">
                            {copy.opening.talk}
                            <ArrowRight aria-hidden="true" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <div className="ar-thread">
              <h1 className={current?.fresh ? "sr-only" : "ar-thread__title"}>{current?.title}</h1>
              {turns.map((t) => (
                <TurnView key={t.id} turn={t} initials={data.initials} action={action} isHeld={isHeld} />
              ))}
              {work && <Working reads={work.reads} step={work.step} />}
            </div>
          )}
        </div>

        <div className="ar-composer">
          {offer.length > 0 && (
            <div className="ar-suggest" aria-label={copy.composer.suggestions}>
              {offer.map((p) => (
                <button key={p.text} type="button" onClick={() => ask(p.text)} disabled={phase !== "idle" || listening}>
                  {p.label && <span className="ar-suggest__label">{p.label}</span>}
                  {p.text}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={onSubmit} className="ar-ask" data-listening={listening || undefined}>
            {voice.supported && (
              <button type="button" className="ar-mic" aria-pressed={listening} onClick={listening ? voice.stop : voice.start} disabled={phase !== "idle"}>
                {listening ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                <span className="sr-only">{listening ? copy.composer.stop : copy.composer.speak}</span>
              </button>
            )}
            <label htmlFor="ar-field" className="sr-only">
              {copy.composer.label}
            </label>
            <textarea
              ref={field}
              id="ar-field"
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
            <button type="submit" className="ar-send" disabled={phase !== "idle" || listening || !text.trim()}>
              <ArrowUp aria-hidden="true" />
              <span className="sr-only">{copy.composer.send}</span>
            </button>
          </form>
          {voice.problem && (
            <p className="ar-problem" role="status">
              {voice.problem === "denied" ? copy.composer.micOff : copy.composer.micFailed}
            </p>
          )}
        </div>
      </section>

      <aside className="ar-table" aria-label={copy.table.title}>
        <Table
          thread={!!open}
          people={data.people.filter((p) => peopleIds.includes(p.id))}
          actions={actionIds.map(action).filter((a) => a !== undefined)}
          recalls={data.memory.filter((m) => recallIds.includes(m.id))}
          events={data.events}
          isHeld={isHeld}
        />
        <Pact mode={ctx.levelName} own={ctx.workflows.map((w) => w.name)} ask={data.rules.ask} never={data.rules.never} held={held} />
        <p className="ar-preview">{copy.previewNote}</p>
      </aside>
    </div>
  );
}

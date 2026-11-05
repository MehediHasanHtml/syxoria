"use client";

import { ArrowRight, ArrowUp, MessagesSquare, Mic, PanelLeftClose, Plus, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { useAutomation } from "@/components/dashboard/automation/automation-provider";
import { assistant as copy } from "@/content/assistant";
import { dailyBriefing as briefingCopy } from "@/content/briefing";
import { globalHold, isHeld as heldIn } from "@/lib/automation";
import type { AssistantBlock, PreparedAnswer } from "@/types/workspace";
import type { AssistantData } from "./data";
import { PresenceMark, type PresenceState } from "./presence-mark";
import { Threads, type Thread } from "./rails";
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

const motionQuery = "(prefers-reduced-motion: reduce)";
const onMotion = (cb: () => void) => {
  const m = window.matchMedia(motionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/* Wide screens keep the conversations docked beside the stage; narrow ones open them over it */
const wideQuery = "(min-width: 1024px)";
const onWide = (cb: () => void) => {
  const m = window.matchMedia(wideQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/**
 * Whether the docked conversations are open: a toggle this browser remembers, so the panel stays
 * as the owner left it between visits. Kept in memory too, where storage is unavailable.
 */
const PANEL_KEY = "syx.assistant.conversations";
const PANEL_EVENT = "syx:assistant-conversations";
let panelMemory = false;
const panel = {
  subscribe(cb: () => void) {
    window.addEventListener(PANEL_EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(PANEL_EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  },
  get() {
    try {
      const v = localStorage.getItem(PANEL_KEY);
      return v === null ? panelMemory : v === "open";
    } catch {
      return panelMemory;
    }
  },
  set(open: boolean) {
    panelMemory = open;
    try {
      localStorage.setItem(PANEL_KEY, open ? "open" : "closed");
    } catch {
      /* storage unavailable: the panel stays as set for this visit */
    }
    window.dispatchEvent(new Event(PANEL_EVENT));
  },
};

/** What Syxoria is in the middle of, one thing after another */
function useRotation(count: number, still: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (still || count < 2) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % count), 6000);
    return () => window.clearInterval(t);
  }, [count, still]);
  return i % Math.max(count, 1);
}

/**
 * The assistant, kept simple. No figure: a point of light in a fine ring stands for Syxoria until
 * the final Core is approved, and one quiet line beside its name says what it is analysing,
 * preparing or doing. It speaks first: a greeting, one sentence, and the few things worth a
 * minute. A conversation reads like an exchange between two people (its answers in Spectral,
 * word after word, after a line of what it is reading), and what it prepares is handed over with
 * its live status. Conversations stay out of the way in a panel; the owner can type or speak.
 * Answers are prepared examples: nothing is generated or sent. Styles: app/styles/assistant.css.
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
  const [phase, setPhase] = useState<Phase>(boot ? "thinking" : "idle");
  const [work, setWork] = useState<{ reads: string[]; step: number } | null>(() => (boot ? { reads: answerFor(boot.q, data.answers)?.reads ?? ["your connected tools"], step: 0 } : null));
  const [text, setText] = useState("");
  const [drawer, setDrawer] = useState(false);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** Moving between the opening and a conversation: Syxoria's mark travels to its place */
  const go = (fn: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (calm || !doc.startViewTransition) return fn();
    doc.startViewTransition(() => flushSync(fn));
  };

  /** Syxoria works on the question (reading, then writing), then answers */
  const respond = (key: string, question: string) => {
    const answer = answerFor(question, data.answers);
    const reads = answer?.reads ?? ["your connected tools"];
    const step = calm ? 160 : 720;
    for (let i = 1; i <= reads.length; i++) later(i * step, () => setWork((w) => w && { ...w, step: i }));
    later(reads.length * step + (calm ? 120 : 640), () => {
      const blocks: AssistantBlock[] = answer ? answer.blocks : [{ kind: "text", text: copy.notYet }];
      seq.current += 1;
      setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `s${seq.current}`, from: "syxoria", at: "Now", blocks, tag: answer ? "prepared" : "not-yet", fresh: !calm }] }));
      setWork(null);
      setPhase("answering");
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
  const current = open ? threads.find((t) => t.id === open) : undefined;
  const turns: Turn[] = current ? [...current.messages, ...(extra[current.id] ?? [])] : [];
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [open]);
  const said = open ? (extra[open]?.length ?? 0) : 0;
  useEffect(() => {
    if (!said) return;
    const el = scroller.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: calm ? "auto" : "smooth" });
  }, [said, work?.step, calm]);

  /* The conversations: docked and toggled on wide screens (they stay open while the owner moves
     between conversations), over the page on narrow ones (closed once one is chosen) */
  const wide = useSyncExternalStore(onWide, () => window.matchMedia(wideQuery).matches, () => false);
  const docked = useSyncExternalStore(panel.subscribe, panel.get, () => false);
  const panelOpen = wide ? docked : drawer;
  const togglePanel = () => (wide ? panel.set(!docked) : setDrawer((d) => !d));
  const closePanel = useCallback(() => {
    if (wide) return panel.set(false);
    setDrawer(false);
    opener.current?.focus();
  }, [wide]);
  useEffect(() => {
    if (wide || !drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [wide, drawer, closePanel]);

  const openThread = (id: string) => {
    if (!wide) setDrawer(false);
    if (id === open) return;
    if (open === null) go(() => setOpen(id));
    else setOpen(id);
  };
  const newConversation = () => {
    if (!wide) setDrawer(false);
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
  const presence: PresenceState = held ? "held" : listening ? "listening" : phase !== "idle" ? "busy" : "here";
  const turn = useRotation(data.doing.length, calm || held || phase !== "idle" || listening);
  const doing = data.doing[turn];
  const activity = held ? (
    <span className="ar-activity__line" data-tone="held">
      <span className="ar-activity__verb">{copy.status.held}</span>
      {copy.held}
    </span>
  ) : listening || phase !== "idle" ? (
    <span className="ar-activity__line">
      <span className="ar-activity__verb">{listening ? copy.status.listening : phase === "thinking" ? copy.status.thinking : copy.status.answering}</span>
    </span>
  ) : (
    doing && (
      <span key={turn} className="ar-activity__line">
        <span className="ar-activity__verb">{doing.verb}</span>
        {doing.text}
      </span>
    )
  );

  const action = (id: string) => data.actions.find((a) => a.id === id);
  const statusOf = (id: string) => action(id)?.status;

  // one click away: in a conversation, what follows from it; before one, a question of each kind
  const already = new Set(turns.filter((t) => t.from === "you").map((t) => answerFor(t.text ?? "", data.answers)?.id));
  const offer = current
    ? data.answers
        .filter((a) => !already.has(a.id) && answerFor(current.title, data.answers)?.id !== a.id)
        .slice(0, 3)
        .map((a) => a.question)
    : data.prompts.slice(0, 3).map((p) => p.text);

  return (
    <div className="ar" data-view={open ? "thread" : "opening"} data-phase={listening ? "listening" : phase} data-docked={(wide && docked) || undefined}>
      <Threads threads={threads} open={open} statusOf={statusOf} onOpen={openThread} onNew={newConversation} drawer={panelOpen} modal={!wide} onClose={closePanel} mode={ctx.levelName} />
      {!wide && drawer && <div className="ar-scrim" aria-hidden="true" onClick={closePanel} />}

      <section className="ar-stage" aria-label={copy.name}>
        <header className="ar-top">
          <button ref={opener} type="button" className="ar-tool ar-tool--panel" onClick={togglePanel} aria-expanded={panelOpen} title={panelOpen ? copy.threads.hide : copy.threads.show}>
            {panelOpen && wide ? <PanelLeftClose aria-hidden="true" /> : <MessagesSquare aria-hidden="true" />}
            <span>{copy.threads.open}</span>
          </button>
          {open && (
            <p className="ar-presence">
              <PresenceMark state={presence} vtName="ar-core" className="ar-presence__mark" />
              <span className="ar-name">{copy.name}</span>
              <span className="ar-activity" aria-live="off">
                {activity}
              </span>
            </p>
          )}
          {open && (
            <button type="button" className="ar-tool ar-tool--new" onClick={newConversation}>
              <Plus aria-hidden="true" />
              <span>{copy.threads.newConversation}</span>
            </button>
          )}
        </header>

        <div ref={scroller} className="ar-scroll">
          {open === null ? (
            <div className="ar-open">
              <PresenceMark state={presence} vtName="ar-core" className="ar-open__mark" />
              <p className="ar-open__who">
                <span className="ar-name">{copy.name}</span>
                <span className="ar-activity" aria-live="off">
                  {activity}
                </span>
              </p>
              <h1 className="ar-open__greet">{data.greeting}</h1>
              <p className="ar-open__lead">{data.lead}</p>
              <div className="ar-brought">
                <p className="cx-label">{copy.opening.brought}</p>
                <ul>
                  {data.brought.map((b) => {
                    const a = action(b.actionId);
                    return (
                      <li key={b.id}>
                        <button type="button" className="ar-row" onClick={() => openThread(b.conversationId)}>
                          <span className="ar-row__mark" data-tone={a?.status === "unsuccessful" ? "failed" : "yours"} aria-hidden="true" />
                          <span className="ar-row__text">
                            <span className="ar-row__title">{b.title}</span>
                            <span className="ar-row__line">{b.line}</span>
                            {a && <span className="sr-only">{briefingCopy.actions.statuses[a.status]}</span>}
                          </span>
                          <span className="ar-row__go" aria-hidden="true">
                            {copy.opening.talk}
                            <ArrowRight />
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
                <TurnView key={t.id} turn={t} action={action} isHeld={isHeld} />
              ))}
              {work && <Working reads={work.reads} step={work.step} />}
            </div>
          )}
        </div>

        <div className="ar-composer">
          <form onSubmit={onSubmit} className="ar-ask" data-listening={listening || undefined}>
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
              <div className="ar-suggest" role="group" aria-label={copy.composer.suggestions}>
                {offer.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} disabled={phase !== "idle" || listening}>
                    {q}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

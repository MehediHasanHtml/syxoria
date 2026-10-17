"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, AtSign, FileText, MessagesSquare, Paperclip, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SyxoriaCore } from "@/components/brand/syxoria-core";
import { StatusIcon } from "@/components/briefing/marks";
import { ActionState, Chip } from "@/components/dashboard/ws/kit";
import { assistant as copy } from "@/content/assistant";
import { cn } from "@/lib/cn";
import type { AssistantSample } from "@/types";
import type { AssistantBlock, AssistantMessage, Conversation, MemoryItem, WorkspaceAction } from "@/types/workspace";

const same = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[?.!\s]+$/, "")
    .trim();

type Live = AssistantMessage & { tag?: "sample" | "not-yet" };

/**
 * The assistant as an executive workspace: earlier conversations on the left, the conversation in
 * the middle (Syxoria's answers structured: a sentence, the figures that matter, the steps it
 * suggests, the action it prepared with its live status, and where it all comes from), and on the
 * right the sources, the actions this conversation started and what Syxoria knows. The Brain sits
 * quietly at the head of the conversation. Earlier conversations are prepared examples; a new
 * question gets a prepared sample when one exists, and says plainly when it does not.
 */
export function AssistantWorkspace({
  conversations,
  prompts,
  samples,
  actions,
  memory,
  initialQuestion,
  initialConversation,
}: {
  conversations: Conversation[];
  prompts: { label: string; text: string }[];
  samples: AssistantSample[];
  actions: WorkspaceAction[];
  memory: MemoryItem[];
  initialQuestion?: string;
  initialConversation?: string;
}) {
  const [list, setList] = useState(conversations);
  const [open, setOpen] = useState(initialQuestion ? "new" : (initialConversation && conversations.some((c) => c.id === initialConversation) ? initialConversation : conversations[0].id));
  const [extra, setExtra] = useState<Record<string, Live[]>>({});
  const [thinking, setThinking] = useState(false);
  const [filter, setFilter] = useState("");
  const [text, setText] = useState("");
  const asked = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const current = list.find((c) => c.id === open);
  const messages: Live[] = [...(current?.messages ?? []), ...(extra[open] ?? [])];
  const action = (id: string) => actions.find((a) => a.id === id);
  const convoActions = Array.from(new Set([...(current?.actions ?? []), ...messages.flatMap((m) => m.blocks?.flatMap((b) => (b.kind === "action" ? [b.actionId] : [])) ?? [])])).map(action).filter(Boolean) as WorkspaceAction[];
  const convoSources = messages.flatMap((m) => m.blocks?.flatMap((b) => (b.kind === "sources" ? b.items : [])) ?? []);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || thinking) return;
    seq.current += 1;
    const n = seq.current;
    const at = "Now";
    const key = open;
    if (key === "new" && !list.some((c) => c.id === "new")) {
      setList((l) => [{ id: "new", title: question, group: "Today", updated: at, messages: [], actions: [] }, ...l]);
    }
    setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), { id: `u${n}`, from: "you", at, text: question }] }));
    setThinking(true);
    window.setTimeout(() => {
      const sample = samples.find((s) => same(s.question) === same(question));
      const reply: Live = sample
        ? {
            id: `s${n}`,
            from: "syxoria",
            at,
            tag: "sample",
            blocks: [
              { kind: "text", text: sample.answer },
              ...(sample.actionId ? [{ kind: "action" as const, actionId: sample.actionId }] : []),
              { kind: "sources", items: sample.references.map((r) => ({ label: r.label, detail: "Today", href: r.href })) },
            ],
          }
        : { id: `s${n}`, from: "syxoria", at, tag: "not-yet", blocks: [{ kind: "text", text: copy.notYet }] };
      setExtra((x) => ({ ...x, [key]: [...(x[key] ?? []), reply] }));
      setThinking(false);
    }, 700);
  };

  useEffect(() => {
    if (initialQuestion && !asked.current) {
      asked.current = true;
      ask(initialQuestion);
    }
    // the question from the top bar or a document is asked once, when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, thinking]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
    setText("");
  };
  const groups = (["Today", "Yesterday", "Previous 7 days"] as const).map((g) => ({ g, items: list.filter((c) => c.group === g && c.title.toLowerCase().includes(filter.toLowerCase())) })).filter((x) => x.items.length);
  const usedSamples = new Set(messages.filter((m) => m.from === "you").map((m) => same(m.text ?? "")));
  const offer = [...samples.filter((s) => !usedSamples.has(same(s.question))).map((s) => ({ label: "Ask", text: s.question })), ...prompts].slice(0, 6);

  return (
    <div className="ws as2">
      <div className="as2-grid">
        {/* earlier conversations */}
        <aside className="as2-list" aria-label="Conversations">
          <button type="button" className="as2-new" onClick={() => setOpen("new")}>
            <Plus aria-hidden="true" />
            {copy.newConversation}
          </button>
          <label className="ws-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{copy.searchConversations}</span>
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={copy.searchConversations} />
          </label>
          {groups.map(({ g, items }) => (
            <section key={g}>
              <h2 className="bd-label as2-list__group">{g}</h2>
              <ul>
                {items.map((c) => (
                  <li key={c.id}>
                    <button type="button" aria-current={c.id === open ? "true" : undefined} onClick={() => setOpen(c.id)} className="as2-convo">
                      <MessagesSquare aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="as2-convo__title">{c.title}</span>
                        <span className="as2-convo__at">{c.updated}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>

        {/* the conversation */}
        <section className="as2-main" aria-label="Conversation">
          <header className="as2-head">
            <SyxoriaCore state={thinking ? "understanding" : "active"} detail="mark" label="Syxoria" className="as2-core" />
            <div className="min-w-0">
              <p className="bd-label">{copy.eyebrow}</p>
              <h1 className="as2-title">{current && messages.length ? current.title : copy.title}</h1>
              <p className="as2-sub">{current && messages.length ? `Started ${current.updated}` : copy.intro}</p>
            </div>
          </header>

          <div className="as2-thread" aria-live="polite">
            {messages.length === 0 && !thinking ? (
              <div className="as2-empty">
                <SyxoriaCore state="ready" className="as2-empty__core" />
                <h2 className="as2-empty__title">{copy.emptyTitle}</h2>
                <p className="as2-empty__body">{copy.emptyBody}</p>
              </div>
            ) : (
              messages.map((m) =>
                m.from === "you" ? (
                  <div key={m.id} className="as2-you">
                    <p>{m.text}</p>
                    <span className="as2-at">{m.at}</span>
                  </div>
                ) : (
                  <div key={m.id} className="as2-reply">
                    {m.tag && <p className="as-tag">{m.tag === "sample" ? copy.sampleTag : copy.notYetTag}</p>}
                    {m.blocks?.map((b, i) => <Block key={i} block={b} action={action} />)}
                    <span className="as2-at">{m.at}</span>
                  </div>
                ),
              )
            )}
            {thinking && (
              <p className="as-thinking" role="status">
                <span aria-hidden="true" />
                {copy.thinking}
              </p>
            )}
            <div ref={end} />
          </div>

          <div className="as2-offer" aria-label={copy.suggestions}>
            {offer.map((p) => (
              <button key={p.text} type="button" onClick={() => ask(p.text)} disabled={thinking}>
                <span className="as2-offer__label">{p.label}</span>
                {p.text}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="as2-form">
            <label htmlFor="as2-field" className="sr-only">
              {copy.label}
            </label>
            <textarea
              id="as2-field"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={copy.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="as2-form__bar">
              <span className="as2-form__context">
                <button type="button" title="Mention a client">
                  <AtSign aria-hidden="true" />
                  <span className="sr-only">Mention a client</span>
                </button>
                <button type="button" title="Attach a document">
                  <Paperclip aria-hidden="true" />
                  <span className="sr-only">Attach a document</span>
                </button>
                <span className="as2-form__hint">Context: your connected tools and company memory</span>
              </span>
              <button type="submit" className="as2-send" aria-label={copy.send} disabled={thinking || !text.trim()}>
                <ArrowUp aria-hidden="true" />
              </button>
            </div>
          </form>
          <p className="ws-note">
            {copy.note} {copy.previewNote}
          </p>
        </section>

        {/* sources, actions, memory */}
        <aside className="as2-side" aria-label="Context">
          <section>
            <h2 className="bd-label">{copy.side.actions}</h2>
            {convoActions.length ? (
              <ul className="as2-side__actions">
                {convoActions.map((a) => (
                  <li key={a.id}>
                    <Link href={`/app/actions?action=${a.id}`} className="as2-side__action">
                      <StatusIcon status={a.status} />
                      <span className="min-w-0">
                        <span className="ws-row__title">{a.title}</span>
                        <span className="ws-row__detail">{a.updated}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ws-cell-sub">None yet. Proposed actions appear here and wait in Actions & Approvals.</p>
            )}
          </section>
          <section>
            <h2 className="bd-label">{copy.side.sources}</h2>
            {convoSources.length ? (
              <ul className="ws-sources">
                {convoSources.map((s) => (
                  <li key={s.label + s.detail}>
                    <FileText aria-hidden="true" />
                    <Link href={s.href} className="ws-link">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ws-cell-sub">Every answer lists the emails, documents and records it rests on.</p>
            )}
          </section>
          <section>
            <h2 className="bd-label">{copy.side.knows}</h2>
            <ul className="as2-side__memory">
              {memory.slice(0, 4).map((m) => (
                <li key={m.id}>
                  {m.text}
                  <span className="ws-cell-sub">{m.source}</span>
                </li>
              ))}
            </ul>
            <Link href="/app/documents" className="ws-link mt-2">
              {copy.side.knowsMore}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Block({ block, action }: { block: AssistantBlock; action: (id: string) => WorkspaceAction | undefined }) {
  if (block.kind === "text") return <p className="as-text">{block.text}</p>;
  if (block.kind === "figures")
    return (
      <div className="as2-figures">
        {block.items.map((f) => (
          <div key={f.label}>
            <span className="bd-label">{f.label}</span>
            <span className="as2-figures__value tabular">{f.value}</span>
            {f.note && <span className="ws-cell-sub">{f.note}</span>}
          </div>
        ))}
      </div>
    );
  if (block.kind === "list")
    return (
      <div className="as2-list-block">
        {block.title && <p className="bd-label">{block.title}</p>}
        <ol>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      </div>
    );
  if (block.kind === "action") {
    const a = action(block.actionId);
    if (!a) return null;
    return (
      <Link href={`/app/actions?action=${a.id}`} className="as2-action">
        <StatusIcon status={a.status} />
        <span className="min-w-0 flex-1">
          <span className="ws-row__title">{a.title}</span>
          <span className="as2-action__meta">
            <ActionState status={a.status} />
            <span>{a.needsApproval ? "Needs your approval" : "Runs on its own"}</span>
          </span>
        </span>
        <span className="ws-link">
          Review
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </span>
      </Link>
    );
  }
  return (
    <ul className={cn("as2-sources")}>
      {block.items.map((s) => (
        <li key={s.label + s.detail}>
          <Link href={s.href}>
            <Chip>
              <FileText aria-hidden="true" className="size-3" />
              {s.label}
            </Chip>
            <span className="ws-cell-sub">{s.detail}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

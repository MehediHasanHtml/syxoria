"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCheck, FileText, LayoutGrid, MessagesSquare, Search, Stamp, Users, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ASSISTANT_HREF } from "@/lib/app-nav";
import type { SearchItem } from "@/types/workspace";

const KIND: Record<SearchItem["kind"], LucideIcon> = { Clients: Users, Documents: FileText, Conversations: MessagesSquare, Actions: CheckCheck, Decisions: Stamp, Pages: LayoutGrid };
const ORDER: SearchItem["kind"][] = ["Clients", "Actions", "Documents", "Conversations", "Decisions", "Pages"];

/**
 * Global search, from anywhere (the top bar's field, Ctrl K): one index across clients, actions,
 * documents, conversations, past decisions and pages, grouped by kind; and, always first, asking
 * Syxoria the question as typed. Arrow keys move, Enter opens, Escape closes.
 */
export function CommandSearch({ index }: { index: SearchItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hits = t ? index.filter((i) => `${i.title} ${i.detail} ${i.kind}`.toLowerCase().includes(t)) : index.filter((i) => i.kind === "Actions" || i.kind === "Clients").slice(0, 6);
    return ORDER.flatMap((k) => hits.filter((h) => h.kind === k));
  }, [q, index]);
  const items: { id: string; href: string }[] = [...(q.trim() ? [{ id: "ask", href: `${ASSISTANT_HREF}?q=${encodeURIComponent(q.trim())}` }] : []), ...results.map((r) => ({ id: r.id, href: r.href }))];

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAt((i) => (items.length ? (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length : 0));
    } else if (e.key === "Enter" && items[at]) {
      e.preventDefault();
      go(items[at].href);
    }
  };

  const offset = q.trim() ? 1 : 0;
  const indexOf = (id: string) => offset + results.findIndex((r) => r.id === id);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="gs-trigger">
        <Search aria-hidden="true" />
        <span className="gs-trigger__text">Search or ask Syxoria</span>
        <kbd>Ctrl K</kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label="Search"
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="gs-dialog dialog-motion"
      >
        <div className="gs-panel" onKeyDown={onKey}>
          <div className="gs-field">
            <Search aria-hidden="true" />
            <label htmlFor="gs-input" className="sr-only">
              Search clients, documents, conversations and actions, or ask Syxoria
            </label>
            <input
              ref={input}
              id="gs-input"
              type="text"
              autoComplete="off"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setAt(0);
              }}
              placeholder="Search clients, documents, conversations, actions"
              aria-controls="gs-results"
              aria-activedescendant={items[at] ? `gs-${items[at].id}` : undefined}
            />
            <kbd>Esc</kbd>
          </div>
          <div id="gs-results" role="listbox" aria-label="Results" className="gs-results">
            {q.trim() && (
              <button type="button" id="gs-ask" role="option" aria-selected={at === 0} onMouseEnter={() => setAt(0)} onClick={() => go(items[0].href)} className="gs-item gs-item--ask">
                <MessagesSquare aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="gs-item__title">Ask Syxoria: “{q.trim()}”</span>
                  <span className="gs-item__detail">Answered from your connected tools and company memory</span>
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            )}
            {ORDER.map((k) => {
              const group = results.filter((r) => r.kind === k);
              if (!group.length) return null;
              const Icon = KIND[k];
              return (
                <div key={k} role="group" aria-label={k}>
                  <p className="gs-group">{q.trim() ? k : k === "Actions" ? "Waiting or recent" : k}</p>
                  {group.map((r) => {
                    const i = indexOf(r.id);
                    return (
                      <button key={r.id} type="button" id={`gs-${r.id}`} role="option" aria-selected={at === i} onMouseEnter={() => setAt(i)} onClick={() => go(r.href)} className="gs-item">
                        <Icon aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="gs-item__title">{r.title}</span>
                          <span className="gs-item__detail">{r.detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {q.trim() && results.length === 0 && <p className="gs-empty">Nothing found for “{q.trim()}”. Syxoria can still look into it.</p>}
          </div>
        </div>
      </dialog>
    </>
  );
}

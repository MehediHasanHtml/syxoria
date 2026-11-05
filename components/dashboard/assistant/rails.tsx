"use client";

import Link from "next/link";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assistant as copy } from "@/content/assistant";
import { AUTONOMY_HREF } from "@/lib/app-nav";
import type { BriefingActionStatus } from "@/types";
import type { Conversation } from "@/types/workspace";

/** A conversation; `fresh` when it began on this visit */
export type Thread = Conversation & { fresh?: boolean };

/** What makes a conversation wait for the owner: one of its actions did not go through, or waits for them */
const WAITS: BriefingActionStatus[] = ["unsuccessful", "awaiting-approval", "drafted"];
const GROUPS = ["Today", "Yesterday", "Previous 7 days"] as const;

/**
 * The conversations, kept out of the way: a quiet panel at the edge, docked beside the stage and
 * toggled on wide screens, opening over the page on narrow ones (`modal`). By day, with a point
 * beside those that wait for the owner. At its foot, said once, how Syxoria works, and that this
 * is a preview.
 */
export function Threads({
  threads,
  open,
  statusOf,
  onOpen,
  onNew,
  drawer,
  modal,
  onClose,
  mode,
}: {
  threads: Thread[];
  open: string | null;
  statusOf: (id: string) => BriefingActionStatus | undefined;
  onOpen: (id: string) => void;
  onNew: () => void;
  drawer: boolean;
  /** Over the page (narrow screens): it takes the focus while open */
  modal: boolean;
  onClose: () => void;
  mode: string;
}) {
  const [filter, setFilter] = useState("");
  const close = useRef<HTMLButtonElement>(null);
  const shown = threads.filter((t) => t.title.toLowerCase().includes(filter.trim().toLowerCase()));
  const waits = (t: Thread) => t.actions.some((a) => WAITS.includes(statusOf(a) as BriefingActionStatus));

  useEffect(() => {
    if (drawer && modal) close.current?.focus();
  }, [drawer, modal]);

  return (
    <aside className="ar-threads" data-open={drawer || undefined} aria-label={copy.threads.title} aria-hidden={!drawer} inert={!drawer}>
      <div className="ar-threads__in">
        <div className="ar-threads__head">
          <h2 className="ar-threads__title">{copy.threads.title}</h2>
          <button ref={close} type="button" className="ar-threads__close" onClick={onClose}>
            <X aria-hidden="true" />
            <span className="sr-only">{copy.threads.close}</span>
          </button>
        </div>
        <div className="ar-threads__tools">
          <button type="button" className="ar-new" onClick={onNew}>
            <Plus aria-hidden="true" />
            {copy.threads.newConversation}
          </button>
          <label className="ar-find">
            <Search aria-hidden="true" />
            <span className="sr-only">{copy.threads.search}</span>
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={copy.threads.search} />
          </label>
        </div>
        <div className="ar-threads__list">
          {shown.length ? (
            GROUPS.map((g) => {
              const items = shown.filter((t) => t.group === g);
              if (!items.length) return null;
              return (
                <section key={g}>
                  <h3 className="ar-threads__group">{copy.threads.groups[g]}</h3>
                  <ul>
                    {items.map((t) => (
                      <li key={t.id}>
                        <button type="button" className="ar-convo" aria-current={t.id === open ? "true" : undefined} onClick={() => onOpen(t.id)}>
                          <span className="ar-convo__title">
                            {waits(t) && (
                              <span className="ar-convo__waits">
                                <span className="sr-only">{copy.threads.waits}: </span>
                              </span>
                            )}
                            {t.title}
                          </span>
                          <span className="ar-convo__at tabular">{t.fresh ? copy.threads.now : g === "Yesterday" ? "" : t.updated}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          ) : (
            <p className="ar-quiet">{copy.threads.none}</p>
          )}
        </div>
        <div className="ar-threads__foot">
          <p>{copy.mandate(mode)}</p>
          <Link href={AUTONOMY_HREF} className="ar-more">
            {copy.mandateLink}
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="ar-preview">{copy.previewNote}</p>
        </div>
      </div>
    </aside>
  );
}

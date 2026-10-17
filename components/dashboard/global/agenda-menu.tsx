"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { CalendarEvent } from "@/types/workspace";

const KIND: Record<CalendarEvent["kind"], string> = { meeting: "Meeting", call: "Call", deadline: "Deadline", "follow-up": "Follow up", action: "Scheduled action" };

/**
 * The intelligent calendar, from the top bar: what is coming up across meetings, calls, deadlines,
 * follow ups and the actions Syxoria has scheduled, by day. Each line opens what it concerns.
 */
export function AgendaMenu({ events }: { events: CalendarEvent[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const days = Array.from(new Set(events.map((e) => e.day)));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} aria-label="Agenda" onClick={() => setOpen((o) => !o)} className="gs-icon">
        <CalendarDays className="size-[18px]" aria-hidden="true" />
      </button>
      <div id={id} role="region" aria-label="Agenda" hidden={!open} className="gs-pop">
        <div className="gs-pop__head">
          <p className="gs-pop__title">Coming up</p>
          <span className="gs-pop__sub">Meetings, deadlines, follow ups and scheduled actions</span>
        </div>
        <div className="gs-pop__body">
          {days.map((d) => (
            <section key={d}>
              <p className="gs-group">{d}</p>
              <ul>
                {events
                  .filter((e) => e.day === d)
                  .map((e) => (
                    <li key={e.id}>
                      <Link href={e.href} onClick={() => setOpen(false)} className="gs-event" data-kind={e.kind}>
                        <span className="gs-event__time tabular">{e.time}</span>
                        <span className="min-w-0 flex-1">
                          <span className="gs-item__title">{e.title}</span>
                          <span className="gs-item__detail">{[KIND[e.kind], e.with, e.note].filter(Boolean).join(" · ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

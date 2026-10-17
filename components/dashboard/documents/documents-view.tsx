"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileSpreadsheet, Link2, FileText, FileType, Image as ImageIcon, Plus, Presentation, Search, Upload, type LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { IntegrationLogo } from "@/components/shared/integration-logo";
import { Chip, KpiRow, Panel, WsHead } from "@/components/dashboard/ws/kit";
import { Button } from "@/components/ui/button";
import type { DocCategory, MemoryItem, WorkspaceDoc, WorkspaceTool } from "@/types/workspace";

const TYPE_ICON: Record<WorkspaceDoc["type"], LucideIcon> = { PDF: FileText, DOCX: FileType, XLSX: FileSpreadsheet, CSV: FileSpreadsheet, PPTX: Presentation, PNG: ImageIcon };
const CATEGORIES: ("All" | DocCategory)[] = ["All", "Proposals", "Contracts", "Invoices", "Reports", "Briefs", "Data"];
const SOURCES = ["Every source", "Uploaded", "Google Drive", "Gmail", "HubSpot"];
const READ: Record<WorkspaceDoc["read"], { word: string; tone: "emerald" | "neutral" | "warn" }> = {
  read: { word: "Read", tone: "emerald" },
  reading: { word: "Reading", tone: "neutral" },
  "not read": { word: "Not read yet", tone: "warn" },
};
const GROUPS: MemoryItem["group"][] = ["Business context", "Objectives", "Preferences", "Key facts"];

type View = "documents" | "memory" | "sources";

/**
 * Documents & Data: the company's documents (uploaded or from connected tools) by category, with
 * search and filters, one open with what Syxoria understood from it and what it can do with it;
 * the company's memory, every item with where it came from, to correct or remove; and the sources
 * Syxoria reads. Uploading here is a preview: the file stays in the browser.
 */
export function DocumentsView({ documents, memory, tools, initial }: { documents: WorkspaceDoc[]; memory: MemoryItem[]; tools: WorkspaceTool[]; initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("documents");
  const [docs, setDocs] = useState(documents);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [source, setSource] = useState(SOURCES[0]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(initial && documents.some((d) => d.id === initial) ? initial : documents[0].id);
  const [forgotten, setForgotten] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState<MemoryItem[]>([]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => (category === "All" || d.category === category) && (source === SOURCES[0] || d.source === source) && (!q || [d.name, d.client ?? "", d.summary].some((v) => v.toLowerCase().includes(q))));
  }, [docs, category, source, query]);
  const doc = docs.find((d) => d.id === open) ?? docs[0];
  const sources = tools.filter((t) => t.status !== "available" && t.status !== "planned");
  const choose = (id: string) => {
    setOpen(id);
    router.replace(`${pathname}?doc=${id}`, { scroll: false });
  };

  const onUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const id = `up_${Date.now()}`;
    const ext = file.name.split(".").pop()?.toUpperCase();
    const type: WorkspaceDoc["type"] = ext === "DOCX" || ext === "XLSX" || ext === "PPTX" || ext === "CSV" || ext === "PNG" ? ext : "PDF";
    const entry: WorkspaceDoc = {
      id,
      name: file.name.replace(/\.[^.]+$/, ""),
      type,
      category: "Briefs",
      source: "Uploaded",
      owner: "Maël Laurent",
      modified: "Just now",
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      read: "reading",
      summary: "Preview: in the product, Syxoria reads the file now and adds what it learns to the company memory. Here the file stays in your browser.",
      facts: [{ label: "Status", value: "Preview upload" }],
      uses: [],
    };
    setDocs((d) => [entry, ...d]);
    setOpen(id);
    window.setTimeout(() => setDocs((d) => d.map((x) => (x.id === id ? { ...x, read: "read" } : x))), 1600);
  };

  const kept = [...added, ...memory].filter((m) => !forgotten.includes(m.id));

  return (
    <div className="ws">
      <WsHead eyebrow="Knowledge" title="Documents & Data" lead="Your documents and what Syxoria knows about the company, with where every piece of information comes from.">
        <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onUpload(e.target.files)} />
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden="true" />
          Upload a document
        </Button>
      </WsHead>

      <KpiRow
        label="Knowledge at a glance"
        items={[
          { id: "d", label: "Documents", value: "318", caption: "read and understood", delta: { text: "4 waiting for Google Drive", direction: "up", good: false } },
          { id: "m", label: "Company memory", value: String(kept.length), caption: "facts, objectives and preferences", delta: { text: "2 learned today", direction: "up", good: true } },
          { id: "s", label: "Connected sources", value: String(sources.length), caption: "one needs reconnecting", delta: { text: "Gmail synced 2 minutes ago", direction: "up", good: true } },
          { id: "u", label: "Used in today’s work", value: "11", caption: "documents behind today’s actions", delta: { text: "Every draft cites its sources", direction: "up", good: true } },
        ]}
      />

      <div role="tablist" aria-label="Show" className="ws-subnav">
        <button type="button" role="tab" aria-selected={view === "documents"} onClick={() => setView("documents")}>
          Documents <span className="ws-count">{docs.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === "memory"} onClick={() => setView("memory")}>
          Company memory <span className="ws-count">{kept.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === "sources"} onClick={() => setView("sources")}>
          Sources <span className="ws-count">{sources.length}</span>
        </button>
      </div>

      {view === "documents" && (
        <>
          <div className="ws-toolbar">
            <div className="ws-chips" role="group" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="ws-toolbar__tools">
              <label className="ws-search">
                <Search aria-hidden="true" />
                <span className="sr-only">Search documents</span>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, clients, contents" />
              </label>
              <label className="ws-select">
                <span className="sr-only">Source</span>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="ws-grid ws-grid--split">
            <Panel title="Documents" meta={`${list.length} shown`}>
              {list.length === 0 ? (
                <p className="ws-empty">No document matches. Try another word or category.</p>
              ) : (
                <ul className="ws-docs" role="listbox" aria-label="Open a document">
                  {list.map((d) => {
                    const Icon = TYPE_ICON[d.type];
                    return (
                      <li key={d.id} role="option" aria-selected={d.id === doc.id}>
                        <button type="button" onClick={() => choose(d.id)} className="ws-doc">
                          <span className="ws-doc__icon" data-type={d.type} aria-hidden="true">
                            <Icon strokeWidth={1.6} />
                          </span>
                          <span className="min-w-0">
                            <span className="ws-doc__name">{d.name}</span>
                            <span className="ws-doc__meta">
                              {d.type} · {d.category}
                              {d.client && <> · {d.client}</>} · {d.source}
                            </span>
                          </span>
                          <span className="ws-doc__date ws-hide-sm">
                            <span>{d.modified}</span>
                            <span>{d.size}</span>
                          </span>
                          <Chip tone={READ[d.read].tone}>{READ[d.read].word}</Chip>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Document" meta={doc.category}>
              <article key={doc.id} className="ws-detail">
                <div className="ws-docview">
                  <span className="ws-doc__icon ws-doc__icon--lg" data-type={doc.type} aria-hidden="true">
                    {(() => {
                      const Icon = TYPE_ICON[doc.type];
                      return <Icon strokeWidth={1.4} />;
                    })()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="ws-detail__title">{doc.name}</h2>
                    <p className="ws-cell-sub">
                      {doc.type} · {doc.size} · {doc.source} · {doc.owner} · {doc.modified}
                    </p>
                  </div>
                </div>
                <section className="ws-detail__block">
                  <h3 className="bd-label">What Syxoria understood</h3>
                  <p className="ws-detail__purpose">{doc.summary}</p>
                </section>
                <dl className="ws-facts">
                  {doc.facts.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
                {doc.uses.length > 0 && (
                  <section className="ws-detail__block">
                    <h3 className="bd-label">Used in</h3>
                    <ul className="ws-sources">
                      {doc.uses.map((u) => (
                        <li key={u}>
                          <Link2 aria-hidden="true" />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <section className="ws-detail__block">
                  <h3 className="bd-label">Ask Syxoria to</h3>
                  <div className="ws-asks">
                    {["Summarise it in three lines", "Draft a follow up from it", "Extract dates and amounts", "Compare with the previous version"].map((q) => (
                      <Link key={q} href={`/app/assistant?q=${encodeURIComponent(`${q}: ${doc.name}`)}`}>
                        {q}
                      </Link>
                    ))}
                  </div>
                </section>
              </article>
            </Panel>
          </div>
        </>
      )}

      {view === "memory" && (
        <div className="ws-grid ws-grid--split">
          <Panel title="What Syxoria knows" meta="Every item says where it came from">
            <div className="ws-memory">
              {GROUPS.map((g) => (
                <section key={g}>
                  <h3 className="bd-label">{g}</h3>
                  <ul>
                    {kept
                      .filter((m) => m.group === g)
                      .map((m) => (
                        <li key={m.id} className="ws-memory__item">
                          <span className="min-w-0">
                            <span className="ws-memory__text">{m.text}</span>
                            <span className="ws-cell-sub">
                              {m.source} · learned {m.learned}
                            </span>
                          </span>
                          <button type="button" className="ws-link" onClick={() => setForgotten((f) => [...f, m.id])}>
                            Forget
                          </button>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </Panel>
          <Panel title="Teach Syxoria">
            <form
              className="ws-teach"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                setAdded((a) => [{ id: `m_new_${Date.now()}`, group: "Preferences", text: note.trim(), source: "Told by Maël", learned: "just now" }, ...a]);
                setNote("");
              }}
            >
              <label htmlFor="ws-teach" className="ws-cell-sub">
                Something it should always keep in mind: a preference, an objective, a fact about a client.
              </label>
              <textarea id="ws-teach" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: we never work with tobacco brands." />
              <Button type="submit" size="sm" disabled={!note.trim()}>
                <Plus aria-hidden="true" />
                Add to the memory
              </Button>
            </form>
            <p className="ws-note">Syxoria only learns from the sources you connected and what you tell it. Nothing leaves your workspace. Forgetting an item removes it from every future analysis.</p>
          </Panel>
        </div>
      )}

      {view === "sources" && (
        <Panel title="Where the information comes from" link={{ href: "/app/integrations", label: "Manage integrations" }}>
          <ul className="ws-sources-list">
            {sources.map((t) => (
              <li key={t.id} data-status={t.status}>
                <span className="ws-tool__logo" aria-hidden="true">
                  {t.logo ? <IntegrationLogo id={t.logo} size={18} /> : <span>{t.name.charAt(0)}</span>}
                </span>
                <span className="min-w-0">
                  <span className="ws-row__title">{t.name}</span>
                  <span className="ws-row__detail">
                    {t.purpose} · {t.items}
                  </span>
                </span>
                <span className="ws-cell-sub ws-hide-sm">{t.synced}</span>
                <Chip tone={t.status === "connected" ? "emerald" : t.status === "error" ? "warn" : "neutral"}>{t.status === "connected" ? "Connected" : t.status === "error" ? "Reconnect" : t.status === "syncing" ? "Syncing" : "Renew soon"}</Chip>
              </li>
            ))}
            <li data-status="connected">
              <span className="ws-tool__logo" aria-hidden="true">
                <Upload className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="ws-row__title">Your uploads</span>
                <span className="ws-row__detail">Brand book, contracts, quotes · 41 files</span>
              </span>
              <span className="ws-cell-sub ws-hide-sm">Today 12:50</span>
              <Chip tone="emerald">Read</Chip>
            </li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

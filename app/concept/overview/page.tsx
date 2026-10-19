import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReviewStrip } from "@/components/concept/overview/shared";

export const metadata: Metadata = { title: "Review notes" };

/**
 * The review board for the two Executive Overview concepts: what each one is, how they compare on
 * the brief's criteria, which one we recommend and why, and where every capability lives in the
 * six spaces. Copy written without dashes, hyphenated words or decorative numbers.
 */

const CONCEPTS = [
  {
    tag: "Concept A",
    name: "Executive Command Center",
    href: "/concept/overview/command-center",
    idea: "The overview as an edition of the business. One lead set in type alone, the reasoning beneath it like a short story, what waits for you in the margin, and the figures closing the page.",
    how: [
      "The day’s three briefings are its editions, chosen from the dateline. Earlier days live in Workspace & History.",
      "The priority leads as a headline, its figure beside it. Why? opens what it rests on.",
      "The recommendation is Syxoria’s voice, in emerald, with the actions that carry it out and their state.",
      "Approvals, the agenda and the other alerts run down the margin. The business figures close the page as evidence.",
    ],
    strengths: ["The clearest hierarchy: the priority cannot be missed.", "Reads like a calm document, which suits owners who skim.", "Reflows naturally on tablets and phones.", "The simplest grammar to extend to every other space."],
    tradeoffs: ["The Core is only a small presence in the bar.", "Less immersive: closer to a beautiful report than to a new kind of product.", "On small laptops the story continues below the first screen."],
  },
  {
    tag: "Concept B",
    name: "Living Intelligence",
    href: "/concept/overview/living",
    idea: "The overview as one place around the Core. The parts of the business sit on a quiet ring around it, the briefing speaks on the left, the reasoning runs as one thread on the right, and what waits rests along the bottom.",
    how: [
      "Choose Sales, Clients, Finance, Marketing or Goals on the ring and the whole environment turns to that part of the business, without leaving the page.",
      "One question of the thread is open at a time. The Core takes the look of the step in view: it identifies, understands, proposes, acts.",
      "Ask Syxoria sits under the Core: the assistant is the Core you speak to.",
      "Suspending Syxoria dims the Core. A single workflow can be paused from the action it runs.",
    ],
    strengths: ["The direct continuation of the website and the onboarding: the same Core, the same stage.", "The most distinctive: nothing in business software looks like it.", "Business Management is one click away inside the overview, which removes pages.", "Fits one screen on a desktop, like the briefing."],
    tradeoffs: ["The priority shares the stage with the Core: its title needs to lead more strongly.", "Needs care at every size: on phones the thread moves above the Core.", "The ring must stay at five lenses or fewer, or it turns into a diagram."],
  },
];

const CRITERIA: { label: string; a: string; b: string; stronger: "A" | "B" | "Even" }[] = [
  { label: "Connection to the Syxoria identity", a: "Type and palette; the Core only in the bar.", b: "The Core on stage, as in the onboarding.", stronger: "B" },
  { label: "Distinctiveness and artistic quality", a: "An editorial page: refined, but a known form.", b: "A space of its own.", stronger: "B" },
  { label: "Clarity of the primary priority", a: "Unmistakable: a headline.", b: "Clear in the thread, but the briefing sentence leads.", stronger: "A" },
  { label: "Simplicity of navigation", a: "Six words in the masthead.", b: "Six spaces in one pill, a floating bar on phones.", stronger: "Even" },
  { label: "Information hierarchy", a: "Lead, story, margin, figures.", b: "Voice, Core, thread, dock: more to scan at once.", stronger: "A" },
  { label: "Access to detail", a: "Why?, the approval sheet, the full briefing.", b: "The same, plus every business lens in place.", stronger: "B" },
  { label: "Continuity from briefing to outcome", a: "Read from top to bottom.", b: "One thread, and the Core follows it.", stronger: "B" },
  { label: "Responsive behaviour", a: "Reflows as a page.", b: "Recomposed for each size.", stronger: "A" },
  { label: "Feasibility in this codebase", a: "Mostly layout and type.", b: "Reuses the Core and the briefing; one screen needs tuning.", stronger: "A" },
];

const SPACES = [
  { name: "Executive Overview", holds: "The priority and its reasoning, approvals waiting, what is already done, the three daily briefings with the full dial, the figures." },
  { name: "Business Management", holds: "Sales, Marketing, Finance, Goals & KPIs, Clients & Prospects, as views of one business. In Concept B they are the lenses on the ring." },
  { name: "Syxoria Assistant", holds: "Questions, analyses and prepared actions. Reached from search (Ctrl K), from Ask about this on any priority, and from the field under the Core." },
  { name: "Actions & Approvals", holds: "Suggested, drafted, awaiting approval, approved, scheduled, in progress, sent, completed, unsuccessful. Every action opens with why it exists and what it will send." },
  { name: "Workspace & History", holds: "Documents and data, history and reports, earlier briefings, decisions, company memory." },
  { name: "Integrations & Settings", holds: "Connected tools, permissions, autonomy modes, the company, the account." },
];

export default function OverviewReview() {
  return (
    <>
      <ReviewStrip first={false} toggle={false} />
      <main className="cr">
        <header className="cr-head">
          <p className="cx-label">Executive Overview · Design exploration</p>
          <h1 className="cr-title">Two ways into the business.</h1>
          <p className="cr-intro">
            Both concepts answer the same five questions with the same data: what matters now, why it matters, what Syxoria recommends, what it can do, and what is
            already done. They differ in how the owner enters that story. Neither changes the current workspace: open them, switch between the briefings of the day,
            approve something, suspend Syxoria, and compare.
          </p>
        </header>

        <section className="cr-concepts" aria-label="The two concepts">
          {CONCEPTS.map((c) => (
            <article key={c.tag} className="cr-concept">
              <p className="cx-label">{c.tag}</p>
              <h2 className="cr-concept__name">{c.name}</h2>
              <p className="cr-concept__idea">{c.idea}</p>
              <Link href={c.href} className="cx-btn cx-btn--primary cr-concept__open">
                Open {c.tag}
                <ArrowRight aria-hidden="true" />
              </Link>
              <div className="cr-concept__cols">
                <div className="cr-concept__how">
                  <p className="cx-label">How it works</p>
                  <ul>
                    {c.how.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="cx-label">Strengths</p>
                  <ul>
                    {c.strengths.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p className="cx-label cr-gap">Trade offs</p>
                  <ul>
                    {c.tradeoffs.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="cr-section" aria-labelledby="cr-eval">
          <h2 id="cr-eval" className="cr-h2">
            Against the brief
          </h2>
          <div className="cr-table" role="table" aria-label="The two concepts against the criteria">
            <div role="row" className="cr-row cr-row--head">
              <span role="columnheader">Criterion</span>
              <span role="columnheader">Concept A</span>
              <span role="columnheader">Concept B</span>
              <span role="columnheader">Stronger</span>
            </div>
            {CRITERIA.map((c) => (
              <div role="row" key={c.label} className="cr-row">
                <span role="rowheader" className="cr-row__label">
                  {c.label}
                </span>
                <span role="cell" data-lead={c.stronger === "A" || undefined}>
                  {c.a}
                </span>
                <span role="cell" data-lead={c.stronger === "B" || undefined}>
                  {c.b}
                </span>
                <span role="cell" className="cr-row__verdict">
                  {c.stronger === "Even" ? "Even" : `Concept ${c.stronger}`}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="cr-section cr-reco" aria-labelledby="cr-reco">
          <p className="cx-label cr-reco__label">Our recommendation</p>
          <h2 id="cr-reco" className="cr-reco__title">
            Concept B, with the hierarchy of Concept A.
          </h2>
          <div className="cr-reco__body">
            <p>
              The brief asks for a premium, distinctive Syxoria experience that continues the website and the onboarding, with the Brain and the Core used intentionally.
              Concept B is the only one of the two that does that, and it removes the most navigation: the five business lenses become part of the overview itself.
            </p>
            <p>
              Concept A is clearer, and B should keep that clarity: the priority’s own title leads on the left, set as large as A’s headline, with the briefing’s sentence
              moving under the greeting. The Core stays on two screens only, the Overview and the Assistant. Every other space uses A’s editorial grammar (a lead, its
              story, a margin), so the platform stays readable and the Core keeps its meaning.
            </p>
            <p>
              Once a direction is chosen: the shared shell and navigation, the overview with the briefing inside it, and the assistant entry. Then Business, Actions,
              Workspace and Settings move to the same system, one at a time.
            </p>
          </div>
        </section>

        <section className="cr-section" aria-labelledby="cr-spaces">
          <h2 id="cr-spaces" className="cr-h2">
            Six spaces instead of ten pages
          </h2>
          <dl className="cr-spaces">
            {SPACES.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>{s.holds}</dd>
              </div>
            ))}
            <div className="cr-spaces__all">
              <dt>Everywhere, without a page of its own</dt>
              <dd>
                Search and the assistant (Ctrl K), notifications, the agenda, Syxoria’s status with the global kill switch, a pause on each workflow where it appears, Why?
                on every step, and sources on every action.
              </dd>
            </div>
          </dl>
        </section>

        <section className="cr-section cr-notes" aria-label="What is simulated">
          <p className="cx-label">What is simulated</p>
          <ul>
            <li>Approving and suspending are simulated. Holds are kept in this browser only, approvals on the page only. Nothing is sent.</li>
            <li>The spaces other than the Overview open the current pages until a direction is chosen.</li>
            <li>New user view shows the first day: the morning briefing has nothing earlier to compare with, and its history starts when the tools were connected.</li>
            <li>Open the full briefing shows the approved briefing dial, unchanged.</li>
          </ul>
        </section>
      </main>
    </>
  );
}

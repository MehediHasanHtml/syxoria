# Syxoria — Frontend

Marketing website + SaaS product frontend for **Syxoria**, built from the "growth tree" creative concept.
Production-quality UI on typed mock data, with clean boundaries for auth, API, billing and real-time features.

> **Growth → Progression → Intelligence → Transformation.**
> The tree is the evolution, the curve is the advancement, the product UI is the mechanism — and motion connects the three.

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (Turbopack)
pnpm lint
```

| Route | What it is |
| --- | --- |
| `/` | Marketing site (hero tree, live product preview, story, modules, curve, pricing, FAQ…) |
| `/login`, `/signup` | Auth screens (UI + validation; **not connected**) |
| `/legal/[notice\|privacy\|terms]` | Legal pages (**placeholder copy**) |
| `/app` | Product: Overview dashboard |
| `/app/projects`, `/app/projects/[id]` | Project list (search/filter/sort/create) and detail |
| `/app/analytics?range=7d\|30d\|90d\|12m` | Analytics with shareable range URLs |
| `/app/insights` | Nexo recommendations (apply / dismiss / undo, locked, processing) |
| `/app/activity` | Day-grouped, filterable history |
| `/app/settings?tab=account\|workspace\|notifications\|security` | Settings with full form states |

**Stack:** Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript (strict) · Tailwind CSS v4 · lucide-react · tailwind-merge.
No animation library: all motion is CSS/SVG + IntersectionObserver, which keeps client JS minimal.

---

## Architecture

```
app/
  (marketing)/          public site — Header + Footer layout, home, legal
  (auth)/               login / signup — split layout with the tree
  (app)/app/            product — AppShell layout, loading.tsx, error.tsx, pages
  robots.ts sitemap.ts opengraph-image.tsx icon.svg not-found.tsx
components/
  ui/                   primitives: button, field (input/select/textarea), dialog, tabs,
                        accordion, menu, switch, tooltip, badge, card, progress, avatar, spinner
  shared/               logo, reveal, section-heading, module-icon, status badges, states
  marketing/            hero, growth-tree, product preview (real app screenshots), story, curve, sections
  dashboard/            app shell, sidebar, topbar, overview-dashboard,
                        charts/, metric-card, insight-card,
                        projects-view, create-project-dialog, settings/…
  auth/                 login + signup forms
content/                marketing + legal copy (CMS/i18n-ready, no layout code)
lib/
  mock-data/            ALL fake data lives here — nothing else imports it except /services
  hooks/                use-in-view, use-reduced-motion
  tree-geometry.ts      deterministic procedural tree
  chart.ts format.ts cn.ts site-config.ts app-nav.ts
services/               the ONLY data boundary the UI talks to
types/                  domain types (the UI ↔ API contract)
```

Server Components fetch through `services/*` and pass typed, serialisable props to Client Components.
Client components only exist where there is interaction (tabs, dialogs, forms, charts' hover, scroll stages).

---

## Connecting the backend

Every service function is `async`, typed, and marked with `TODO(api)` / `TODO(auth)`:

| File | Functions |
| --- | --- |
| `services/projects.ts` | `getProjects`, `getProject`, `createProject`, `queryProjects` (pure filter/sort) |
| `services/analytics.ts` | `getOverviewMetrics`, `getAnalyticsReport(range)` |
| `services/insights.ts` | `getInsights`, `getInsightsForProject`, `updateInsightStatus` |
| `services/activity.ts` | `getActivity`, `getProjectActivity`, `getIntegrations` |
| `services/user.ts` | `getCurrentUser`, `getMembers`, `getPresence`, `getWorkspace`, `getNotifications`, preferences, updates |
| `services/auth.ts` | `signIn`, `signUp` — replace with Server Actions + httpOnly session cookie |
| `services/preview.ts` | data for the marketing site's live previews |

Swap a body for `apiFetch<T>(…)` (see `services/_client.ts`) and keep the signature — pages and components don't change.
Map API payloads to `types/index.ts` inside the service if shapes differ. Errors should be thrown as `ServiceError` (`code`: `not_found | validation | unauthorized | network | unknown`); forms already render these.

Other integration points:
- **Auth guard:** `app/(app)/app/layout.tsx` (`TODO(auth)`) or a `proxy.ts` (Next 16's renamed middleware).
- **Billing portal:** `components/dashboard/settings/workspace-settings.tsx` (`TODO(billing)`).
- **Error reporting:** `app/(app)/app/error.tsx` (`TODO(observability)`).
- **Env:** only `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` are read on the client. Never put secrets in `NEXT_PUBLIC_*`.

Handy QA hooks in the mocks: project name **"error"** → create failure · email ending **@example.invalid** → profile save error · signup email starting **taken@** → "already registered" · login password **< 8 chars** → wrong credentials.

---

## Design system

All tokens live in **`app/globals.css`** (`@theme`) and are consumed as Tailwind utilities (`bg-surface`, `text-fg-2`, `border-line`, `ease-out-soft`…).

- **Color** — canvas `#08090A/#0D0F10/#111315`, surfaces `#151719/#191B1D/#202225`, lines `#292C2F/#34373A`, text `#F5F5F2/#A5A8AA/#7D8184`.
  One restrained accent — **warm light `#D6A871`** from the concept — used for growth, focus and "now". Status colours are muted and always paired with an icon/label.
  (`fg-3` is lifted from `#707477` to `#7D8184` so small text keeps ≥ 4.5:1 contrast.)
- **Type** — Geist (UI), Geist Mono, and **Sora** (`font-display`) for h1/h2 and the light, warm-coloured accent line in headings. Fluid scale: `text-display` (38→84px), `text-headline` (31→60px), `text-title`, `text-lead`.
- **Radius** — tight: 3 / 5 / 8 / 12 / 16px. **Elevation** — hairlines first, shadows barely (`shadow-panel`, `shadow-float`, `shadow-glow`).
- **Motion** — `--dur-fast 180ms`, `--dur-base 320ms`, `--dur-slow 700ms`; easings `ease-out-soft`, `ease-in-out-soft`, `ease-spring`.
- **Layers** — `--z-sticky/header/overlay/toast`. **Layout** — `container-page`, `--gutter`, `--header-h`.
- `cn()` uses tailwind-merge configured with these tokens — if you add a token namespace, register it in `lib/cn.ts`.

Component states covered: buttons (hover/active/focus/disabled/loading), fields (focus/filled/error/success/disabled), cards (interactive/selected/disabled), tables (loading skeleton/empty/filtered-empty/error boundary/populated), insights (new/in-review/processing/applied/dismissed/locked), forms (validation/saving/saved/server error).

---

## The growth tree

`lib/tree-geometry.ts` grows a bonsai procedurally from a fixed seed (same tree every render → server-rendered, cacheable, no hydration risk).
`components/marketing/growth-tree.tsx` renders it as **stacked layers** so continuous motion never re-rasterises the dense canopy:
base (prism, roots) · tree (GPU-composited sway) · light pulses · dust.

Parent contract: `--grow` (0–1) reveals growth nodes and module labels · `data-focus="roots|trunk|branches|canopy|fruit"` spotlights a part · `data-paused` halts loops.
- Hero: `hero-tree-stage.tsx` drives `--grow` from scroll (rAF-throttled, only while visible) + pointer parallax.
- How it works: `growth-story.tsx` spotlights the part of the tree that matches the stage in view.
- Offscreen trees pause all animation. `prefers-reduced-motion` gets the fully grown, static tree.

The progression curve (`progress-curve.tsx`) accepts any `points[]` + stage indices, so real growth data can drive it.

---

## Product screenshots

The home page preview uses real screenshots of `/app` in `public/product/` (1440×900 @2x, served through `next/image`).
After UI changes, re-capture them from a production build (no dev badge):

```bash
pnpm build && pnpm start -p 3100
chrome --headless=new --hide-scrollbars --force-device-scale-factor=2 --window-size=1440,900   --virtual-time-budget=8000 --screenshot=public/product/dashboard-overview.png http://localhost:3100/app
# same for /app/insights → dashboard-insights.png and /app/projects → dashboard-projects.png
```

## Accessibility & performance

- Semantic landmarks, one H1 per page, skip links, visible focus (`:focus-visible` accent ring).
- Native `<dialog>` for modals and mobile nav (focus trap, Esc, inert background); WAI-ARIA tabs with roving tabindex; menu button pattern; accordion; `role="switch"`; progressbars; live regions for async results.
- Status never relies on colour alone. Charts expose text summaries to screen readers.
- Reduced motion honoured globally and per component.
- Marketing pages are statically prerendered; the product tour is code-split and only loaded on intent; scroll work uses IntersectionObserver or passive rAF-throttled listeners; animations use `transform`/`opacity`/`stroke-dashoffset`.

## SEO

Metadata + title template, canonical URLs, Open Graph / Twitter cards with a generated OG image, `robots.txt` (disallows `/app`), `sitemap.xml`, JSON-LD (Organization, SoftwareApplication with offers, FAQPage), product area set to `noindex`.
Set `NEXT_PUBLIC_SITE_URL` in production.

---

## QA performed

- `pnpm lint`, `tsc --noEmit`, `pnpm build` — clean.
- No horizontal overflow on every route at 320 · 768 · 1024 · 1440 · 1920 px (automated check).
- No hydration errors or Next dev-overlay issues on any route.
- Interaction tests: product tour (all steps, approve flow, Esc/focus return/scroll lock), create project (validation → server error → success → toast → draft row), filtered-empty state, insight apply (loading → applied, live counts).

## Placeholders to replace before launch

- **Copy & numbers** are illustrative (the concept stated its content is not final). Copy is English; the concept was French — `content/` is structured for i18n dictionaries.
- **Testimonial, metrics and security/compliance claims** must be confirmed by the business before publishing.
- **Legal pages** contain placeholder text.
- **Integration logos** (`public/integrations/`, from svgl.app and Simple Icons) are the brands' own marks: confirm use with each partner's brand guidelines before launch. PayPal replaced Qonto, which has no public logo asset.
- **App Store / Google Play** links: set `siteConfig.appLinks` (currently render a "coming soon" state).
- Projects created in the demo live only in the browser session (marked **Draft**) until `createProject` persists them.

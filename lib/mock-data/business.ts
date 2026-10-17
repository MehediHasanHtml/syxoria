import type { TimePoint } from "@/types";
import type { FinanceData, GoalsData, MarketingData, Period, SalesData } from "@/types/workspace";

/**
 * Business Management for Northfield Studio (a design studio, 15 people), on the demo day,
 * Wednesday 14 October 2026. The same story as the briefings and the home: Atelier Rive signs by
 * Friday, Maison Lenoir wants to start in March, Nora's quote bounced, Brasserie Ondine pays on
 * Monday. Every figure is fictional. The UI reads this through services/business.ts.
 * No dashes or hyphenated words in UI copy.
 */

export const periods: Period[] = [
  { id: "month", label: "This month" },
  { id: "half", label: "Last 6 months" },
  { id: "year", label: "Last 12 months" },
];

const MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
const months = (values: number[]): TimePoint[] => values.map((value, i) => ({ date: `${MONTHS[MONTHS.length - values.length + i]}-01`, value }));
const WEEKS = ["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"];
const weeks = (values: number[]): TimePoint[] => values.map((value, i) => ({ date: WEEKS[i], value }));

/** Invoiced revenue by month, November 2025 to October 2026 (October to date), and the year before */
const REVENUE = [52400, 58100, 44900, 49300, 56800, 61200, 59700, 63400, 54100, 41800, 66300, 64200];
const REVENUE_LY = [46100, 50200, 39800, 43500, 49900, 52600, 54300, 55000, 47900, 36400, 57800, 59300];

/* ==========================================================================
 * SALES
 * ========================================================================== */
export const mockSales: SalesData = {
  periods: {
    month: {
      kpis: [
        { id: "revenue", label: "Revenue", value: "€64,200", caption: "invoiced since 1 October", delta: { text: "12% on September at this date", direction: "up", good: true }, spark: REVENUE.slice(-6) },
        { id: "won", label: "Contracts signed", value: "2", caption: "€33,600, Domaine Castel and Galerie Sorel", delta: { text: "1 more than September", direction: "up", good: true }, spark: [1, 2, 1, 0, 1, 2] },
        { id: "open", label: "Active opportunities", value: "7", caption: "worth €139,600", delta: { text: "2 new this month", direction: "up", good: true }, spark: [5, 6, 5, 6, 5, 7] },
        { id: "win", label: "Proposal win rate", value: "38%", caption: "proposals signed", delta: { text: "7 points under your goal", direction: "down", good: false }, spark: [42, 41, 40, 39, 39, 38] },
      ],
      chart: { label: "Revenue by week, last eight weeks", series: weeks([9800, 14200, 22400, 11900, 18700, 13500, 41600, 22600]) },
    },
    half: {
      kpis: [
        { id: "revenue", label: "Revenue", value: "€349,500", caption: "invoiced, May to October", delta: { text: "9% on the six months before", direction: "up", good: true }, spark: REVENUE.slice(-6) },
        { id: "won", label: "Contracts signed", value: "19", caption: "9 with new clients, 4 through referrals", delta: { text: "3 more than the six months before", direction: "up", good: true }, spark: [3, 4, 3, 2, 4, 3] },
        { id: "open", label: "Active opportunities", value: "7", caption: "worth €139,600", delta: { text: "2 new this month", direction: "up", good: true }, spark: [5, 6, 5, 6, 5, 7] },
        { id: "win", label: "Proposal win rate", value: "41%", caption: "19 of 46 proposals signed", delta: { text: "2 points under the year before", direction: "down", good: false }, spark: [44, 43, 42, 42, 41, 41] },
      ],
      chart: { label: "Revenue by month, against the same months last year", series: months(REVENUE.slice(-6)), compare: months(REVENUE_LY.slice(-6)) },
    },
    year: {
      kpis: [
        { id: "revenue", label: "Revenue", value: "€672,200", caption: "invoiced in twelve months", delta: { text: "14% on the twelve months before", direction: "up", good: true }, spark: REVENUE },
        { id: "won", label: "Contracts signed", value: "33", caption: "17 with new clients, 7 through referrals", delta: { text: "5 more than the year before", direction: "up", good: true }, spark: [2, 3, 2, 2, 3, 3, 3, 4, 3, 2, 3, 3] },
        { id: "open", label: "Active opportunities", value: "7", caption: "worth €139,600", delta: { text: "2 new this month", direction: "up", good: true }, spark: [6, 5, 7, 6, 5, 6, 5, 6, 5, 6, 5, 7] },
        { id: "win", label: "Proposal win rate", value: "38%", caption: "33 of 87 proposals signed", delta: { text: "3 points under the year before", direction: "down", good: false }, spark: [43, 42, 41, 41, 40, 40, 41, 40, 39, 39, 39, 38] },
      ],
      chart: { label: "Revenue by month, against the year before", series: months(REVENUE), compare: months(REVENUE_LY) },
    },
  },
  insights: [
    {
      id: "i_rive",
      kind: "opportunity",
      title: "Atelier Rive is ready to sign",
      body: "Camille opened the contract twice this afternoon and asked to sign by Friday.",
      basis: "Contract tracking and her reply at 11:40",
      tag: "Probability 85%",
      href: "/app/clients?client=rive",
    },
    {
      id: "i_quiet",
      kind: "risk",
      title: "Three prospects have gone quiet",
      body: "Oréa Clinics, Studio Kanso and Pavillon Nord have not answered for ten days or more. Past ten quiet days, your deals close half as often.",
      basis: "Your 128 past proposals",
      tag: "€51,800 at risk",
      href: "/app/clients?filter=attention",
    },
    {
      id: "i_hospitality",
      kind: "growth",
      title: "Hospitality asks for you more",
      body: "Hotel and restaurant enquiries rose 38% this quarter, and they sign nine days faster than average.",
      basis: "HubSpot deals, last two quarters",
      tag: "Worth a dedicated offer",
      href: "/app/business/marketing",
    },
  ],
  focus: {
    label: "Today’s commercial priority",
    title: "Get the revised quote back to Nora Haddad",
    why: "Côté Sud Hôtels’ €14,800 quote bounced at 14:12: her address no longer receives mail. She returns calls the same day.",
    severity: "high",
    stake: "€14,800",
    due: "Call tomorrow at 9:30",
    chain: [
      { label: "Business data", detail: "Quote returned at 14:12", state: "done" },
      { label: "Analysis", detail: "Address no longer in use", state: "done" },
      { label: "Recommendation", detail: "Call at 9:30 for her new address", state: "now" },
      { label: "Action", detail: "Resend the quote, waits for you", state: "next" },
      { label: "Follow up", detail: "Signature by 30 October", state: "next" },
    ],
    cta: "Review the prepared action",
    href: "/app/actions?action=quote_nora",
  },
  pipeline: [
    { stage: "lead", label: "Discovery", count: 2, value: 17300 },
    { stage: "qualified", label: "Qualified", count: 2, value: 44000 },
    { stage: "proposal", label: "Proposal", count: 2, value: 36300 },
    { stage: "negotiation", label: "Contract", count: 1, value: 42000 },
    { stage: "won", label: "Signed this month", count: 2, value: 33600 },
  ],
  deals: [
    { id: "d_rive", name: "Brand identity and website", clientId: "rive", client: "Atelier Rive", contact: "Camille Roy", value: 42000, stage: "negotiation", probability: 85, lastActivity: "Contract opened, today 16:02", nextStep: "Signature due Friday", owner: "Clara Dubois", flag: "hot" },
    { id: "d_lenoir", name: "Packaging range", clientId: "lenoir", client: "Maison Lenoir", contact: "Hugo Lenoir", value: 21500, stage: "proposal", probability: 70, lastActivity: "Asked to start in March, today 12:15", nextStep: "Approve the revised timeline", owner: "Maël Laurent" },
    { id: "d_cotesud", name: "Signage and guest guides", clientId: "cotesud", client: "Côté Sud Hôtels", contact: "Nora Haddad", value: 14800, stage: "proposal", probability: 45, lastActivity: "Quote returned, today 14:12", nextStep: "Call tomorrow at 9:30", owner: "Maël Laurent", flag: "risk" },
    { id: "d_orea", name: "Clinic brand refresh", clientId: "orea", client: "Oréa Clinics", contact: "Dr Léa Fournier", value: 26000, stage: "qualified", probability: 30, lastActivity: "Discovery call, 26 September", nextStep: "Send the references she asked for", owner: "Clara Dubois", flag: "quiet" },
    { id: "d_kanso", name: "Website redesign", clientId: "kanso", client: "Studio Kanso", contact: "Aiko Martin", value: 18000, stage: "qualified", probability: 40, lastActivity: "Estimate sent, 2 October", nextStep: "No reply for 12 days", owner: "Clara Dubois", flag: "quiet" },
    { id: "d_lumiere", name: "Bakery chain identity", clientId: "lumiere", client: "Boulangeries Lumière", contact: "Marc Olivier", value: 9500, stage: "lead", probability: 25, lastActivity: "Website enquiry, 13 October", nextStep: "Discovery call tomorrow 14:00", owner: "Clara Dubois" },
    { id: "d_pavillon", name: "Event venue signage", clientId: "pavillon", client: "Pavillon Nord", contact: "Élodie Vasseur", value: 7800, stage: "lead", probability: 20, lastActivity: "Met at the webinar, 8 October", nextStep: "Asked for a price range", owner: "Maël Laurent", flag: "quiet" },
  ],
  interactions: [
    { id: "x1", at: "16:02", kind: "document", title: "Camille opened the contract", detail: "Atelier Rive, second time today", clientId: "rive", by: "client" },
    { id: "x2", at: "14:12", kind: "email", title: "Nora’s quote was returned", detail: "Côté Sud Hôtels, address no longer in use", clientId: "cotesud", by: "syxoria" },
    { id: "x3", at: "14:10", kind: "email", title: "Contract sent to Camille", detail: "Approved by you at 14:05", clientId: "rive", by: "syxoria" },
    { id: "x4", at: "12:15", kind: "email", title: "Hugo answered", detail: "Maison Lenoir wants to start in March", clientId: "lenoir", by: "client" },
    { id: "x5", at: "11:40", kind: "email", title: "Camille answered", detail: "Atelier Rive wants to sign by Friday", clientId: "rive", by: "client" },
    { id: "x6", at: "10:00", kind: "email", title: "Replies sent to Camille and Hugo", detail: "Routine replies, from your templates", by: "syxoria" },
    { id: "x7", at: "Yesterday 17:30", kind: "call", title: "Call with Julien Marchetti", detail: "Brasserie Ondine, menu refresh feedback", clientId: "ondine", by: "you" },
    { id: "x8", at: "Yesterday 11:00", kind: "meeting", title: "Kickoff with Domaine Castel", detail: "Phase two, the label range", clientId: "castel", by: "team" },
  ],
  quiet: [
    { id: "q_orea", client: "Oréa Clinics", contact: "Dr Léa Fournier", days: 18, value: 26000, reason: "Asked for references after the discovery call", clientId: "orea" },
    { id: "q_kanso", client: "Studio Kanso", contact: "Aiko Martin", days: 12, value: 18000, reason: "Estimate sent on 2 October, opened once", clientId: "kanso" },
    { id: "q_pavillon", client: "Pavillon Nord", contact: "Élodie Vasseur", days: 10, value: 7800, reason: "Asked for a price range at the webinar", clientId: "pavillon" },
  ],
  recommendations: [
    { id: "sr1", title: "Approve Hugo’s March timeline", why: "He asked to start a month earlier, so the contract can go out this week.", area: "Sales", client: "Maison Lenoir", priority: "high", actionId: "timeline_hugo", cta: "Review", approval: true },
    { id: "sr2", title: "Send Oréa Clinics two references", why: "Léa asked for references 18 days ago. Two clinic projects are ready to share.", area: "Sales", client: "Oréa Clinics", priority: "high", actionId: "refs_orea", cta: "Review", approval: true },
    { id: "sr3", title: "Prepare tomorrow’s discovery call", why: "Boulangeries Lumière at 14:00. A one page brief from their enquiry is ready.", area: "Sales", client: "Boulangeries Lumière", priority: "medium", actionId: "brief_lumiere", cta: "Open", approval: false },
    { id: "sr4", title: "Check in with Camille on Thursday if unsigned", why: "Her signature is due Friday. A short note keeps the date.", area: "Sales", client: "Atelier Rive", priority: "medium", actionId: "checkin_camille", cta: "Plan", approval: true },
  ],
};

/* ==========================================================================
 * MARKETING
 * ========================================================================== */
export const mockMarketing: MarketingData = {
  periods: {
    month: {
      kpis: [
        { id: "leads", label: "Qualified leads", value: "14", caption: "since 1 October", delta: { text: "27% on September at this date", direction: "up", good: true }, spark: [9, 11, 10, 12, 11, 14] },
        { id: "cpl", label: "Cost per lead", value: "€87", caption: "€4,850 spent for 56 paid leads", delta: { text: "41% more than September", direction: "up", good: false }, spark: [58, 61, 60, 64, 71, 87] },
        { id: "conv", label: "Website conversion", value: "2.4%", caption: "visits that ask for a quote", delta: { text: "0.3 points on September", direction: "up", good: true }, spark: [1.9, 2.0, 2.1, 2.0, 2.1, 2.4] },
        { id: "eng", label: "Newsletter engagement", value: "46%", caption: "opened the autumn issue", delta: { text: "5 points on the last issue", direction: "up", good: true }, spark: [38, 39, 41, 40, 41, 46] },
      ],
      chart: { label: "Qualified leads by week, against the eight weeks before", series: weeks([2, 3, 4, 2, 3, 4, 6, 4]), compare: weeks([2, 2, 3, 2, 2, 3, 3, 2]) },
    },
    half: {
      kpis: [
        { id: "leads", label: "Qualified leads", value: "71", caption: "May to October", delta: { text: "18% on the six months before", direction: "up", good: true }, spark: [10, 12, 11, 9, 15, 14] },
        { id: "cpl", label: "Cost per lead", value: "€64", caption: "across paid channels", delta: { text: "8% more than the six months before", direction: "up", good: false }, spark: [55, 57, 60, 59, 64, 71] },
        { id: "conv", label: "Website conversion", value: "2.1%", caption: "visits that ask for a quote", delta: { text: "0.2 points on the six months before", direction: "up", good: true }, spark: [1.8, 1.9, 2.0, 2.0, 2.1, 2.4] },
        { id: "eng", label: "Newsletter engagement", value: "41%", caption: "average open rate, 6 issues", delta: { text: "3 points on the six months before", direction: "up", good: true }, spark: [37, 38, 40, 39, 41, 46] },
      ],
      chart: { label: "Qualified leads by month, against the same months last year", series: months([10, 12, 11, 9, 15, 14]), compare: months([8, 9, 10, 7, 11, 10]) },
    },
    year: {
      kpis: [
        { id: "leads", label: "Qualified leads", value: "138", caption: "in twelve months", delta: { text: "22% on the year before", direction: "up", good: true }, spark: [11, 12, 9, 10, 12, 13, 10, 12, 11, 9, 15, 14] },
        { id: "cpl", label: "Cost per lead", value: "€58", caption: "across paid channels", delta: { text: "4% less than the year before", direction: "down", good: true }, spark: [52, 54, 55, 53, 56, 55, 57, 60, 59, 61, 64, 71] },
        { id: "conv", label: "Website conversion", value: "2.0%", caption: "visits that ask for a quote", delta: { text: "0.4 points on the year before", direction: "up", good: true }, spark: [1.6, 1.7, 1.7, 1.8, 1.8, 1.9, 1.9, 2.0, 2.0, 2.0, 2.1, 2.4] },
        { id: "eng", label: "Newsletter engagement", value: "39%", caption: "average open rate, 12 issues", delta: { text: "6 points on the year before", direction: "up", good: true }, spark: [33, 34, 35, 36, 36, 37, 37, 38, 40, 39, 41, 46] },
      ],
      chart: { label: "Qualified leads by month, against the year before", series: months([11, 12, 9, 10, 12, 13, 10, 12, 11, 9, 15, 14]), compare: months([9, 10, 8, 8, 10, 10, 8, 9, 10, 7, 11, 10]) },
    },
  },
  insights: [
    { id: "mi_ref", kind: "change", title: "Referrals bring 41% of signed revenue", body: "With no spend at all, against €2,350 a month on ads that signed nothing this quarter.", basis: "HubSpot deal sources, 90 days", tag: "Your best channel", href: "/app/business/marketing" },
    { id: "mi_ads", kind: "anomaly", title: "Ads cost 41% more per lead in three weeks", body: "Broad match keywords started buying ‘free logo’ and ‘logo maker’ searches on 23 September.", basis: "Google Ads, last 21 days", tag: "Review the campaign", href: "/app/actions?action=pause_ads" },
    { id: "mi_case", kind: "opportunity", title: "Case studies bring the right visitors", body: "Visitors who read a case study ask for a quote three times more often than visitors from the homepage.", basis: "Website analytics, 60 days", tag: "Prepare the next one", href: "/app/actions?action=case_study" },
  ],
  focus: {
    label: "Today’s marketing priority",
    title: "Stop paying for searches that never convert",
    why: "The brand search campaign spent €1,450 this month on ‘free logo’ searches. None became a qualified lead.",
    severity: "high",
    stake: "€1,450 a month",
    due: "Before the next billing on Monday",
    chain: [
      { label: "Business data", detail: "Cost per lead up 41%", state: "done" },
      { label: "Analysis", detail: "Broad match buys the wrong searches", state: "done" },
      { label: "Recommendation", detail: "Pause the ad group, add negative keywords", state: "now" },
      { label: "Action", detail: "Change prepared, waits for you", state: "next" },
      { label: "Follow up", detail: "Compare the cost per lead in two weeks", state: "next" },
    ],
    cta: "Review the prepared change",
    href: "/app/actions?action=pause_ads",
  },
  campaigns: [
    { id: "c_news", name: "Autumn portfolio newsletter", channel: "Newsletter", status: "live", dates: "1 to 31 October", spend: 0, leads: 6, qualified: 4, costPerLead: null, change: { text: "Best open rate this year", good: true } },
    { id: "c_case", name: "Case study series", channel: "LinkedIn", status: "live", dates: "September to November", spend: 400, leads: 11, qualified: 6, costPerLead: 36, change: { text: "3x more qualified visits", good: true } },
    { id: "c_ads", name: "Brand search", channel: "Google Ads", status: "live", dates: "Ongoing", spend: 2350, leads: 18, qualified: 3, costPerLead: 131, change: { text: "Cost per lead up 41%", good: false } },
    { id: "c_webinar", name: "Signage that sells, hospitality webinar", channel: "Events", status: "ended", dates: "8 October", spend: 1200, leads: 23, qualified: 7, costPerLead: 52, change: { text: "Best hospitality reach this year", good: true } },
    { id: "c_insta", name: "Packaging lookbook", channel: "Instagram", status: "paused", dates: "Paused 2 October", spend: 900, leads: 4, qualified: 0, costPerLead: 225, change: { text: "No qualified lead", good: false } },
    { id: "c_referral", name: "Referral thank you series", channel: "Email", status: "draft", dates: "Starts in November", spend: 0, leads: 0, qualified: 0, costPerLead: null },
  ],
  channels: [
    { id: "ch_ref", label: "Referrals", leads: 19, signed: 5, revenue: 96400, cost: 0, change: { text: "2 more signed", good: true } },
    { id: "ch_web", label: "Website and search", leads: 31, signed: 3, revenue: 41200, cost: 0, change: { text: "Steady", good: true } },
    { id: "ch_li", label: "LinkedIn", leads: 22, signed: 2, revenue: 28600, cost: 400, change: { text: "1 more signed", good: true } },
    { id: "ch_events", label: "Events", leads: 23, signed: 1, revenue: 12200, cost: 1200, change: { text: "New this quarter", good: true } },
    { id: "ch_news", label: "Newsletter", leads: 9, signed: 1, revenue: 9800, cost: 0, change: { text: "Steady", good: true } },
    { id: "ch_ads", label: "Google Ads", leads: 18, signed: 0, revenue: 0, cost: 2350, change: { text: "Nothing signed", good: false } },
  ],
  funnel: [
    { label: "Visits", value: 4820, note: "since 1 October" },
    { label: "Enquiries", value: 116, note: "2.4% of visits" },
    { label: "Qualified", value: 14, note: "12% of enquiries" },
    { label: "Proposals", value: 4, note: "29% of qualified" },
    { label: "Signed", value: 2, note: "half of proposals" },
  ],
  content: [
    { id: "ct1", title: "Behind the Atelier Rive rebrand", kind: "LinkedIn post", views: 3480, engagement: "4.8% engagement", leads: 3 },
    { id: "ct2", title: "Lobby signage for Côté Sud Hôtels", kind: "Case study", views: 1940, engagement: "6.1% engagement", leads: 5 },
    { id: "ct3", title: "Packaging trends for 2027", kind: "Article", views: 1210, engagement: "3.2% engagement", leads: 2 },
    { id: "ct4", title: "Signage that sells, the replay", kind: "Video", views: 640, engagement: "38% watched to the end", leads: 4 },
  ],
  improvements: [
    { id: "im1", title: "Google Ads is buying the wrong searches", detail: "62% of clicks come from ‘free logo’ and ‘logo maker’ searches.", impact: "€1,450 a month" },
    { id: "im2", title: "The enquiry form loses mobile visitors", detail: "On a phone, three times more visitors leave at the budget field than on a computer.", impact: "About 6 enquiries a month" },
    { id: "im3", title: "Referrals are never thanked", detail: "Five of the last twelve signed clients came through a referral. None of them heard back.", impact: "Your best channel, at no cost" },
  ],
  recommendations: [
    { id: "mr1", title: "Pause the ‘logo maker’ ad group", why: "It spent €1,450 this month without one qualified lead.", area: "Marketing", priority: "high", actionId: "pause_ads", cta: "Review", approval: true },
    { id: "mr2", title: "Send the referral thank you series", why: "Three short emails to the five clients who sent you work this year.", area: "Marketing", priority: "medium", actionId: "referral_series", cta: "Review", approval: true },
    { id: "mr3", title: "Draft the Atelier Rive case study", why: "Case studies bring three times more quote requests. Ready once the contract is signed.", area: "Marketing", client: "Atelier Rive", priority: "medium", actionId: "case_study", cta: "Prepare", approval: false },
    { id: "mr4", title: "Shorten the mobile enquiry form", why: "Moving the budget field after the message could bring back six enquiries a month.", area: "Marketing", priority: "low", cta: "Plan", approval: false },
  ],
};

/* ==========================================================================
 * FINANCE
 * ========================================================================== */
const CASH_12 = [
  { month: "Nov", in: 52400, out: 44100 },
  { month: "Dec", in: 58100, out: 51800 },
  { month: "Jan", in: 44900, out: 43200 },
  { month: "Feb", in: 49300, out: 42600 },
  { month: "Mar", in: 56800, out: 46900 },
  { month: "Apr", in: 61200, out: 48700 },
  { month: "May", in: 59700, out: 47200 },
  { month: "Jun", in: 63400, out: 49800 },
  { month: "Jul", in: 54100, out: 46300 },
  { month: "Aug", in: 41800, out: 38900 },
  { month: "Sep", in: 66300, out: 51200 },
  { month: "Oct", in: 64200, out: 41800 },
];
const BALANCE = [74900, 81200, 82900, 89600, 99500, 112000, 124500, 138100, 145900, 148800, 163900, 186300];

export const mockFinance: FinanceData = {
  periods: {
    month: {
      kpis: [
        { id: "rev", label: "Revenue", value: "€64,200", caption: "invoiced since 1 October", delta: { text: "12% on September at this date", direction: "up", good: true }, spark: REVENUE.slice(-6) },
        { id: "exp", label: "Expenses", value: "€41,800", caption: "paid since 1 October", delta: { text: "6% more than September at this date", direction: "up", good: false }, spark: CASH_12.slice(-6).map((c) => c.out) },
        { id: "cash", label: "Cash balance", value: "€186,300", caption: "about four months of costs", delta: { text: "€22,400 net this month", direction: "up", good: true }, spark: BALANCE.slice(-6) },
        { id: "due", label: "Outstanding invoices", value: "€9,700", caption: "two invoices, one overdue", delta: { text: "€6,500 nine days late", direction: "up", good: false }, spark: [4200, 7800, 3100, 5600, 8900, 9700] },
      ],
      cash: CASH_12.slice(-6),
      balance: months(BALANCE.slice(-6)),
    },
    half: {
      kpis: [
        { id: "rev", label: "Revenue", value: "€349,500", caption: "invoiced, May to October", delta: { text: "9% on the six months before", direction: "up", good: true }, spark: REVENUE.slice(-6) },
        { id: "exp", label: "Expenses", value: "€275,200", caption: "paid, May to October", delta: { text: "4% more than the six months before", direction: "up", good: false }, spark: CASH_12.slice(-6).map((c) => c.out) },
        { id: "cash", label: "Cash balance", value: "€186,300", caption: "about four months of costs", delta: { text: "€74,300 net in six months", direction: "up", good: true }, spark: BALANCE.slice(-6) },
        { id: "due", label: "Outstanding invoices", value: "€9,700", caption: "two invoices, one overdue", delta: { text: "Paid in 31 days on average", direction: "up", good: false }, spark: [4200, 7800, 3100, 5600, 8900, 9700] },
      ],
      cash: CASH_12.slice(-6),
      balance: months(BALANCE.slice(-6)),
    },
    year: {
      kpis: [
        { id: "rev", label: "Revenue", value: "€672,200", caption: "invoiced in twelve months", delta: { text: "14% on the year before", direction: "up", good: true }, spark: REVENUE },
        { id: "exp", label: "Expenses", value: "€552,500", caption: "paid in twelve months", delta: { text: "9% more than the year before", direction: "up", good: false }, spark: CASH_12.map((c) => c.out) },
        { id: "cash", label: "Cash balance", value: "€186,300", caption: "about four months of costs", delta: { text: "€119,700 net in twelve months", direction: "up", good: true }, spark: BALANCE },
        { id: "due", label: "Outstanding invoices", value: "€9,700", caption: "two invoices, one overdue", delta: { text: "Paid in 29 days on average", direction: "down", good: true }, spark: [6100, 5200, 7400, 4800, 3900, 6600, 4200, 7800, 3100, 5600, 8900, 9700] },
      ],
      cash: CASH_12,
      balance: months(BALANCE),
    },
  },
  insights: [
    { id: "fi_soft", kind: "anomaly", title: "Software costs rose 34% this month", body: "Figma and Adobe are each billed twice: once on the studio card, once on Inès’s card.", basis: "Bank feed, last three months", tag: "€410 a month to recover", href: "/app/actions?action=review_subscriptions" },
    { id: "fi_due", kind: "risk", title: "One invoice is overdue, one is due Monday", body: "Verrerie Morel is nine days late on €6,500. Brasserie Ondine paid late twice this year.", basis: "Invoices and payment history", tag: "€9,700 outstanding", href: "/app/business/finance" },
    { id: "fi_best", kind: "opportunity", title: "October could be your best month", body: "If Atelier Rive signs on Friday, its €12,600 deposit lands before the month ends.", basis: "Pipeline and payment terms", tag: "€12,600 more in October", href: "/app/clients?client=rive" },
  ],
  focus: {
    label: "Today’s financial priority",
    title: "Recover the €6,500 Verrerie Morel owes",
    why: "Their invoice is nine days overdue. They have paid within three days of a reminder every time this year.",
    severity: "high",
    stake: "€6,500",
    due: "Reminder goes out tomorrow at 9:00",
    chain: [
      { label: "Business data", detail: "Due on 5 October, unpaid", state: "done" },
      { label: "Analysis", detail: "Usually pays after a reminder", state: "done" },
      { label: "Recommendation", detail: "A courteous reminder", state: "done" },
      { label: "Action", detail: "Approved by you at 18:50", state: "now" },
      { label: "Follow up", detail: "Payment expected by Monday", state: "next" },
    ],
    cta: "Open the reminder",
    href: "/app/actions?action=reminder_morel",
  },
  invoices: [
    { id: "inv118", number: "INV 2026 118", client: "Verrerie Morel", clientId: "morel", amount: 6500, issued: "16 Sep", due: "5 Oct", status: "overdue", days: 9, note: "Reminder approved, goes out tomorrow 9:00" },
    { id: "inv121", number: "INV 2026 121", client: "Brasserie Ondine", clientId: "ondine", amount: 3200, issued: "20 Sep", due: "Mon 19 Oct", status: "due-soon", days: 5, note: "Reminder drafted for Monday" },
    { id: "inv124", number: "INV 2026 124", client: "Atelier Rive", clientId: "rive", amount: 12600, issued: "Not issued", due: "On signature", status: "draft", note: "Deposit, 30% of the contract" },
    { id: "inv123", number: "INV 2026 123", client: "Domaine Castel", clientId: "castel", amount: 10700, issued: "2 Oct", due: "13 Oct", status: "paid", note: "Paid on 13 Oct" },
    { id: "inv122", number: "INV 2026 122", client: "Halden & Co", clientId: "halden", amount: 4500, issued: "1 Oct", due: "12 Oct", status: "paid", note: "Monthly retainer" },
    { id: "inv120", number: "INV 2026 120", client: "Galerie Sorel", clientId: "sorel", amount: 12200, issued: "25 Sep", due: "7 Oct", status: "paid", note: "Paid on 7 Oct" },
  ],
  expenses: [
    { id: "e_team", label: "Salaries and freelancers", amount: 29600, change: { text: "3% more", good: false } },
    { id: "e_rent", label: "Studio rent and utilities", amount: 4200, change: { text: "Unchanged", good: true } },
    { id: "e_soft", label: "Software and subscriptions", amount: 3150, change: { text: "34% more", good: false }, flag: "Two subscriptions billed twice" },
    { id: "e_ads", label: "Advertising", amount: 2350, change: { text: "48% more", good: false }, flag: "Google Ads, see Marketing" },
    { id: "e_travel", label: "Travel", amount: 1380, change: { text: "12% less", good: true } },
    { id: "e_other", label: "Other", amount: 1120, change: { text: "Unchanged", good: true } },
  ],
  upcoming: [
    { id: "u1", label: "Brasserie Ondine, invoice 121", date: "Mon 19 Oct", amount: 3200, kind: "in" },
    { id: "u2", label: "VAT return", date: "Tue 20 Oct", amount: 11840, kind: "out" },
    { id: "u3", label: "Atelier Rive deposit, after signature", date: "About 23 Oct", amount: 12600, kind: "in" },
    { id: "u4", label: "Payroll", date: "Wed 28 Oct", amount: 24900, kind: "out" },
    { id: "u5", label: "Studio rent", date: "Sun 1 Nov", amount: 4200, kind: "out" },
  ],
  recommendations: [
    { id: "fr1", title: "Approve Brasserie Ondine’s reminder for Monday", why: "€3,200 is due Monday, and they paid late twice this year.", area: "Finance", client: "Brasserie Ondine", priority: "high", actionId: "reminder_ondine", cta: "Review", approval: true },
    { id: "fr2", title: "Cancel the duplicate Figma and Adobe seats", why: "€410 a month billed twice. Syxoria lists them; cancelling stays with you.", area: "Finance", priority: "medium", actionId: "review_subscriptions", cta: "Review", approval: true },
    { id: "fr3", title: "Prepare the Atelier Rive deposit invoice", why: "Issued the moment Camille signs, so the €12,600 lands in October.", area: "Finance", client: "Atelier Rive", priority: "medium", actionId: "invoice_rive", cta: "Prepare", approval: true },
    { id: "fr4", title: "Set aside €11,840 for the VAT return", why: "Due Tuesday. Your balance covers it with room to spare.", area: "Finance", priority: "low", cta: "Plan", approval: false },
  ],
};

/* ==========================================================================
 * GOALS & KPIs
 * ========================================================================== */
const Q4 = (values: number[]): TimePoint[] => values.map((value, i) => ({ date: ["2026-10-04", "2026-10-11", "2026-10-14"][i], value }));

export const mockGoals: GoalsData = {
  periods: {
    month: {
      kpis: [
        { id: "g_on", label: "On track", value: "2", caption: "of six goals, one already met", spark: [2, 2, 3, 2, 2, 2] },
        { id: "g_risk", label: "At risk", value: "2", caption: "win rate, hospitality clients", spark: [1, 1, 1, 2, 2, 2] },
        { id: "g_behind", label: "Behind", value: "2", caption: "reply time, cost per lead", spark: [1, 1, 0, 1, 1, 2] },
        { id: "g_q4", label: "Q4 revenue goal", value: "34%", caption: "of €190,000, 15% of the quarter gone", progress: 0.34 },
      ],
      scoreboard: [
        { id: "k_rev", label: "Revenue this month", value: "€64,200", target: "€63,300", deviation: "1% ahead", status: "on-track", area: "Finance" },
        { id: "k_win", label: "Proposal win rate", value: "38%", target: "45%", deviation: "7 points under", status: "at-risk", area: "Sales" },
        { id: "k_reply", label: "Average reply to clients", value: "3.4 days", target: "2 days", deviation: "1.4 days slower", status: "behind", area: "Operations" },
        { id: "k_cpl", label: "Cost per lead", value: "€87", target: "€70", deviation: "24% over", status: "behind", area: "Marketing" },
        { id: "k_cash", label: "Cash runway", value: "4.1 months", target: "4 months", deviation: "0.1 months above", status: "achieved", area: "Finance" },
        { id: "k_sat", label: "Client satisfaction", value: "4.7 of 5", target: "4.5 of 5", deviation: "Above target", status: "on-track", area: "Clients" },
        { id: "k_util", label: "Billable time", value: "78%", target: "75%", deviation: "3 points above", status: "on-track", area: "Operations" },
        { id: "k_dso", label: "Days to get paid", value: "31 days", target: "30 days", deviation: "1 day over", status: "at-risk", area: "Finance" },
      ],
    },
    half: {
      kpis: [
        { id: "g_on", label: "On track", value: "3", caption: "of six goals, on average", spark: [3, 3, 2, 3, 3, 2] },
        { id: "g_risk", label: "At risk", value: "2", caption: "most often the win rate", spark: [1, 2, 2, 1, 2, 2] },
        { id: "g_behind", label: "Behind", value: "1", caption: "most often reply time", spark: [1, 0, 1, 1, 0, 2] },
        { id: "g_q4", label: "Q4 revenue goal", value: "34%", caption: "of €190,000, 15% of the quarter gone", progress: 0.34 },
      ],
      scoreboard: [
        { id: "k_rev", label: "Revenue per month", value: "€58,300", target: "€60,000", deviation: "3% under", status: "at-risk", area: "Finance" },
        { id: "k_win", label: "Proposal win rate", value: "41%", target: "45%", deviation: "4 points under", status: "at-risk", area: "Sales" },
        { id: "k_reply", label: "Average reply to clients", value: "2.3 days", target: "2 days", deviation: "0.3 days slower", status: "at-risk", area: "Operations" },
        { id: "k_cpl", label: "Cost per lead", value: "€64", target: "€70", deviation: "9% under", status: "on-track", area: "Marketing" },
        { id: "k_cash", label: "Cash runway", value: "4.1 months", target: "4 months", deviation: "0.1 months above", status: "achieved", area: "Finance" },
        { id: "k_sat", label: "Client satisfaction", value: "4.6 of 5", target: "4.5 of 5", deviation: "Above target", status: "on-track", area: "Clients" },
        { id: "k_util", label: "Billable time", value: "74%", target: "75%", deviation: "1 point under", status: "at-risk", area: "Operations" },
        { id: "k_dso", label: "Days to get paid", value: "31 days", target: "30 days", deviation: "1 day over", status: "at-risk", area: "Finance" },
      ],
    },
    year: {
      kpis: [
        { id: "g_on", label: "On track", value: "3", caption: "of six goals, on average", spark: [2, 3, 3, 4, 3, 3, 3, 3, 2, 3, 3, 2] },
        { id: "g_risk", label: "At risk", value: "2", caption: "most often the win rate", spark: [2, 2, 1, 1, 2, 2, 1, 2, 2, 1, 2, 2] },
        { id: "g_behind", label: "Behind", value: "1", caption: "most often reply time", spark: [2, 1, 2, 1, 1, 1, 1, 0, 1, 1, 0, 2] },
        { id: "g_q4", label: "Q4 revenue goal", value: "34%", caption: "of €190,000, 15% of the quarter gone", progress: 0.34 },
      ],
      scoreboard: [
        { id: "k_rev", label: "Revenue per month", value: "€56,000", target: "€55,000", deviation: "2% ahead", status: "on-track", area: "Finance" },
        { id: "k_win", label: "Proposal win rate", value: "38%", target: "45%", deviation: "7 points under", status: "at-risk", area: "Sales" },
        { id: "k_reply", label: "Average reply to clients", value: "2.1 days", target: "2 days", deviation: "0.1 days slower", status: "on-track", area: "Operations" },
        { id: "k_cpl", label: "Cost per lead", value: "€58", target: "€70", deviation: "17% under", status: "on-track", area: "Marketing" },
        { id: "k_cash", label: "Cash runway", value: "4.1 months", target: "4 months", deviation: "0.1 months above", status: "achieved", area: "Finance" },
        { id: "k_sat", label: "Client satisfaction", value: "4.6 of 5", target: "4.5 of 5", deviation: "Above target", status: "on-track", area: "Clients" },
        { id: "k_util", label: "Billable time", value: "73%", target: "75%", deviation: "2 points under", status: "at-risk", area: "Operations" },
        { id: "k_dso", label: "Days to get paid", value: "29 days", target: "30 days", deviation: "1 day under", status: "on-track", area: "Finance" },
      ],
    },
  },
  goals: [
    {
      id: "g_q4",
      title: "Q4 revenue",
      area: "Finance",
      metric: "Revenue invoiced",
      target: "€190,000",
      current: "€64,200",
      progress: 0.34,
      expected: 0.15,
      gap: "€125,800 to go",
      deadline: "31 December",
      owner: "Maël Laurent",
      status: "on-track",
      why: "Ahead of pace, two weeks into the quarter. Atelier Rive alone would add €42,000.",
      series: Q4([31500, 52800, 64200]),
      recommendations: [
        { title: "Secure Atelier Rive’s signature by Friday", actionId: "checkin_camille", approval: true },
        { title: "Bring Maison Lenoir forward to October", actionId: "timeline_hugo", approval: true },
      ],
    },
    {
      id: "g_win",
      title: "Win 45% of proposals",
      area: "Sales",
      metric: "Proposal win rate",
      target: "45%",
      current: "38%",
      progress: 0.84,
      expected: 1,
      gap: "7 points",
      deadline: "31 December",
      owner: "Clara Dubois",
      status: "at-risk",
      why: "Proposals left more than ten days without an answer close half as often. Three are quiet today.",
      series: [42, 41, 40, 39, 39, 38].map((value, i) => ({ date: `2026-${String(5 + i).padStart(2, "0")}-01`, value })),
      recommendations: [
        { title: "Send Oréa Clinics the references they asked for", actionId: "refs_orea", approval: true },
        { title: "Answer clients within two days", approval: false },
      ],
    },
    {
      id: "g_reply",
      title: "Reply to clients within two days",
      area: "Operations",
      metric: "Average reply time",
      target: "2 days",
      current: "3.4 days",
      progress: 0.59,
      expected: 1,
      gap: "1.4 days slower",
      deadline: "Every week",
      owner: "Maël Laurent",
      status: "behind",
      why: "Replies slowed this week while the studio delivered two projects.",
      series: [1.8, 1.9, 2.1, 2.4, 2.9, 3.4].map((value, i) => ({ date: WEEKS[i + 2], value })),
      recommendations: [{ title: "Let Syxoria draft routine replies the same day", approval: false }],
    },
    {
      id: "g_hosp",
      title: "Win three new hospitality clients",
      area: "Sales",
      metric: "Clients signed",
      target: "3 clients",
      current: "1 client",
      progress: 0.33,
      expected: 0.55,
      gap: "2 clients",
      deadline: "31 December",
      owner: "Clara Dubois",
      status: "at-risk",
      why: "Côté Sud Hôtels and Pavillon Nord are both in the pipeline, and the webinar brought 7 qualified leads.",
      series: [0, 0, 1, 1, 1, 1].map((value, i) => ({ date: `2026-${String(5 + i).padStart(2, "0")}-01`, value })),
      recommendations: [
        { title: "Call Nora tomorrow at 9:30", actionId: "hold_call", approval: false },
        { title: "Send Pavillon Nord the price range they asked for", approval: true },
      ],
    },
    {
      id: "g_cash",
      title: "Keep four months of costs in cash",
      area: "Finance",
      metric: "Cash runway",
      target: "4 months",
      current: "4.1 months",
      progress: 1,
      expected: 1,
      gap: "0.1 months above",
      deadline: "Always",
      owner: "Théo Garnier",
      status: "achieved",
      why: "Met since September, helped by strong collections.",
      series: [3.1, 3.4, 3.6, 3.7, 4.0, 4.1].map((value, i) => ({ date: `2026-${String(5 + i).padStart(2, "0")}-01`, value })),
      recommendations: [],
    },
    {
      id: "g_cpl",
      title: "Cost per lead under €70",
      area: "Marketing",
      metric: "Cost per lead",
      target: "€70",
      current: "€87",
      progress: 0.8,
      expected: 1,
      gap: "€17 over",
      deadline: "31 December",
      owner: "Inès Moreau",
      status: "behind",
      why: "Google Ads broad match is buying searches from people looking for a free logo.",
      series: [58, 61, 60, 64, 71, 87].map((value, i) => ({ date: `2026-${String(5 + i).padStart(2, "0")}-01`, value })),
      recommendations: [{ title: "Pause the ‘logo maker’ ad group", actionId: "pause_ads", approval: true }],
    },
  ],
  deviations: [
    { id: "gd1", kind: "risk", title: "Reply time slipped to 3.4 days", body: "It was 1.8 days last month. Quiet proposals close half as often.", basis: "Gmail, last 30 days", tag: "Behind", href: "/app/business/goals" },
    { id: "gd2", kind: "anomaly", title: "Cost per lead is 24% over target", body: "All of the increase comes from one Google Ads group.", basis: "Google Ads and HubSpot", tag: "Behind", href: "/app/business/marketing" },
    { id: "gd3", kind: "growth", title: "Revenue is ahead of the Q4 pace", body: "34% of the goal after 15% of the quarter.", basis: "Invoices since 1 October", tag: "On track", href: "/app/business/finance" },
  ],
  focus: {
    label: "The goal that needs you",
    title: "Your win rate is drifting away from 45%",
    why: "Slow replies cost deals: past ten quiet days, your proposals close half as often. Three prospects are quiet today.",
    severity: "high",
    stake: "€51,800 at risk",
    due: "This week",
    chain: [
      { label: "Business data", detail: "Win rate 38%, 7 points under", state: "done" },
      { label: "Analysis", detail: "Quiet proposals close half as often", state: "done" },
      { label: "Recommendation", detail: "Answer the three quiet prospects", state: "now" },
      { label: "Action", detail: "References for Oréa wait for you", state: "next" },
      { label: "Follow up", detail: "Win rate checked every Monday", state: "next" },
    ],
    cta: "See the quiet prospects",
    href: "/app/clients?filter=attention",
  },
};

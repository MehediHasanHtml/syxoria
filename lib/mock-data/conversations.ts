import type { Conversation, SearchItem } from "@/types/workspace";

/**
 * The assistant's conversations with Maël, and what global search can find. Fictional, the same
 * story as the briefings. Answers are prepared examples: the assistant is not connected yet.
 * No dashes or hyphenated words in UI copy.
 */
export const mockConversations: Conversation[] = [
  {
    id: "cv_nora",
    title: "Why Nora’s quote bounced, and what now",
    group: "Today",
    updated: "18:58",
    actions: ["quote_nora", "hold_call"],
    people: ["cotesud"],
    recalls: ["m10", "m9"],
    messages: [
      { id: "m1", from: "you", at: "18:52", text: "Why did Nora’s quote bounce, and what should I do?" },
      {
        id: "m2",
        from: "syxoria",
        at: "18:52",
        blocks: [
          { kind: "text", text: "Her mail server returned the quote at 14:12: the address n.haddad@cotesud-hotels.fr no longer exists. Nothing reached her, so the deal is not lost, only unheard." },
          {
            kind: "figures",
            items: [
              { label: "At stake", value: "€14,800", note: "revised quote" },
              { label: "Without news", value: "15 days", note: "since her request" },
              { label: "Calls returned", value: "Same day", note: "her last two" },
            ],
          },
          { kind: "list", title: "What I suggest", items: ["Call her tomorrow at 9:30: I held the slot in your calendar.", "Ask for her new address, then I resend the quote. It will wait for your approval, as any quote does.", "I paused routine replies to cotesud-hotels.fr so nothing else bounces."] },
          { kind: "action", actionId: "quote_nora" },
          {
            kind: "sources",
            items: [
              { label: "Bounce from cotesud-hotels.fr", detail: "Gmail, today 14:12", href: "/app/history" },
              { label: "Côté Sud Hôtels, revised quote", detail: "Documents, today 7:45", href: "/app/documents?doc=doc_nora_quote" },
              { label: "Nora Haddad", detail: "Clients & Prospects", href: "/app/clients?client=cotesud" },
            ],
          },
        ],
      },
      { id: "m3", from: "you", at: "18:57", text: "Is there anyone else at Côté Sud I could write to?" },
      {
        id: "m4",
        from: "syxoria",
        at: "18:58",
        blocks: [
          { kind: "text", text: "Not that I know of. HubSpot has only Nora for Côté Sud Hôtels, and no other address from that company appears in your emails. Their reception number is on their website if the call does not connect." },
          { kind: "sources", items: [{ label: "HubSpot contacts", detail: "Côté Sud Hôtels, one contact", href: "/app/clients?client=cotesud" }] },
        ],
      },
    ],
  },
  {
    id: "cv_risk",
    title: "Which proposals are at risk this week?",
    group: "Today",
    updated: "9:20",
    actions: ["refs_orea", "checkin_kanso"],
    people: ["orea", "kanso", "pavillon"],
    recalls: ["m5"],
    messages: [
      { id: "r1", from: "you", at: "9:10", text: "Which proposals are at risk this week?" },
      {
        id: "r2",
        from: "syxoria",
        at: "9:12",
        blocks: [
          { kind: "text", text: "Three prospects have been quiet for ten days or more. Past that point, your proposals close half as often." },
          { kind: "list", items: ["Oréa Clinics, €26,000: 18 days, Léa asked for references.", "Studio Kanso, €18,000: 12 days, estimate opened once.", "Pavillon Nord, €7,800: 10 days, asked for a price range."] },
          { kind: "text", text: "I drafted the references for Léa (waits for you) and scheduled a short check in for Aiko tomorrow at 10:00." },
          { kind: "action", actionId: "refs_orea" },
        ],
      },
    ],
  },
  {
    id: "cv_hugo",
    title: "Can we start Maison Lenoir in March?",
    group: "Today",
    updated: "17:20",
    actions: ["timeline_hugo"],
    people: ["lenoir"],
    recalls: ["m7", "m12"],
    messages: [
      { id: "h1", from: "you", at: "12:24", text: "Hugo wants to start in March instead of April. Can we?" },
      {
        id: "h2",
        from: "syxoria",
        at: "12:25",
        blocks: [
          { kind: "text", text: "Yes. March is free in the studio calendar, and nothing in the proposal depends on April." },
          {
            kind: "figures",
            items: [
              { label: "Project", value: "€21,500", note: "packaging range" },
              { label: "Start", value: "2 March", note: "a month earlier" },
              { label: "Signature", value: "October", note: "instead of November" },
            ],
          },
          { kind: "text", text: "Shall I revise the timeline? The scope and the price stay as they are, only the dates move. A change to a quote always waits for you." },
          {
            kind: "sources",
            items: [
              { label: "Hugo’s email", detail: "Gmail, today 12:15", href: "/app/clients?client=lenoir" },
              { label: "Packaging range proposal", detail: "Documents, 28 Sep", href: "/app/documents" },
            ],
          },
        ],
      },
      { id: "h3", from: "you", at: "12:30", text: "Yes, do it." },
      {
        id: "h4",
        from: "syxoria",
        at: "17:20",
        blocks: [
          { kind: "text", text: "The revised timeline is ready. I changed only the dates, and wrote to Hugo the way you usually write to founders." },
          { kind: "action", actionId: "timeline_hugo" },
          { kind: "text", text: "It goes out the moment you approve it." },
        ],
      },
    ],
  },
  {
    id: "cv_ads",
    title: "Why are ads getting more expensive?",
    group: "Today",
    updated: "15:40",
    actions: ["pause_ads"],
    messages: [
      { id: "a1", from: "you", at: "15:12", text: "Why are ads getting more expensive?" },
      {
        id: "a2",
        from: "syxoria",
        at: "15:14",
        blocks: [
          { kind: "text", text: "Because Google started spending your budget on the wrong searches. Since broad match was switched on, on 23 September, people looking for a free logo maker see your ads." },
          {
            kind: "figures",
            items: [
              { label: "Cost per lead", value: "€131", note: "up 41% in three weeks" },
              { label: "Wrong searches", value: "62%", note: "of your clicks" },
              { label: "Spent on them", value: "€1,450", note: "this month, no qualified lead" },
            ],
          },
          { kind: "text", text: "Your other channels are healthy: the case study series brings qualified leads at €36 each." },
          { kind: "sources", items: [{ label: "Search terms report", detail: "Google Ads, last 21 days", href: "/app/business/marketing" }] },
        ],
      },
      { id: "a3", from: "you", at: "15:20", text: "Can you stop it?" },
      {
        id: "a4",
        from: "syxoria",
        at: "15:40",
        blocks: [
          { kind: "text", text: "I prepared it: pause the ‘logo maker’ ad group and exclude those searches. You can undo it in one click, and I’ll compare the cost per lead in two weeks." },
          { kind: "action", actionId: "pause_ads" },
          { kind: "text", text: "Campaign changes always wait for you, so it goes live when you approve." },
        ],
      },
    ],
  },
  {
    id: "cv_q3",
    title: "Summarise Q3 for the team",
    group: "Yesterday",
    updated: "16:10",
    actions: ["weekly_report"],
    recalls: ["m4", "m6"],
    messages: [
      { id: "t1", from: "you", at: "16:02", text: "Summarise Q3 for the team." },
      {
        id: "t2",
        from: "syxoria",
        at: "16:04",
        blocks: [
          { kind: "text", text: "Here is the short version, written for Inès, Théo and Clara." },
          {
            kind: "figures",
            items: [
              { label: "Q3 revenue", value: "€162,200", note: "9% up on Q2" },
              { label: "Grew fastest", value: "Hospitality", note: "enquiries up 38%" },
            ],
          },
          {
            kind: "list",
            title: "In three lines",
            items: [
              "A good quarter, 9% up on Q2 and led by hotels and restaurants.",
              "Replies slowed in September, and proposals that wait too long close less often.",
              "For Q4: €190,000 of revenue, faster replies and three new hospitality clients.",
            ],
          },
          { kind: "text", text: "I can open Friday’s weekly summary with it. It goes to the team at 17:00." },
          { kind: "sources", items: [{ label: "Q3 performance review", detail: "Documents, Reports", href: "/app/documents?doc=doc_q3" }] },
        ],
      },
      { id: "t3", from: "you", at: "16:08", text: "Yes, add it to Friday’s summary." },
      {
        id: "t4",
        from: "syxoria",
        at: "16:10",
        blocks: [
          { kind: "text", text: "Done. It will open Friday’s summary, and it stays inside the studio." },
          { kind: "action", actionId: "weekly_report" },
        ],
      },
    ],
  },
  {
    id: "cv_hosp",
    title: "A hospitality offer for 2027",
    group: "Previous 7 days",
    updated: "Mon",
    actions: [],
    people: ["cotesud", "pavillon", "ondine"],
    recalls: ["m3", "m6"],
    messages: [
      { id: "o1", from: "you", at: "10:40", text: "Should we build a hospitality offer for 2027?" },
      {
        id: "o2",
        from: "syxoria",
        at: "10:42",
        blocks: [
          { kind: "text", text: "I think so. Hotels and restaurants come to you more often, and they decide faster." },
          {
            kind: "figures",
            items: [
              { label: "Enquiries", value: "38%", note: "more this quarter" },
              { label: "They sign", value: "9 days", note: "faster than average" },
              { label: "Webinar", value: "7 leads", note: "qualified, 8 October" },
            ],
          },
          { kind: "text", text: "Your goal is three new hospitality clients by the end of the year, and Côté Sud Hôtels and Pavillon Nord are already in conversation." },
          {
            kind: "list",
            title: "What an offer could hold",
            items: [
              "Identity, signage and menus as one package, the way Brasserie Ondine bought them.",
              "Three sizes, priced from your 2026 grid, so a quote can go out the same day.",
              "Brasserie Ondine’s new menus as the proof.",
            ],
          },
          { kind: "text", text: "Shall I draft a one page outline for the team?" },
        ],
      },
      { id: "o3", from: "you", at: "10:51", text: "Not yet. Let’s see how Côté Sud goes first." },
      {
        id: "o4",
        from: "syxoria",
        at: "10:51",
        blocks: [{ kind: "text", text: "Understood. I’ll bring it back when Côté Sud signs, or at the end of November if they have not decided by then." }],
      },
    ],
  },
  {
    id: "cv_cash",
    title: "Can we afford a new designer in January?",
    group: "Previous 7 days",
    updated: "Sun",
    actions: [],
    people: ["rive"],
    messages: [
      { id: "d1", from: "you", at: "20:14", text: "Can we afford a new designer in January?" },
      {
        id: "d2",
        from: "syxoria",
        at: "20:16",
        blocks: [
          { kind: "text", text: "Yes, if Atelier Rive signs. Without it, your cushion would drop just under the four months you want to keep." },
          {
            kind: "figures",
            items: [
              { label: "Cash today", value: "€186,300", note: "about four months of costs" },
              { label: "With a designer", value: "3.7 months", note: "of costs in cash" },
              { label: "Atelier Rive", value: "€42,000", note: "about eight months of a designer" },
            ],
          },
          { kind: "text", text: "I counted a senior designer at about €5,400 a month, all costs included. I’ll tell you the day Camille signs." },
          { kind: "sources", items: [{ label: "Finance", detail: "Cash and costs, last twelve months", href: "/app/business/finance" }] },
        ],
      },
      { id: "d3", from: "you", at: "20:20", text: "Keep me posted." },
      { id: "d4", from: "syxoria", at: "20:20", blocks: [{ kind: "text", text: "I will." }] },
    ],
  },
];

/** What the owner can ask in one click, by what they might want to do: each has a prepared answer */
export const mockPrompts = [
  { label: "Ask", text: "What changed in the business this week?" },
  { label: "Analyse", text: "Why is our win rate falling?" },
  { label: "Instruct", text: "Draft a thank you note to Galerie Sorel" },
  { label: "Prepare", text: "Prepare tomorrow’s call with Boulangeries Lumière" },
];

export const mockSearchIndex: SearchItem[] = [
  { id: "s_rive", kind: "Clients", title: "Atelier Rive", detail: "Camille Roy · Contract sent · €42,000", href: "/app/clients?client=rive" },
  { id: "s_lenoir", kind: "Clients", title: "Maison Lenoir", detail: "Hugo Lenoir · Revised timeline to approve", href: "/app/clients?client=lenoir" },
  { id: "s_cotesud", kind: "Clients", title: "Côté Sud Hôtels", detail: "Nora Haddad · Quote returned", href: "/app/clients?client=cotesud" },
  { id: "s_ondine", kind: "Clients", title: "Brasserie Ondine", detail: "Julien Marchetti · Invoice due Monday", href: "/app/clients?client=ondine" },
  { id: "s_orea", kind: "Clients", title: "Oréa Clinics", detail: "Dr Léa Fournier · Quiet for 18 days", href: "/app/clients?client=orea" },
  { id: "s_halden", kind: "Clients", title: "Halden & Co", detail: "Sophie Halden · Retainer renewal", href: "/app/clients?client=halden" },
  { id: "s_doc1", kind: "Documents", title: "Atelier Rive, contract v3", detail: "PDF · Contracts · Today", href: "/app/documents?doc=doc_rive_contract" },
  { id: "s_doc2", kind: "Documents", title: "Côté Sud Hôtels, revised quote", detail: "PDF · Proposals · Today", href: "/app/documents?doc=doc_nora_quote" },
  { id: "s_doc3", kind: "Documents", title: "Studio pricing grid 2026", detail: "XLSX · Data", href: "/app/documents?doc=doc_pricing" },
  { id: "s_doc4", kind: "Documents", title: "Q3 performance review", detail: "PPTX · Reports", href: "/app/documents?doc=doc_q3" },
  { id: "s_cv1", kind: "Conversations", title: "Why Nora’s quote bounced, and what now", detail: "Today 18:58", href: "/app/assistant?c=cv_nora" },
  { id: "s_cv2", kind: "Conversations", title: "Which proposals are at risk this week?", detail: "Today 9:20", href: "/app/assistant?c=cv_risk" },
  { id: "s_a1", kind: "Actions", title: "Revised timeline for Maison Lenoir", detail: "Awaiting approval", href: "/app/actions?action=timeline_hugo" },
  { id: "s_a2", kind: "Actions", title: "Pause the ‘logo maker’ ad group", detail: "Awaiting approval", href: "/app/actions?action=pause_ads" },
  { id: "s_a3", kind: "Actions", title: "Payment reminder for Verrerie Morel", detail: "Approved, goes out tomorrow 9:00", href: "/app/actions?action=reminder_morel" },
  { id: "s_a4", kind: "Actions", title: "Revised quote for Nora Haddad", detail: "Unsuccessful, returned 14:12", href: "/app/actions?action=quote_nora" },
  { id: "s_d1", kind: "Decisions", title: "You approved the contract and the quote", detail: "Today 14:05", href: "/app/history?event=h9" },
  { id: "s_d2", kind: "Decisions", title: "You switched to Autonomous mode", detail: "Monday 12 Oct", href: "/app/history?event=h20" },
  { id: "s_p1", kind: "Pages", title: "Sales", detail: "Business Management", href: "/app/business/sales" },
  { id: "s_p2", kind: "Pages", title: "Finance", detail: "Business Management", href: "/app/business/finance" },
  { id: "s_p3", kind: "Pages", title: "Autonomy & safety", detail: "Settings & Autonomy", href: "/app/settings?tab=autonomy" },
  { id: "s_p4", kind: "Pages", title: "Integrations", detail: "Connected tools", href: "/app/integrations" },
];

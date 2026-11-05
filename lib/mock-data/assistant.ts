import type { AssistantBrought, AssistantDoing, PreparedAnswer } from "@/types/workspace";

/**
 * The assistant on the demo evening (Wednesday 14 October, just before 19:00): what it brings up
 * when Maël comes to it, what it is doing at the moment, and an answer prepared for every
 * question it suggests. The same story as the briefings, the actions and the clients. Nothing is
 * generated: the assistant is not connected to an AI yet. The UI only reads this through
 * services/assistant.ts. No dashes or hyphenated words in UI copy.
 */

/** What it says first, after the greeting */
export const mockAssistantLead = "The contract is with Camille. Before you leave, three things are worth a minute.";

/** What it brings up first, most pressing first: each opens the conversation already about it */
export const mockAssistantBrought: AssistantBrought[] = [
  {
    id: "b_nora",
    actionId: "quote_nora",
    conversationId: "cv_nora",
    title: "Nora never received her quote.",
    line: "Her address no longer works. I held 9:30 tomorrow for you to call her.",
  },
  {
    id: "b_hugo",
    actionId: "timeline_hugo",
    conversationId: "cv_hugo",
    title: "Hugo’s March timeline is ready.",
    line: "Same scope, same price, and the signature moves into October.",
  },
  {
    id: "b_ads",
    actionId: "pause_ads",
    conversationId: "cv_ads",
    title: "One ad group spends without results.",
    line: "€1,450 this month, and not one qualified lead.",
  },
];

/** What it is in the middle of, one thing at a time: the quiet line beside its name */
export const mockAssistantDoing: AssistantDoing[] = [
  { verb: "Analysing", text: "tonight’s emails, for tomorrow’s 8:00 briefing" },
  { verb: "Preparing", text: "Atelier Rive’s deposit invoice, for the day Camille signs" },
  { verb: "Doing", text: "today’s replies in HubSpot, 3 of 5 logged" },
];

export const mockPreparedAnswers: PreparedAnswer[] = [
  {
    id: "q_today",
    question: "What needs my attention today?",
    reads: ["your evening briefing", "actions waiting for you", "your calendar for tomorrow"],
    people: ["cotesud", "lenoir"],
    recalls: ["m9"],
    blocks: [
      { kind: "text", text: "Two things, and both can wait until tomorrow morning." },
      {
        kind: "list",
        title: "Before 10:00 tomorrow",
        items: ["Call Nora at 9:30. Her quote never reached her, and the slot is held.", "Approve or change Hugo’s March timeline. It goes out as soon as you say so."],
      },
      { kind: "text", text: "Everything else is moving on its own: the contract is with Camille, and I’m logging today’s replies in HubSpot." },
      { kind: "action", actionId: "timeline_hugo" },
      {
        kind: "sources",
        items: [
          { label: "Evening briefing", detail: "Today 18:30", href: "/app/briefings?briefing=b_evening" },
          { label: "Actions & Approvals", detail: "3 waiting for you", href: "/app/actions" },
        ],
      },
    ],
  },
  {
    id: "q_nora",
    question: "Why did Nora’s quote fail?",
    reads: ["your emails with Côté Sud Hôtels", "the bounce from their mail server", "HubSpot, Côté Sud Hôtels"],
    people: ["cotesud"],
    recalls: ["m10"],
    blocks: [
      { kind: "text", text: "Her mail server returned it at 14:12: the address at Côté Sud Hôtels no longer receives mail. Nothing is wrong with the quote itself." },
      { kind: "text", text: "A call is the quickest way to a new address. She returns calls the same day, so I held 9:30 tomorrow for you." },
      { kind: "action", actionId: "quote_nora" },
      { kind: "sources", items: [{ label: "Bounce from cotesud-hotels.fr", detail: "Gmail, today 14:12", href: "/app/history?event=h6" }] },
    ],
  },
  {
    id: "q_rive",
    question: "Where does Atelier Rive stand?",
    reads: ["contract tracking", "Camille’s emails", "HubSpot, Atelier Rive"],
    people: ["rive"],
    blocks: [
      { kind: "text", text: "Close. The contract went out at 14:10 and Camille has opened it twice since. She asked to sign by Friday." },
      {
        kind: "figures",
        items: [
          { label: "Contract", value: "€42,000", note: "version 3" },
          { label: "Last opened", value: "16:02", note: "second time today" },
          { label: "Signature due", value: "Friday", note: "two days left" },
        ],
      },
      { kind: "text", text: "If it is still unsigned on Thursday afternoon, I suggest a short note to keep the date. It is set aside as a suggestion: nothing goes to Camille unless you say so." },
      { kind: "action", actionId: "checkin_camille" },
      { kind: "sources", items: [{ label: "Atelier Rive, contract v3", detail: "Documents, today", href: "/app/documents?doc=doc_rive_contract" }] },
    ],
  },
  {
    id: "q_week",
    question: "What changed in the business this week?",
    reads: ["this week’s briefings", "HubSpot deals", "Google Ads"],
    people: ["rive", "lenoir"],
    blocks: [
      { kind: "text", text: "Three things moved forward, and one went the wrong way." },
      {
        kind: "list",
        items: [
          "Atelier Rive is ready to sign: €42,000, due Friday.",
          "Maison Lenoir wants to start in March, which brings €21,500 into October.",
          "Hospitality enquiries are up 38% this quarter, and they sign nine days faster.",
        ],
      },
      { kind: "text", text: "The wrong way: your ads now cost 41% more per lead. Broad match started buying ‘free logo’ searches on 23 September. I prepared the fix, it waits for you." },
      { kind: "action", actionId: "pause_ads" },
      {
        kind: "sources",
        items: [
          { label: "Sales", detail: "This month", href: "/app/business/sales" },
          { label: "Marketing", detail: "Google Ads, last 21 days", href: "/app/business/marketing" },
        ],
      },
    ],
  },
  {
    id: "q_win",
    question: "Why is our win rate falling?",
    reads: ["your 128 past proposals", "reply times, last six months", "HubSpot deal stages"],
    people: ["orea", "kanso"],
    recalls: ["m5"],
    blocks: [
      { kind: "text", text: "Mostly because replies got slower, not because your prices or proposals got worse." },
      {
        kind: "figures",
        items: [
          { label: "Win rate", value: "38%", note: "7 points under your goal" },
          { label: "Average reply", value: "3.1 days", note: "1.3 days slower" },
          { label: "After ten quiet days", value: "Half", note: "as many proposals close" },
        ],
      },
      {
        kind: "list",
        title: "What I suggest",
        items: [
          "Let me flag any proposal that stays quiet for seven days, before it reaches ten.",
          "Start with Oréa Clinics: quiet for 18 days, and the references Léa asked for are drafted.",
        ],
      },
      { kind: "action", actionId: "refs_orea" },
      {
        kind: "sources",
        items: [
          { label: "Sales", detail: "Win rate by month", href: "/app/business/sales" },
          { label: "Weekly summary", detail: "5 to 11 October", href: "/app/history?tab=reports" },
        ],
      },
    ],
  },
  {
    id: "q_sorel",
    question: "Draft a thank you note to Galerie Sorel",
    reads: ["your emails with Hélène Sorel", "how the studio speaks", "the referral thank you series"],
    people: ["sorel"],
    recalls: ["m7", "m8"],
    blocks: [
      { kind: "text", text: "It’s already written: Hélène is one of the five clients I prepared a thank you note for yesterday. Here is hers, signed by you as founder." },
      {
        kind: "draft",
        to: "Hélène Sorel, Galerie Sorel",
        subject: "Thank you for Léa",
        body: [
          "Hello Hélène,",
          "Thank you for introducing us to Léa at Oréa Clinics. Introductions like yours are how our best projects begin.",
          "Next time you are in Lyon, come by the studio for a coffee. We would love to show you what we are working on.",
          "Warmly,",
          "Maël",
        ],
      },
      { kind: "text", text: "It waits with the four others. Nothing goes out until you have read them." },
      { kind: "action", actionId: "referral_series" },
    ],
  },
  {
    id: "q_lumiere",
    question: "Prepare tomorrow’s call with Boulangeries Lumière",
    reads: ["their enquiry", "their website", "similar past projects"],
    people: ["lumiere"],
    blocks: [
      { kind: "text", text: "The brief has been ready since 11:30. What matters most for 14:00 tomorrow:" },
      {
        kind: "figures",
        items: [
          { label: "Shops", value: "14", note: "a family business in Lille" },
          { label: "Budget", value: "About €10,000", note: "said in their enquiry" },
          { label: "Their ask", value: "A refresh", note: "of the identity" },
        ],
      },
      {
        kind: "list",
        title: "Worth asking Marc",
        items: [
          "Who decides: Marc alone, or the family too?",
          "Do the shop fronts change with the identity, or later?",
          "What made them write to you rather than a local studio?",
        ],
      },
      { kind: "action", actionId: "brief_lumiere" },
      { kind: "sources", items: [{ label: "Discovery brief, Lumière", detail: "Documents, today 11:30", href: "/app/clients?client=lumiere" }] },
    ],
  },
];

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
  { id: "cv_hugo", title: "Can we start Maison Lenoir in March?", group: "Today", updated: "12:30", actions: ["timeline_hugo"], messages: [] },
  { id: "cv_q3", title: "Summarise Q3 for the team", group: "Yesterday", updated: "16:10", actions: ["weekly_report"], messages: [] },
  { id: "cv_ads", title: "Why are ads getting more expensive?", group: "Yesterday", updated: "11:05", actions: ["pause_ads"], messages: [] },
  { id: "cv_hosp", title: "A hospitality offer for 2027", group: "Previous 7 days", updated: "Mon", actions: [], messages: [] },
  { id: "cv_cash", title: "Can we afford a new designer in January?", group: "Previous 7 days", updated: "Sun", actions: [], messages: [] },
];

/** Prompts the composer offers, by what the owner might want to do */
export const mockPrompts = [
  { label: "Ask", text: "What changed in the business this week?" },
  { label: "Analyse", text: "Why is our win rate falling?" },
  { label: "Instruct", text: "Draft a thank you note to Galerie Sorel" },
  { label: "Prepare", text: "Prepare Friday’s call with Camille" },
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

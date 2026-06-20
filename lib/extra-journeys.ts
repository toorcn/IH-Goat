import { advisor } from "./demo-data";
import type { ActionItem, Advisor, Client, GraphEdge, GraphNode, Meeting, MemoryItem } from "./types";

export type ExtraJourney = {
  advisor: Advisor;
  client: Client;
  meetings: Meeting[];
  memories: MemoryItem[];
  actions: ActionItem[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  suggestedQuestions: string[];
  briefing: string;
};

const aishaClient: Client = {
  id: "client-aisha",
  name: "Aisha Rahman",
  clientType: "SME owner",
  riskProfile: "Balanced growth",
  relationshipSince: "2021"
};

const aishaMeetings: Meeting[] = [
  {
    id: "meeting-2026-06-21-aisha",
    clientId: aishaClient.id,
    advisorId: advisor.id,
    startsAt: "2026-06-21T14:00:00+08:00",
    type: "Business owner review",
    location: "Video",
    objective: "Review café expansion, key-person cover, and succession planning",
    status: "not_started"
  },
  {
    id: "meeting-2026-05-03-aisha",
    clientId: aishaClient.id,
    advisorId: advisor.id,
    startsAt: "2026-05-03T15:00:00+08:00",
    endedAt: "2026-05-03T15:48:00+08:00",
    type: "Planning review",
    location: "In person",
    objective: "Expansion financing and business continuity",
    status: "review"
  }
];

const aishaMemories: MemoryItem[] = [
  {
    id: "memory-aisha-expansion",
    clientId: aishaClient.id,
    category: "Goal/Objective",
    title: "Opening third café outlet",
    summary: "Aisha is preparing to open a third café outlet in Q4 and wants cash-flow buffers protected.",
    source: "2026-05-03 meeting",
    sourceSnippet: "If the third outlet opens in Q4, I need to know the business can still breathe.",
    confidence: 0.94,
    status: "known",
    validFrom: "2026-05-03",
    lastConfirmedAt: "2026-05-03",
    salience: 0.96
  },
  {
    id: "memory-aisha-loan-guarantee",
    clientId: aishaClient.id,
    category: "Unresolved Concern",
    title: "Personal guarantee on business loan",
    summary: "She is worried about signing a personal guarantee for the expansion loan.",
    source: "2026-05-03 meeting",
    sourceSnippet: "The bank wants a personal guarantee, and that makes me nervous.",
    confidence: 0.91,
    status: "open",
    validFrom: "2026-05-03",
    lastConfirmedAt: "2026-05-03",
    salience: 0.95
  },
  {
    id: "memory-aisha-key-person",
    clientId: aishaClient.id,
    category: "Referral Opportunity",
    title: "Needs business protection specialist",
    summary: "Aisha is open to a specialist who can explain key-person and buy-sell protection clearly.",
    source: "2026-05-03 meeting",
    sourceSnippet: "Can you bring in someone who understands key-person cover for SMEs?",
    confidence: 0.9,
    status: "open",
    validFrom: "2026-05-03",
    lastConfirmedAt: "2026-05-03",
    salience: 0.93
  },
  {
    id: "memory-aisha-cofounder",
    clientId: aishaClient.id,
    category: "Relationship Mention",
    title: "Co-founder handles operations",
    summary: "Her co-founder Farid runs day-to-day operations and should be included in continuity planning.",
    source: "2026-05-03 meeting",
    sourceSnippet: "Farid runs operations; if anything happens to either of us, the cafés need a plan.",
    confidence: 0.88,
    status: "known",
    validFrom: "2026-05-03",
    lastConfirmedAt: "2026-05-03",
    salience: 0.84
  },
  {
    id: "memory-aisha-accountant-promise",
    clientId: aishaClient.id,
    category: "Promise/Commitment",
    title: "Send accountant-ready summary",
    summary: "Sarah promised to send a short protection summary Aisha can share with her accountant.",
    source: "2026-05-03 meeting",
    sourceSnippet: "Send me something simple that I can forward to my accountant before we decide.",
    confidence: 0.9,
    status: "open",
    validFrom: "2026-05-03",
    lastConfirmedAt: "2026-05-03",
    salience: 0.86
  }
];

const aishaActions: ActionItem[] = [
  {
    id: "action-aisha-priya-intro",
    clientId: aishaClient.id,
    meetingId: aishaMeetings[0].id,
    title: "Introduce Aisha to Priya Menon",
    actionType: "introduction",
    dueAt: "2026-06-23",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Priya, I would like to introduce Aisha Rahman, who is expanding her café group and wants clear advice on key-person and buy-sell protection."
  },
  {
    id: "action-aisha-accountant-summary",
    clientId: aishaClient.id,
    meetingId: aishaMeetings[0].id,
    title: "Send accountant-ready protection summary",
    actionType: "follow_up",
    dueAt: "2026-06-22",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Hi Aisha, here is the concise protection summary you can forward to your accountant before we compare options."
  }
];

const aishaGraphNodes: GraphNode[] = [
  { id: advisor.id, label: advisor.name, type: "Advisor", note: advisor.firm },
  { id: aishaClient.id, label: aishaClient.name, type: "Client", note: "SME owner expanding café group" },
  { id: "person-aisha-farid", label: "Farid", type: "Person", note: "Co-founder, operations lead" },
  { id: "person-aisha-accountant", label: "Ms. Chong", type: "Person", note: "External accountant" },
  { id: "referral-business-protection", label: "Business Protection Review", type: "ReferralOpportunity", note: "Key-person and buy-sell planning" },
  { id: "specialist-priya", label: "Priya Menon", type: "Specialist", note: "Business protection specialist" },
  { id: "specialist-kenji", label: "Kenji Tan", type: "Specialist", note: "SME tax and succession advisor" }
];

const aishaGraphEdges: GraphEdge[] = [
  { id: "edge-aisha-manages", source: advisor.id, target: aishaClient.id, label: "manages" },
  { id: "edge-aisha-cofounder", source: aishaClient.id, target: "person-aisha-farid", label: "co-founder" },
  { id: "edge-aisha-accountant", source: aishaClient.id, target: "person-aisha-accountant", label: "accountant" },
  { id: "edge-aisha-referral", source: aishaClient.id, target: "referral-business-protection", label: "has opportunity" },
  { id: "edge-aisha-priya", source: "referral-business-protection", target: "specialist-priya", label: "matches" },
  { id: "edge-aisha-kenji", source: "referral-business-protection", target: "specialist-kenji", label: "tax support" }
];

const danielClient: Client = {
  id: "client-daniel",
  name: "Daniel Koh",
  clientType: "Young professional",
  riskProfile: "Growth with protection gaps",
  relationshipSince: "2024"
};

const danielMeetings: Meeting[] = [
  {
    id: "meeting-2026-06-22-daniel",
    clientId: danielClient.id,
    advisorId: advisor.id,
    startsAt: "2026-06-22T09:30:00+08:00",
    type: "Life milestone review",
    location: "Phone",
    objective: "Review first home purchase, wedding fund, and mortgage protection",
    status: "not_started"
  },
  {
    id: "meeting-2026-04-18-daniel",
    clientId: danielClient.id,
    advisorId: advisor.id,
    startsAt: "2026-04-18T16:00:00+08:00",
    endedAt: "2026-04-18T16:35:00+08:00",
    type: "Planning review",
    location: "Video",
    objective: "Budgeting after condo booking fee",
    status: "review"
  }
];

const danielMemories: MemoryItem[] = [
  {
    id: "memory-daniel-condo",
    clientId: danielClient.id,
    category: "Life Event",
    title: "Booked first condo",
    summary: "Daniel paid the booking fee for his first condo and is waiting for loan approval.",
    source: "2026-04-18 meeting",
    sourceSnippet: "I put down the booking fee, now I am waiting for the bank to confirm the loan.",
    confidence: 0.95,
    status: "known",
    validFrom: "2026-04-18",
    lastConfirmedAt: "2026-04-18",
    salience: 0.95
  },
  {
    id: "memory-daniel-wedding",
    clientId: danielClient.id,
    category: "Goal/Objective",
    title: "Wedding fund must stay liquid",
    summary: "He wants to protect liquidity for his wedding fund while committing to the condo.",
    source: "2026-04-18 meeting",
    sourceSnippet: "I cannot lock everything up because the wedding fund needs to stay flexible.",
    confidence: 0.9,
    status: "known",
    validFrom: "2026-04-18",
    lastConfirmedAt: "2026-04-18",
    salience: 0.89
  },
  {
    id: "memory-daniel-mortgage-protection",
    clientId: danielClient.id,
    category: "Unresolved Concern",
    title: "Mortgage protection gap",
    summary: "Daniel has not decided how much mortgage protection he needs after the condo loan is approved.",
    source: "2026-04-18 meeting",
    sourceSnippet: "Once the loan amount is confirmed, I need to know what protection is enough but not overkill.",
    confidence: 0.92,
    status: "open",
    validFrom: "2026-04-18",
    lastConfirmedAt: "2026-04-18",
    salience: 0.96
  },
  {
    id: "memory-daniel-parents",
    clientId: danielClient.id,
    category: "Relationship Mention",
    title: "Supports parents monthly",
    summary: "Daniel sends monthly support to his parents and wants that obligation preserved in cash-flow planning.",
    source: "2026-04-18 meeting",
    sourceSnippet: "I still send money to my parents every month, so the budget cannot ignore that.",
    confidence: 0.88,
    status: "known",
    validFrom: "2026-04-18",
    lastConfirmedAt: "2026-04-18",
    salience: 0.84
  },
  {
    id: "memory-daniel-mortgage-specialist",
    clientId: danielClient.id,
    category: "Referral Opportunity",
    title: "Needs mortgage protection specialist",
    summary: "Daniel is open to a specialist who can compare mortgage protection options after loan approval.",
    source: "2026-04-18 meeting",
    sourceSnippet: "If you have someone who can explain mortgage protection simply, I am open to that.",
    confidence: 0.89,
    status: "open",
    validFrom: "2026-04-18",
    lastConfirmedAt: "2026-04-18",
    salience: 0.9
  }
];

const danielActions: ActionItem[] = [
  {
    id: "action-daniel-loan-check",
    clientId: danielClient.id,
    meetingId: danielMeetings[0].id,
    title: "Check condo loan approval amount",
    actionType: "follow_up",
    dueAt: "2026-06-23",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Hi Daniel, once the bank confirms the approved loan amount, send it over and I will model the protection gap."
  },
  {
    id: "action-daniel-mortgage-intro",
    clientId: danielClient.id,
    meetingId: danielMeetings[0].id,
    title: "Introduce Daniel to Aaron Lee",
    actionType: "introduction",
    dueAt: "2026-06-25",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Aaron, I would like to introduce Daniel Koh, who is finalising his first condo loan and wants clear mortgage protection options."
  }
];

const danielGraphNodes: GraphNode[] = [
  { id: advisor.id, label: advisor.name, type: "Advisor", note: advisor.firm },
  { id: danielClient.id, label: danielClient.name, type: "Client", note: "Young professional buying first home" },
  { id: "person-daniel-amelia", label: "Amelia", type: "Person", note: "Fiancée" },
  { id: "person-daniel-parents", label: "Parents", type: "Person", note: "Monthly support obligation" },
  { id: "referral-mortgage-protection", label: "Mortgage Protection Review", type: "ReferralOpportunity", note: "Protection sizing after loan approval" },
  { id: "specialist-aaron", label: "Aaron Lee", type: "Specialist", note: "Mortgage protection specialist" },
  { id: "specialist-nadia", label: "Nadia Wong", type: "Specialist", note: "Cash-flow and budgeting coach" }
];

const danielGraphEdges: GraphEdge[] = [
  { id: "edge-daniel-manages", source: advisor.id, target: danielClient.id, label: "manages" },
  { id: "edge-daniel-fiancee", source: danielClient.id, target: "person-daniel-amelia", label: "fiancée" },
  { id: "edge-daniel-parents", source: danielClient.id, target: "person-daniel-parents", label: "supports" },
  { id: "edge-daniel-referral", source: danielClient.id, target: "referral-mortgage-protection", label: "has opportunity" },
  { id: "edge-daniel-aaron", source: "referral-mortgage-protection", target: "specialist-aaron", label: "matches" },
  { id: "edge-daniel-nadia", source: "referral-mortgage-protection", target: "specialist-nadia", label: "budget support" }
];

export const extraJourneys: ExtraJourney[] = [
  {
    advisor,
    client: aishaClient,
    meetings: aishaMeetings,
    memories: aishaMemories,
    actions: aishaActions,
    graphNodes: aishaGraphNodes,
    graphEdges: aishaGraphEdges,
    suggestedQuestions: [
      "What is Aisha worried about with the expansion loan?",
      "Who should I introduce Aisha to for business protection?",
      "What should I send her accountant?"
    ],
    briefing:
      "You are meeting Aisha Rahman at 2:00 PM. She is preparing to open a third café outlet and is worried about signing a personal guarantee for the expansion loan. Start with the business milestone, then ask whether she wants Priya Menon to explain key-person and buy-sell protection before she commits."
  },
  {
    advisor,
    client: danielClient,
    meetings: danielMeetings,
    memories: danielMemories,
    actions: danielActions,
    graphNodes: danielGraphNodes,
    graphEdges: danielGraphEdges,
    suggestedQuestions: [
      "What is Daniel's biggest protection gap after buying the condo?",
      "Who should I introduce Daniel to for mortgage protection?",
      "How does the wedding fund affect his plan?"
    ],
    briefing:
      "You are meeting Daniel Koh at 9:30 AM. He has booked his first condo, is waiting on loan approval, and wants to keep his wedding fund liquid while still supporting his parents. Ask for the approved loan amount, then suggest a simple mortgage protection comparison with Aaron Lee."
  }
];

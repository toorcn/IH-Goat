import type {
  ActionItem,
  Advisor,
  Client,
  ClientContext,
  ExtractedMemory,
  GraphEdge,
  GraphNode,
  Meeting,
  MemoryItem,
  SilentSuggestion,
  TranscriptEvent
} from "./types";

export const advisor: Advisor = {
  id: "adv-sarah",
  name: "Sarah Lim",
  firm: "Peak Wealth Advisors"
};

export const client: Client = {
  id: "client-tan",
  name: "Mr. Tan Wee Seng",
  clientType: "Family client",
  riskProfile: "Moderate",
  relationshipSince: "2017"
};

export const meetings: Meeting[] = [
  {
    id: "meeting-2026-06-20-tan",
    clientId: client.id,
    advisorId: advisor.id,
    startsAt: "2026-06-20T10:30:00+08:00",
    type: "Review",
    location: "In person",
    objective: "Review protection, estate planning, and family updates",
    status: "not_started"
  },
  {
    id: "meeting-2026-04-08-tan",
    clientId: client.id,
    advisorId: advisor.id,
    startsAt: "2026-04-08T11:00:00+08:00",
    endedAt: "2026-04-08T11:42:00+08:00",
    type: "Review",
    location: "Video",
    objective: "Estate planning and policy renewal concerns",
    status: "review"
  }
];

export const memories: MemoryItem[] = [
  {
    id: "memory-jia-nus",
    clientId: client.id,
    category: "Life Event",
    title: "Jia En accepted into NUS",
    summary: "Mr. Tan's daughter Jia En recently got into NUS.",
    source: "2026-04-08 meeting",
    sourceSnippet: "Jia En got into NUS, the whole family is excited.",
    confidence: 0.96,
    status: "known",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.94
  },
  {
    id: "memory-will-planning",
    clientId: client.id,
    category: "Unresolved Concern",
    title: "Will planning remains open",
    summary: "Will update was unresolved after the last estate planning discussion.",
    source: "2026-04-08 meeting",
    sourceSnippet: "I know I should update the will, but it feels hard to start.",
    confidence: 0.91,
    status: "open",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.98
  },
  {
    id: "memory-policy-hesitation",
    clientId: client.id,
    category: "Emotional Cue",
    title: "Hesitant about policy renewal",
    summary: "Mr. Tan seemed hesitant about renewing his protection policy.",
    source: "2026-04-08 meeting",
    sourceSnippet: "I am not sure if renewing now is the right move.",
    confidence: 0.86,
    status: "open",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.82
  },
  {
    id: "memory-family-transition",
    clientId: client.id,
    category: "Goal/Objective",
    title: "Smooth family transition",
    summary: "He wants the family's financial transition to feel smooth and low conflict.",
    source: "2026-04-08 meeting",
    sourceSnippet: "I want everyone to understand the plan and avoid confusion later.",
    confidence: 0.89,
    status: "known",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.87
  },
  {
    id: "memory-lawyer-request",
    clientId: client.id,
    category: "Referral Opportunity",
    title: "Asked for a good lawyer",
    summary: "Mr. Tan asked whether Sarah knew a good lawyer for estate matters.",
    source: "2026-04-08 meeting",
    sourceSnippet: "Do you know a good lawyer who can help with this?",
    confidence: 0.93,
    status: "open",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.9
  },
  {
    id: "memory-guide-promise",
    clientId: client.id,
    category: "Promise/Commitment",
    title: "Estate planning guide promised",
    summary: "Sarah promised to send an estate planning guide.",
    source: "2026-04-08 meeting",
    sourceSnippet: "I will send you a simple estate planning guide after this.",
    confidence: 0.95,
    status: "open",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.86
  }
];

export const actions: ActionItem[] = [
  {
    id: "action-guide",
    clientId: client.id,
    meetingId: meetings[0].id,
    title: "Send estate planning guide",
    actionType: "follow_up",
    dueAt: "2026-06-21",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Hi Mr. Tan, sharing the estate planning guide we discussed. The most useful sections for you are the will update checklist and family transition notes."
  },
  {
    id: "action-evelyn",
    clientId: client.id,
    meetingId: meetings[0].id,
    title: "Draft intro to Evelyn Ng",
    actionType: "introduction",
    dueAt: "2026-06-24",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Evelyn, I would like to introduce Mr. Tan Wee Seng, who is reviewing his will and family transition plan. Mr. Tan, Evelyn is an estate planning specialist I trust."
  },
  {
    id: "action-will-reminder",
    clientId: client.id,
    meetingId: meetings[0].id,
    title: "Create will planning reminder",
    actionType: "reminder",
    dueAt: "2026-07-04",
    owner: advisor.name,
    status: "pending"
  }
];

export const graphNodes: GraphNode[] = [
  {
    id: advisor.id,
    label: advisor.name,
    type: "Advisor",
    note: advisor.firm
  },
  {
    id: client.id,
    label: client.name,
    type: "Client",
    note: "Family client since 2017"
  },
  {
    id: "person-mdm-lim",
    label: "Mdm. Lim",
    type: "Person",
    note: "Spouse"
  },
  {
    id: "person-jia-en",
    label: "Jia En",
    type: "Person",
    note: "Daughter, recently accepted into NUS"
  },
  {
    id: "specialist-evelyn",
    label: "Evelyn Ng",
    type: "Specialist",
    note: "Estate planner, trusted specialist"
  },
  {
    id: "specialist-marcus",
    label: "Marcus Lee",
    type: "Specialist",
    note: "Lawyer in Sarah's network"
  },
  {
    id: "referral-estate",
    label: "Estate Planning Intro",
    type: "ReferralOpportunity",
    note: "Warm introduction for will update"
  }
];

export const graphEdges: GraphEdge[] = [
  {
    id: "edge-manages",
    source: advisor.id,
    target: client.id,
    label: "manages"
  },
  {
    id: "edge-spouse",
    source: client.id,
    target: "person-mdm-lim",
    label: "spouse"
  },
  {
    id: "edge-daughter",
    source: client.id,
    target: "person-jia-en",
    label: "daughter"
  },
  {
    id: "edge-referral",
    source: client.id,
    target: "referral-estate",
    label: "has opportunity"
  },
  {
    id: "edge-evelyn",
    source: "referral-estate",
    target: "specialist-evelyn",
    label: "matches"
  },
  {
    id: "edge-marcus",
    source: "referral-estate",
    target: "specialist-marcus",
    label: "legal support"
  }
];

export const suggestedQuestions = [
  "How has Jia En's NUS news changed your planning priorities?",
  "What has made the will update hard to complete?",
  "Would a warm introduction to Evelyn Ng help you take the next step?",
  "What would make the policy renewal feel clearly worth it?"
];

export function getClientContext(clientId = client.id): ClientContext {
  if (clientId !== client.id) {
    throw new Error(`Unknown demo client: ${clientId}`);
  }

  return {
    advisor,
    client,
    upcomingMeeting: meetings[0],
    lastMeeting: meetings[1],
    memories,
    actions,
    graph: {
      nodes: graphNodes,
      edges: graphEdges
    },
    suggestedQuestions,
    memorySource: "demo",
    briefing:
      "You are meeting Mr. Tan Wee Seng at 10:30. You last met on 2026-04-08, about 10 weeks ago. Last time, will planning was unresolved and he seemed hesitant about policy renewal. His daughter Jia En recently got into NUS, so open by congratulating him before moving into estate planning. Useful next questions: what has made the will update hard to complete, and would an introduction to Evelyn Ng help?"
  };
}

export function getMeeting(meetingId: string): Meeting | undefined {
  return meetings.find((meeting) => meeting.id === meetingId);
}

export function getCalendar() {
  return meetings
    .filter((meeting) => meeting.status !== "review")
    .map((meeting) => ({
      ...meeting,
      advisor,
      client
    }));
}

export function extractMeetingSignals(events: TranscriptEvent[]) {
  const text = events.map((event) => event.text).join(" ").toLowerCase();
  const now = new Date().toISOString();
  const extracted: ExtractedMemory[] = [];
  const suggestions: SilentSuggestion[] = [];

  if (text.includes("nus") || text.includes("jia")) {
    suggestions.push({
      id: "suggest-jia",
      title: "Start with Jia En",
      reason: "A family milestone is already high salience in memory.",
      source: "Life event: Jia En accepted into NUS",
      priority: "medium"
    });
    extracted.push({
      id: "extract-jia-followup",
      clientId: client.id,
      category: "Life Event",
      summary: "Jia En's NUS milestone came up again in the meeting.",
      sourceSnippet: latestMatchingSnippet(events, ["nus", "jia"]),
      timestamp: now,
      confidence: 0.88,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_LIFE_EVENT]->(:LifeEvent {title: 'Jia En NUS milestone reconfirmed'})"
    });
  }

  if (text.includes("baby") || text.includes("expecting") || text.includes("wife is expecting")) {
    extracted.push({
      id: "extract-growing-family",
      clientId: client.id,
      category: "Life Event",
      summary: "Mr. Tan's wife is expecting, making family protection and estate planning more urgent.",
      sourceSnippet: latestMatchingSnippet(events, ["baby", "expecting", "wife"]),
      timestamp: now,
      confidence: 0.91,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_LIFE_EVENT]->(:LifeEvent {title: 'Wife expecting baby'})"
    });
  }

  if (text.includes("will") || text.includes("estate")) {
    suggestions.push({
      id: "suggest-will",
      title: "Ask what is blocking the will update",
      reason: "Will planning is unresolved from the last meeting.",
      source: "Open concern from 2026-04-08",
      priority: "high"
    });
    extracted.push({
      id: "extract-will",
      clientId: client.id,
      category: "Unresolved Concern",
      summary: "Will planning remains an active unresolved concern.",
      sourceSnippet: latestMatchingSnippet(events, ["will", "estate"]),
      timestamp: now,
      confidence: 0.9,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_CONCERN]->(:Concern {title: 'Will planning remains open'})"
    });
  }

  if (text.includes("lawyer") || text.includes("evelyn") || text.includes("marcus")) {
    suggestions.push({
      id: "suggest-referral",
      title: "Offer a warm specialist introduction",
      reason: "Mr. Tan previously asked for legal or estate planning help.",
      source: "Referral opportunity from 2026-04-08",
      priority: "high"
    });
    extracted.push({
      id: "extract-referral",
      clientId: client.id,
      category: "Referral Opportunity",
      summary: "Client is open to estate planning or legal specialist support.",
      sourceSnippet: latestMatchingSnippet(events, ["lawyer", "evelyn", "marcus"]),
      timestamp: now,
      confidence: 0.92,
      proposedGraphMutation:
        "MERGE (r:ReferralOpportunity {id: 'referral-estate'}) SET r.status = 'ready_for_intro'"
    });
  }

  if (text.includes("guide") || text.includes("send")) {
    extracted.push({
      id: "extract-guide",
      clientId: client.id,
      category: "Follow-Up Action",
      summary: "Send the estate planning guide after the meeting.",
      sourceSnippet: latestMatchingSnippet(events, ["guide", "send"]),
      timestamp: now,
      confidence: 0.87,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_ACTION]->(:Action {title: 'Send estate planning guide'})"
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "suggest-default",
      title: "Reconfirm the next concrete step",
      reason: "The conversation has not yet touched an open concern.",
      source: "Meeting objective",
      priority: "low"
    });
  }

  return {
    suggestions: dedupeById(suggestions),
    extracted: dedupeById(extracted)
  };
}

function latestMatchingSnippet(events: TranscriptEvent[], terms: string[]) {
  const match = [...events]
    .reverse()
    .find((event) => terms.some((term) => event.text.toLowerCase().includes(term)));
  return match?.text ?? events.at(-1)?.text ?? "No transcript snippet available.";
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

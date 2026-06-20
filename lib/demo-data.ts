import type {
  ActionItem,
  Advisor,
  Client,
  ClientContext,
  DailyBrief,
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
  },
  {
    id: "memory-ong-business-contact",
    clientId: client.id,
    category: "Relationship Mention",
    title: "Mr. Ong may need business succession help",
    summary:
      "Mr. Tan mentioned Mr. Ong, a friend who owns a family business and may need succession planning advice.",
    source: "2026-04-08 meeting",
    sourceSnippet:
      "My friend Mr. Ong runs a family business and might need help thinking through succession.",
    confidence: 0.81,
    status: "open",
    validFrom: "2026-04-08",
    lastConfirmedAt: "2026-04-08",
    salience: 0.78
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
  },
  {
    id: "action-ong-network",
    clientId: client.id,
    meetingId: meetings[0].id,
    title: "Log Mr. Ong as referral watchlist contact",
    actionType: "network_health",
    dueAt: "2026-06-21",
    owner: advisor.name,
    status: "pending",
    draftText:
      "Add Mr. Ong to Sarah's referral watchlist and revisit whether Mr. Tan is comfortable making a warm introduction."
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
  },
  {
    id: "person-ong",
    label: "Mr. Ong",
    type: "Person",
    note: "Friend with family business succession needs"
  },
  {
    id: "referral-business-succession",
    label: "Business Succession Lead",
    type: "ReferralOpportunity",
    note: "Potential referral from Mr. Tan's network"
  },
  {
    id: "meeting-2026-04-08-tan",
    label: "2026-04-08 Review",
    type: "Meeting",
    note: "Estate planning and policy renewal concerns"
  },
  {
    id: "life-jia-nus",
    label: "Jia En NUS milestone",
    type: "LifeEvent",
    note: "High-salience family opener"
  },
  {
    id: "concern-will-planning",
    label: "Will planning open",
    type: "Concern",
    note: "Unresolved concern from prior meeting"
  },
  {
    id: "concern-policy-renewal",
    label: "Policy renewal hesitation",
    type: "Concern",
    note: "Emotional cue tied to renewal timing"
  },
  {
    id: "objective-family-transition",
    label: "Smooth family transition",
    type: "Objective",
    note: "Client wants a low-conflict family planning handover"
  },
  {
    id: "promise-guide",
    label: "Estate guide promised",
    type: "Promise",
    note: "Sarah promised follow-up material"
  },
  {
    id: "action-guide",
    label: "Send estate guide",
    type: "Action",
    note: "Post-meeting follow-up due 2026-06-21"
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
  },
  {
    id: "edge-ong",
    source: client.id,
    target: "person-ong",
    label: "friend"
  },
  {
    id: "edge-business-referral",
    source: "person-ong",
    target: "referral-business-succession",
    label: "may need"
  },
  {
    id: "edge-client-last-meeting",
    source: client.id,
    target: "meeting-2026-04-08-tan",
    label: "last meeting"
  },
  {
    id: "edge-meeting-life-event",
    source: "meeting-2026-04-08-tan",
    target: "life-jia-nus",
    label: "captured"
  },
  {
    id: "edge-client-life-event",
    source: client.id,
    target: "life-jia-nus",
    label: "has life event"
  },
  {
    id: "edge-client-will-concern",
    source: client.id,
    target: "concern-will-planning",
    label: "has concern"
  },
  {
    id: "edge-client-policy-concern",
    source: client.id,
    target: "concern-policy-renewal",
    label: "has concern"
  },
  {
    id: "edge-client-family-objective",
    source: client.id,
    target: "objective-family-transition",
    label: "has objective"
  },
  {
    id: "edge-meeting-guide-promise",
    source: "meeting-2026-04-08-tan",
    target: "promise-guide",
    label: "created promise"
  },
  {
    id: "edge-client-guide-action",
    source: client.id,
    target: "action-guide",
    label: "has action"
  }
];

export const suggestedQuestions = [
  "How has Jia En's NUS news changed your planning priorities?",
  "What has made the will update hard to complete?",
  "Would a warm introduction to Evelyn Ng help you take the next step?",
  "Is Mr. Ong someone you would be comfortable introducing for business succession help?",
  "What would make the policy renewal feel clearly worth it?"
];

export const dailyBrief: DailyBrief = {
  date: "2026-06-20",
  advisorName: advisor.name,
  morning: [
    {
      id: meetings[0].id,
      time: "10:30 AM",
      clientName: client.name,
      objective: meetings[0].objective,
      lastDiscussed:
        "Estate planning, will update hesitation, policy renewal uncertainty, and a request for a lawyer.",
      opener: "Congratulate him on Jia En getting into NUS before moving into estate planning.",
      href: `/briefing/${meetings[0].id}`
    }
  ],
  endOfDay: [
    {
      id: "eod-guide",
      title: "Send estate planning guide",
      detail: "Attach the will update checklist and family transition notes.",
      target: "todo",
      status: "ready"
    },
    {
      id: "eod-calendar",
      title: "Add will planning check-in",
      detail: "Hold a 20-minute reminder for 2026-07-04.",
      target: "calendar",
      status: "ready"
    },
    {
      id: "eod-intro",
      title: "Review Evelyn Ng introduction",
      detail: "Draft is ready, but Sarah must approve before any message is sent.",
      target: "intro",
      status: "needs_review"
    }
  ],
  networkHealth: {
    newContactsThisWeek: 6,
    threeMonthWeeklyAverage: 3,
    reactivatedContacts: 4,
    referralOpportunities: 3,
    healthScore: 82,
    topSignals: [
      "New contact pace is 2x the recent weekly average.",
      "Estate planning is the strongest referral cluster this week.",
      "Mr. Ong is a warm second-degree lead from Mr. Tan's network."
    ],
    touchpoints: [
      {
        id: "touch-evelyn",
        name: "Evelyn Ng",
        role: "Estate planner",
        source: "Specialist network",
        lastContactedAt: "2026-06-18",
        status: "warm",
        referralPotential: "high",
        note: "Best fit for Mr. Tan's will and family transition conversation."
      },
      {
        id: "touch-marcus",
        name: "Marcus Lee",
        role: "Lawyer",
        source: "Sarah's network",
        lastContactedAt: "2026-06-12",
        status: "warm",
        referralPotential: "high",
        note: "Legal support path if Mr. Tan wants a lawyer instead of a planner first."
      },
      {
        id: "touch-ong",
        name: "Mr. Ong",
        role: "Family business owner",
        source: "Mentioned by Mr. Tan",
        lastContactedAt: "not contacted",
        status: "new",
        referralPotential: "medium",
        note: "Potential business succession lead; ask Mr. Tan before outreach."
      }
    ]
  },
  memoryLayer: {
    current: "Neo4j graph as source of truth, with deterministic demo fallback.",
    alternatives: [
      {
        name: "GraphRAG / graphify",
        useWhen: "Use if the team wants richer graph extraction and semantic traversal on top of Neo4j.",
        decision: "later"
      },
      {
        name: "mem0",
        useWhen: "Use if a higher-level personal memory abstraction becomes faster than direct graph modeling.",
        decision: "later"
      },
      {
        name: "Direct Neo4j",
        useWhen: "Use now because referral, family, promises, and meetings are naturally graph-shaped.",
        decision: "now"
      }
    ]
  },
  roadmap: [
    {
      id: "roadmap-web",
      stage: "L1-L2",
      title: "Web voice, graph, live companion, and review loop",
      owner: "core",
      status: "built"
    },
    {
      id: "roadmap-overlay",
      stage: "L2",
      title: "Phone-friendly in-person meeting overlay",
      owner: "core",
      status: "built"
    },
    {
      id: "roadmap-messaging",
      stage: "L3-L5",
      title: "OpenClaw, Hermes, WhatsApp ingestion and sending",
      owner: "integration",
      status: "later"
    }
  ]
};

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

export function getDailyBrief() {
  const upcomingMeetings = getCalendar().map((meeting) => ({
    id: meeting.id,
    time: new Intl.DateTimeFormat("en-SG", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Singapore"
    }).format(new Date(meeting.startsAt)),
    clientName: meeting.client.name,
    objective: meeting.objective,
    lastDiscussed:
      memories
        .filter((memory) => memory.status === "open")
        .slice(0, 4)
        .map((memory) => memory.title)
        .join(", ") + ".",
    opener: "Congratulate him on Jia En getting into NUS before moving into estate planning.",
    href: `/briefing/${meeting.id}`
  }));

  return {
    ...dailyBrief,
    morning: upcomingMeetings,
    endOfDay: actions.slice(0, 3).map((action) => ({
      id: `eod-${action.id}`,
      title: action.title,
      detail: action.draftText ?? `Create ${action.actionType.replaceAll("_", " ")} for ${client.name}.`,
      target:
        action.actionType === "reminder"
          ? ("calendar" as const)
          : action.actionType === "introduction"
            ? ("intro" as const)
            : ("todo" as const),
      status: action.actionType === "introduction" ? ("needs_review" as const) : ("ready" as const)
    }))
  };
}

export function extractMeetingSignals(
  events: TranscriptEvent[],
  options: { clientId?: string; meetingId?: string } = {}
) {
  const text = events.map((event) => event.text).join(" ").toLowerCase();
  const now = new Date().toISOString();
  const targetClientId = options.clientId ?? client.id;
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
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Life Event",
      summary: "Jia En's NUS milestone came up again in the meeting.",
      sourceSnippet: latestMatchingSnippet(events, ["nus", "jia"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["nus", "jia"]),
      confidence: 0.88,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_LIFE_EVENT]->(:LifeEvent {title: 'Jia En NUS milestone reconfirmed'})"
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
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Unresolved Concern",
      summary: "Will planning remains an active unresolved concern.",
      sourceSnippet: latestMatchingSnippet(events, ["will", "estate"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["will", "estate"]),
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
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Referral Opportunity",
      summary: "Client is open to estate planning or legal specialist support.",
      sourceSnippet: latestMatchingSnippet(events, ["lawyer", "evelyn", "marcus"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["lawyer", "evelyn", "marcus"]),
      confidence: 0.92,
      proposedGraphMutation:
        "MERGE (r:ReferralOpportunity {id: 'referral-estate'}) SET r.status = 'ready_for_intro'"
    });
  }

  if (text.includes("ong") || text.includes("friend") || text.includes("business succession")) {
    suggestions.push({
      id: "suggest-network",
      title: "Ask for permission before tracking the warm lead",
      reason: "A new second-degree contact could become a referral opportunity, but Sarah should confirm consent.",
      source: "Networking health signal",
      priority: "medium"
    });
    extracted.push({
      id: "extract-ong",
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Relationship Mention",
      summary: "Mr. Tan mentioned Mr. Ong as a potential business succession contact.",
      sourceSnippet: latestMatchingSnippet(events, ["ong", "friend", "business succession"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["ong", "friend", "business succession"]),
      confidence: 0.8,
      proposedGraphMutation:
        "MERGE (p:Person {id: 'person-ong'}) SET p.name = 'Mr. Ong', p.role = 'family business owner'"
    });
    extracted.push({
      id: "extract-business-referral",
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Referral Opportunity",
      summary: "Create a referral watchlist item for Mr. Ong's business succession need.",
      sourceSnippet: latestMatchingSnippet(events, ["ong", "friend", "business succession"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["ong", "friend", "business succession"]),
      confidence: 0.76,
      proposedGraphMutation:
        "MERGE (r:ReferralOpportunity {id: 'referral-business-succession'}) SET r.status = 'permission_needed'"
    });
  }

  if (text.includes("policy") || text.includes("renewal")) {
    suggestions.push({
      id: "suggest-policy",
      title: "Separate protection value from estate planning anxiety",
      reason: "Policy renewal hesitation is open and may be tangled with the unresolved will update.",
      source: "Emotional cue from 2026-04-08",
      priority: "medium"
    });
    extracted.push({
      id: "extract-policy",
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Emotional Cue",
      summary: "Policy renewal hesitation remains active in the conversation.",
      sourceSnippet: latestMatchingSnippet(events, ["policy", "renewal"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["policy", "renewal"]),
      confidence: 0.83,
      proposedGraphMutation:
        "MERGE (c:Client {id: 'client-tan'})-[:HAS_CONCERN]->(:Concern {title: 'Policy renewal hesitation remains active'})"
    });
  }

  if (text.includes("guide") || text.includes("send")) {
    extracted.push({
      id: "extract-guide",
      clientId: targetClientId,
      meetingId: options.meetingId,
      category: "Follow-Up Action",
      summary: "Send the estate planning guide after the meeting.",
      sourceSnippet: latestMatchingSnippet(events, ["guide", "send"]),
      timestamp: now,
      sourceEventIds: matchingEventIds(events, ["guide", "send"]),
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

function matchingEventIds(events: TranscriptEvent[], terms: string[]) {
  return events
    .filter((event) => terms.some((term) => event.text.toLowerCase().includes(term)))
    .map((event) => event.id);
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

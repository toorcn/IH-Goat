export type MeetingStatus = "not_started" | "briefed" | "listening" | "review";

export type MemoryCategory =
  | "Life Event"
  | "Emotional Cue"
  | "Unresolved Concern"
  | "Goal/Objective"
  | "Promise/Commitment"
  | "Relationship Mention"
  | "Referral Opportunity"
  | "Follow-Up Action";

export type Advisor = {
  id: string;
  name: string;
  firm: string;
};

export type Client = {
  id: string;
  name: string;
  clientType: string;
  riskProfile: string;
  relationshipSince: string;
};

export type Meeting = {
  id: string;
  clientId: string;
  advisorId: string;
  startsAt: string;
  endedAt?: string;
  type: string;
  location: string;
  objective: string;
  status: MeetingStatus;
};

export type MemoryItem = {
  id: string;
  clientId: string;
  category: MemoryCategory;
  title: string;
  summary: string;
  source: string;
  sourceSnippet: string;
  confidence: number;
  status: "known" | "open" | "pending" | "approved" | "ignored";
  validFrom?: string;
  lastConfirmedAt?: string;
  salience: number;
};

export type ActionItem = {
  id: string;
  clientId: string;
  meetingId: string;
  title: string;
  actionType: string;
  dueAt: string;
  owner: string;
  status: "pending" | "approved" | "completed" | "ignored";
  draftText?: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type:
    | "Advisor"
    | "Client"
    | "Person"
    | "Specialist"
    | "ReferralOpportunity"
    | "Meeting"
    | "Memory"
    | "LifeEvent"
    | "Concern"
    | "Objective"
    | "Promise"
    | "Action";
  note: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type ClientContext = {
  advisor: Advisor;
  client: Client;
  upcomingMeeting: Meeting;
  lastMeeting: Meeting;
  memories: MemoryItem[];
  actions: ActionItem[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  suggestedQuestions: string[];
  briefing: string;
  memorySource?: "neo4j" | "demo";
  memoryWarning?: string;
};

export type TranscriptEvent = {
  id: string;
  speaker: "advisor" | "client" | "unknown";
  text: string;
  timestamp: string;
};

export type ExtractedMemory = {
  id: string;
  clientId: string;
  relatedClientId?: string;
  meetingId?: string;
  type?: MemoryCategory;
  title?: string;
  description?: string;
  category: MemoryCategory;
  summary: string;
  sourceSnippet: string;
  evidenceQuote?: string;
  timestamp: string;
  sourceEventIds?: string[];
  confidence: number;
  relatedPersonName?: string;
  proposedNodes?: Array<{
    label: GraphNode["type"];
    id: string;
    title: string;
    properties: Record<string, string | number | boolean>;
  }>;
  proposedEdges?: Array<{
    type: string;
    sourceId: string;
    targetId: string;
    properties?: Record<string, string | number | boolean>;
  }>;
  recommendedAction?: string;
  proposedGraphMutation: string;
};

export type SilentSuggestion = {
  id: string;
  title: string;
  reason: string;
  source: string;
  priority: "high" | "medium" | "low";
};

export type DailyBriefMeeting = {
  id: string;
  time: string;
  clientName: string;
  objective: string;
  lastDiscussed: string;
  opener: string;
  href: string;
};

export type EndOfDayItem = {
  id: string;
  title: string;
  detail: string;
  target: "calendar" | "todo" | "memory" | "intro";
  status: "ready" | "needs_review";
};

export type NetworkTouchpoint = {
  id: string;
  name: string;
  role: string;
  source: string;
  lastContactedAt: string;
  status: "new" | "warm" | "stale";
  referralPotential: "high" | "medium" | "low";
  note: string;
};

export type NetworkHealth = {
  newContactsThisWeek: number;
  threeMonthWeeklyAverage: number;
  reactivatedContacts: number;
  referralOpportunities: number;
  healthScore: number;
  topSignals: string[];
  touchpoints: NetworkTouchpoint[];
};

export type MemoryLayerDecision = {
  current: string;
  alternatives: Array<{
    name: string;
    useWhen: string;
    decision: "now" | "later" | "parked";
  }>;
};

export type RoadmapItem = {
  id: string;
  stage: string;
  title: string;
  owner: "core" | "integration";
  status: "built" | "next" | "later";
};

export type DailyBrief = {
  date: string;
  advisorName: string;
  morning: DailyBriefMeeting[];
  endOfDay: EndOfDayItem[];
  networkHealth: NetworkHealth;
  memoryLayer: MemoryLayerDecision;
  roadmap: RoadmapItem[];
};

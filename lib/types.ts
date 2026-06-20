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
  type: "Advisor" | "Client" | "Person" | "Specialist" | "ReferralOpportunity";
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
  category: MemoryCategory;
  summary: string;
  sourceSnippet: string;
  timestamp: string;
  confidence: number;
  proposedGraphMutation: string;
};

export type SilentSuggestion = {
  id: string;
  title: string;
  reason: string;
  source: string;
  priority: "high" | "medium" | "low";
};

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
  updatedAt?: string;
  createdAt?: string;
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

export type PartnerType = "lawyer" | "doctor" | "tax_advisor" | "estate_planner" | "other";

export type PartnerProfile = {
  id: string;
  name: string;
  partnerType: PartnerType;
  specialty: string;
  organization?: string;
  note: string;
  keywords: string[];
  introStatus: "trusted" | "available" | "unknown";
};

export type LivePartnerRecommendation = {
  id: string;
  name: string;
  partnerType: PartnerType;
  specialty: string;
  organization?: string;
  matchReason: string;
  advisorUse: string;
  source: string;
  confidence: number;
  status?: string;
  relationshipLabel?: string;
  evidence?: string;
};

export type LivePartnerRecommendationResponse = {
  clientId: string;
  need: string;
  reason?: string;
  source: "neo4j" | "demo";
  results: LivePartnerRecommendation[];
  warning?: string;
};

export type MemoryDisplayMode =
  | "brief"
  | "cards"
  | "table"
  | "graph"
  | "timeline"
  | "recommendation"
  | "missing_info";

export type EvidenceSnippet = {
  id: string;
  label: string;
  source: string;
  snippet: string;
  confidence?: number;
};

export type SuggestedAction = {
  id: string;
  title: string;
  reason: string;
  owner?: string;
  dueAt?: string;
  status?: ActionItem["status"] | "suggested";
  draftText?: string;
};

export type MemoryQueryVisualResponse = {
  clientId: string;
  query: string;
  source: "neo4j" | "demo";
  displayMode: MemoryDisplayMode;
  answer: string;
  citations: EvidenceSnippet[];
  cards?: Array<{ id: string; title: string; eyebrow: string; body: string; meta?: string }>;
  rows?: Array<{ label: string; value: string; detail?: string }>;
  graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
  actions?: SuggestedAction[];
  missingInfo?: { title: string; reason: string; suggestedNextStep: string };
  warning?: string;
};

export type LiveMemorySearchResult = {
  id: string;
  type: "memory" | "action" | "graph";
  title: string;
  summary: string;
  source: string;
  category?: MemoryCategory;
  status?: string;
  snippet?: string;
  confidence?: number;
  edgeLabel?: string;
};

export type LiveMemorySearchResponse = {
  clientId: string;
  query: string;
  reason?: string;
  source: "neo4j" | "demo";
  results: LiveMemorySearchResult[];
  warning?: string;
};

export type SaveMemoryResult = {
  writeMode: "neo4j" | "demo";
  saved: boolean;
  duplicate?: boolean;
  existingId?: string;
  reason?: string;
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
  dataMode?: "neo4j" | "hybrid" | "demo";
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

export type TranscriptTurn = {
  id: string;
  speaker: "advisor" | "client" | "unknown";
  text: string;
  at: string;
};

export type RelevantMemory = {
  memoryId: string;
  reason: string;
};

export type LiveAnalysisResponse = {
  source: "openai" | "demo";
  attributions: Array<{ id: string; speaker: "advisor" | "client" }>;
  suggestions: SilentSuggestion[];
  extracted: ExtractedMemory[];
  relevant: RelevantMemory[];
  warning?: string;
};

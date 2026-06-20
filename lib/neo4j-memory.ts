import neo4j, { Driver } from "neo4j-driver";
import { getClientContext, getMeeting } from "./demo-data";
import type {
  ActionItem,
  Advisor,
  Client,
  ClientContext,
  ExtractedMemory,
  GraphEdge,
  GraphNode,
  Meeting,
  MemoryItem
} from "./types";

type DataMode = "neo4j" | "hybrid" | "demo";

let driver: Driver | null = null;

export function getDataMode(): DataMode {
  const configured = process.env.DATA_MODE?.trim().toLowerCase();
  if (configured === "neo4j" || configured === "hybrid" || configured === "demo") return configured;
  return hasNeo4jConfig() ? "neo4j" : "demo";
}

function hasNeo4jConfig() {
  return Boolean(process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD);
}

function getDriver() {
  if (!hasNeo4jConfig()) return null;
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI as string,
      neo4j.auth.basic(process.env.NEO4J_USERNAME as string, process.env.NEO4J_PASSWORD as string),
      { connectionTimeout: 1500, maxTransactionRetryTime: 1000 }
    );
  }
  return driver;
}

export async function closeNeo4jDriver() {
  if (!driver) return;
  await driver.close();
  driver = null;
}

function getDatabaseConfig() {
  return process.env.NEO4J_DATABASE ? { database: process.env.NEO4J_DATABASE } : undefined;
}

function getQueryConfig(routing: "READ" | "WRITE") {
  return {
    ...getDatabaseConfig(),
    routing
  };
}

export async function getClientContextWithMemoryLayer(clientId: string): Promise<ClientContext> {
  const mode = getDataMode();
  if (mode === "demo") {
    return withMode(getClientContext(clientId), "demo", "demo");
  }

  if (mode === "neo4j") {
    return getNeo4jClientContext(clientId);
  }

  const context = getClientContext(clientId);
  const graphDriver = getDriver();
  if (!graphDriver) {
    return withMode(context, "hybrid", "demo", "Neo4j is not configured; showing demo memory.");
  }

  try {
    const neo4jContext = await readNeo4jClientContext(clientId, graphDriver);

    const byId = new Map(context.memories.map((memory) => [memory.id, memory]));
    for (const memory of neo4jContext.memories) {
      byId.set(memory.id, memory);
    }

    const actionsById = new Map(context.actions.map((action) => [action.id, action]));
    for (const action of neo4jContext.actions) {
      actionsById.set(action.id, action);
    }

    return {
      ...context,
      advisor: neo4jContext.advisor,
      client: neo4jContext.client,
      upcomingMeeting: neo4jContext.upcomingMeeting,
      lastMeeting: neo4jContext.lastMeeting,
      memorySource: "neo4j",
      dataMode: "hybrid",
      memoryWarning: undefined,
      memories: Array.from(byId.values()),
      actions: Array.from(actionsById.values()),
      graph: neo4jContext.graph.nodes.length > 0 ? neo4jContext.graph : context.graph,
      suggestedQuestions: neo4jContext.suggestedQuestions,
      briefing: neo4jContext.briefing
    };
  } catch {
    return {
      ...context,
      memorySource: "demo",
      dataMode: "hybrid",
      memoryWarning: formatNeo4jFallbackWarning()
    };
  }
}

export async function getClientContextForMeeting(meetingId: string): Promise<ClientContext> {
  const mode = getDataMode();
  if (mode === "demo" || mode === "hybrid") {
    const meeting = getMeeting(meetingId);
    if (meeting) return getClientContextWithMemoryLayer(meeting.clientId);
    if (mode === "demo") throw new Error(`Unknown demo meeting: ${meetingId}`);
  }

  const graphDriver = getDriver();
  if (!graphDriver) throw new Error("Neo4j is required to resolve this meeting.");

  const result = await graphDriver.executeQuery(
    `
    MATCH (c:Client)-[:HAS_MEETING]->(:Meeting {id: $meetingId})
    RETURN c.id AS clientId
    LIMIT 1
    `,
    { meetingId },
    getQueryConfig(neo4j.routing.READ)
  );
  const clientId = result.records[0]?.get("clientId");
  if (typeof clientId !== "string") throw new Error(`Unknown Neo4j meeting: ${meetingId}`);
  return getClientContextWithMemoryLayer(clientId);
}

export async function getCalendar() {
  const mode = getDataMode();
  if (mode === "demo") {
    const { getCalendar: getDemoCalendar } = await import("./demo-data");
    return { source: "demo" as const, meetings: getDemoCalendar(), warning: undefined };
  }

  const graphDriver = getDriver();
  if (!graphDriver) {
    if (mode === "neo4j") throw new Error("Neo4j is not configured.");
    const { getCalendar: getDemoCalendar } = await import("./demo-data");
    return {
      source: "demo" as const,
      meetings: getDemoCalendar(),
      warning: "Neo4j is not configured; showing demo calendar."
    };
  }

  try {
    const result = await graphDriver.executeQuery(
      `
      MATCH (advisor:Advisor)-[:MANAGES]->(client:Client)-[:HAS_MEETING]->(meeting:Meeting)
      WHERE coalesce(meeting.status, '') <> 'review'
      RETURN advisor, client, meeting
      ORDER BY meeting.startsAt ASC
      LIMIT 25
      `,
      {},
      getQueryConfig(neo4j.routing.READ)
    );

    return {
      source: "neo4j" as const,
      warning: undefined,
      meetings: result.records.map((record) => {
        const advisor = advisorNodeToItem(record.get("advisor").properties);
        const client = clientNodeToItem(record.get("client").properties);
        return {
          ...meetingNodeToItem(record.get("meeting").properties, client.id, advisor.id),
          advisor,
          client
        };
      })
    };
  } catch (error) {
    if (mode === "neo4j") throw error;
    const { getCalendar: getDemoCalendar } = await import("./demo-data");
    return {
      source: "demo" as const,
      meetings: getDemoCalendar(),
      warning: formatNeo4jFallbackWarning()
    };
  }
}

async function getNeo4jClientContext(clientId: string) {
  const graphDriver = getDriver();
  if (!graphDriver) throw new Error("Neo4j is not configured.");
  return readNeo4jClientContext(clientId, graphDriver);
}

async function readNeo4jClientContext(clientId: string, graphDriver: Driver): Promise<ClientContext> {
  const [coreResult, memoryResult, actionResult, nodeResult, edgeResult] = await Promise.all([
    graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      OPTIONAL MATCH (a:Advisor)-[:MANAGES]->(c)
      OPTIONAL MATCH (c)-[:HAS_MEETING]->(upcoming:Meeting)
      WHERE coalesce(upcoming.status, '') <> 'review'
      WITH c, a, upcoming
      ORDER BY upcoming.startsAt ASC
      WITH c, a, collect(upcoming)[0] AS upcomingMeeting
      OPTIONAL MATCH (c)-[:HAS_MEETING]->(last:Meeting)
      WHERE last.id <> upcomingMeeting.id
      WITH c, a, upcomingMeeting, last
      ORDER BY last.startsAt DESC
      RETURN c, a, upcomingMeeting, collect(last)[0] AS lastMeeting
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    ),
    graphDriver.executeQuery(
      `
      MATCH (:Client {id: $clientId})-[:HAS_MEMORY]->(m:Memory)
      RETURN m
      ORDER BY coalesce(m.salience, 0) DESC, toString(coalesce(m.updatedAt, m.createdAt, m.validFrom, '')) DESC
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    ),
    graphDriver.executeQuery(
      `
      MATCH (:Client {id: $clientId})-[:HAS_ACTION]->(a:Action)
      RETURN a
      ORDER BY toString(coalesce(a.dueAt, a.updatedAt, a.createdAt, '')) ASC
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    ),
    graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      RETURN c AS node
      UNION
      MATCH (a:Advisor)-[:MANAGES]->(:Client {id: $clientId})
      RETURN a AS node
      UNION
      MATCH (:Client {id: $clientId})-[:RELATED_TO|HAS_REFERRAL_OPPORTUNITY]->(node)
      RETURN node
      UNION
      MATCH (:Client {id: $clientId})-[:HAS_REFERRAL_OPPORTUNITY]->(:ReferralOpportunity)-[:MATCHES_SPECIALIST|INVOLVES]->(node)
      RETURN node
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    ),
    graphDriver.executeQuery(
      `
      MATCH (source:Advisor)-[r:MANAGES]->(target:Client {id: $clientId})
      RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
      UNION
      MATCH (source:Client {id: $clientId})-[r:RELATED_TO|HAS_REFERRAL_OPPORTUNITY]->(target)
      RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
      UNION
      MATCH (:Client {id: $clientId})-[:HAS_REFERRAL_OPPORTUNITY]->(source:ReferralOpportunity)-[r:MATCHES_SPECIALIST|INVOLVES]->(target)
      RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    )
  ]);

  const core = coreResult.records[0];
  if (!core) throw new Error(`Client ${clientId} was not found in Neo4j.`);

  const clientNode = core.get("c");
  const advisorNode = core.get("a");
  const upcomingMeetingNode = core.get("upcomingMeeting");
  const lastMeetingNode = core.get("lastMeeting");
  if (!clientNode || !advisorNode || !upcomingMeetingNode) {
    throw new Error(`Client ${clientId} is missing advisor or upcoming meeting data in Neo4j.`);
  }

  const advisor = advisorNodeToItem(advisorNode.properties);
  const client = clientNodeToItem(clientNode.properties);
  const upcomingMeeting = meetingNodeToItem(upcomingMeetingNode.properties, client.id, advisor.id);
  const lastMeeting = lastMeetingNode
    ? meetingNodeToItem(lastMeetingNode.properties, client.id, advisor.id)
    : upcomingMeeting;
  const memories = memoryResult.records.map((record) =>
    memoryNodeToItem(record.get("m").properties, clientId)
  );
  const actions = actionResult.records.map((record) =>
    actionNodeToItem(record.get("a").properties, clientId, upcomingMeeting.id, advisor.name)
  );
  const graph = {
    nodes: nodeResult.records.map((record) =>
      graphNodeToItem(record.get("node").labels, record.get("node").properties)
    ),
    edges: edgeResult.records.map((record) =>
      graphEdgeToItem(
        record.get("id"),
        record.get("source"),
        record.get("target"),
        record.get("type"),
        record.get("label")
      )
    )
  };
  const suggestedQuestions = buildSuggestedQuestions(memories);

  return {
    advisor,
    client,
    upcomingMeeting,
    lastMeeting,
    memories,
    actions,
    graph,
    suggestedQuestions,
    briefing: buildBriefing({ advisor, client, upcomingMeeting, lastMeeting, memories, suggestedQuestions }),
    memorySource: "neo4j",
    dataMode: "neo4j"
  };
}

function formatNeo4jFallbackWarning() {
  return "Neo4j memory is unavailable; showing demo memory.";
}

function withMode(
  context: ClientContext,
  dataMode: DataMode,
  memorySource: "neo4j" | "demo",
  memoryWarning?: string
): ClientContext {
  return {
    ...context,
    dataMode,
    memorySource,
    memoryWarning
  };
}

export async function queryClientMemory(clientId: string, query: string) {
  const graphDriver = getDriver();
  const normalized = query.trim().toLowerCase();
  const context = getClientContext(clientId);

  if (!graphDriver) {
    return {
      source: "demo",
      results: context.memories.filter((memory) =>
        `${memory.title} ${memory.summary} ${memory.sourceSnippet}`.toLowerCase().includes(normalized)
      )
    };
  }

  try {
    const result = await graphDriver.executeQuery(
      `
      MATCH (:Client {id: $clientId})-[:HAS_MEMORY|HAS_ACTION]->(item)
      WHERE $query = ''
        OR toLower(coalesce(item.title, '') + ' ' + coalesce(item.summary, '') + ' ' + coalesce(item.sourceSnippet, '') + ' ' + coalesce(item.draftText, '')) CONTAINS $query
      RETURN labels(item) AS labels, item
      ORDER BY coalesce(item.salience, 0) DESC, toString(coalesce(item.updatedAt, item.createdAt, item.validFrom, item.dueAt, '')) DESC
      LIMIT 12
      `,
      { clientId, query: normalized },
      getQueryConfig(neo4j.routing.READ)
    );

    return {
      source: "neo4j",
      results: result.records.map((record) => ({
        labels: record.get("labels"),
        properties: record.get("item").properties
      }))
    };
  } catch (error) {
    return {
      source: "demo",
      warning: error instanceof Error ? error.message : "Neo4j unavailable, using demo memory.",
      results: context.memories.filter((memory) =>
        `${memory.title} ${memory.summary} ${memory.sourceSnippet}`.toLowerCase().includes(normalized)
      )
    };
  }
}

export async function saveApprovedMemory(memory: ExtractedMemory) {
  const graphDriver = getDriver();
  if (!graphDriver) {
    return {
      writeMode: "demo",
      saved: false,
      reason: "NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD is not configured."
    };
  }

  try {
    await graphDriver.executeQuery(
      `
      MERGE (c:Client {id: $clientId})
      MERGE (m:Memory {id: $id})
      SET m.category = $category,
          m.title = $category,
          m.summary = $summary,
          m.source = 'live meeting companion',
          m.sourceSnippet = $sourceSnippet,
          m.confidence = $confidence,
          m.status = 'approved',
          m.salience = 0.95,
          m.proposedGraphMutation = $proposedGraphMutation,
          m.updatedAt = datetime(),
          m.createdAt = coalesce(m.createdAt, datetime())
      MERGE (c)-[:HAS_MEMORY]->(m)
      `,
      {
        clientId: memory.clientId,
        id: memory.id,
        category: memory.category,
        summary: memory.summary,
        sourceSnippet: memory.sourceSnippet,
        confidence: memory.confidence,
        proposedGraphMutation: memory.proposedGraphMutation
      },
      getQueryConfig(neo4j.routing.WRITE)
    );

    await saveTypedApprovedMemory(graphDriver, memory);

    return {
      writeMode: "neo4j",
      saved: true
    };
  } catch (error) {
    return {
      writeMode: "demo",
      saved: false,
      reason: error instanceof Error ? error.message : "Neo4j unavailable."
    };
  }
}

export async function saveApprovedAction(action: ActionItem) {
  const graphDriver = getDriver();
  if (!graphDriver) {
    return {
      writeMode: "demo",
      saved: false,
      reason: "NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD is not configured."
    };
  }

  try {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      OPTIONAL MATCH (meeting:Meeting {id: $meetingId})
      MERGE (a:Action {id: $id})
      SET a.title = $title,
          a.actionType = $actionType,
          a.dueAt = $dueAt,
          a.owner = $owner,
          a.status = 'approved',
          a.meetingId = $meetingId,
          a.draftText = $draftText,
          a.updatedAt = datetime(),
          a.createdAt = coalesce(a.createdAt, datetime())
      MERGE (c)-[:HAS_ACTION]->(a)
      FOREACH (_ IN CASE WHEN meeting IS NULL THEN [] ELSE [1] END |
        MERGE (a)-[:FOLLOWS_FROM]->(meeting)
      )
      `,
      {
        clientId: action.clientId,
        meetingId: action.meetingId,
        id: action.id,
        title: action.title,
        actionType: action.actionType,
        dueAt: action.dueAt,
        owner: action.owner,
        draftText: action.draftText
      },
      getQueryConfig(neo4j.routing.WRITE)
    );

    return {
      writeMode: "neo4j",
      saved: true
    };
  } catch (error) {
    return {
      writeMode: "demo",
      saved: false,
      reason: error instanceof Error ? error.message : "Neo4j unavailable."
    };
  }
}

async function saveTypedApprovedMemory(graphDriver: Driver, memory: ExtractedMemory) {
  const typed = approvedMemoryType(memory.category);
  if (!typed) return;

  await graphDriver.executeQuery(
    `
    MATCH (c:Client {id: $clientId})
    MATCH (m:Memory {id: $memoryId})
    MERGE (typed:${typed.label} {id: $typedId})
    SET typed.title = $title,
        typed.summary = $summary,
        typed.description = $summary,
        typed.source = 'live meeting companion',
        typed.sourceSnippet = $sourceSnippet,
        typed.confidence = $confidence,
        typed.status = 'approved',
        typed.updatedAt = datetime(),
        typed.createdAt = coalesce(typed.createdAt, datetime())
    MERGE (c)-[typedRel:${typed.relationship}]->(typed)
    SET typedRel.label = $relationshipLabel
    MERGE (m)-[:MATERIALIZED_AS]->(typed)
    `,
    {
      clientId: memory.clientId,
      memoryId: memory.id,
      typedId: `${memory.id}-typed`,
      title: memory.category,
      summary: memory.summary,
      sourceSnippet: memory.sourceSnippet,
      confidence: memory.confidence,
      relationshipLabel: typed.relationship.toLowerCase().replaceAll("_", " ")
    },
    getQueryConfig(neo4j.routing.WRITE)
  );
}

function approvedMemoryType(category: ExtractedMemory["category"]) {
  if (category === "Life Event") return { label: "LifeEvent", relationship: "HAS_LIFE_EVENT" };
  if (category === "Unresolved Concern" || category === "Emotional Cue") {
    return { label: "Concern", relationship: "HAS_CONCERN" };
  }
  if (category === "Goal/Objective") return { label: "Objective", relationship: "HAS_OBJECTIVE" };
  if (category === "Promise/Commitment") return { label: "Promise", relationship: "HAS_PROMISE" };
  return null;
}

function memoryNodeToItem(properties: Record<string, unknown>, clientId: string): MemoryItem {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;
  const numberProp = (key: string, fallback: number) =>
    typeof properties[key] === "number" ? properties[key] : fallback;
  const temporalProp = (key: string) => {
    const value = properties[key];
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof (value as { toString?: unknown }).toString === "function") {
      return String(value);
    }
    return undefined;
  };

  return {
    id: stringProp("id", `neo4j-${crypto.randomUUID()}`),
    clientId,
    category: stringProp("category", "Life Event") as MemoryItem["category"],
    title: stringProp("title", stringProp("category", "Memory")),
    summary: stringProp("summary"),
    source: stringProp("source", "Neo4j"),
    sourceSnippet: stringProp("sourceSnippet"),
    confidence: numberProp("confidence", 0.8),
    status: stringProp("status", "known") as MemoryItem["status"],
    validFrom: stringProp("validFrom", undefined as unknown as string),
    lastConfirmedAt: stringProp("lastConfirmedAt", undefined as unknown as string),
    updatedAt: temporalProp("updatedAt"),
    createdAt: temporalProp("createdAt"),
    salience: numberProp("salience", 0.7)
  };
}

function advisorNodeToItem(properties: Record<string, unknown>): Advisor {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;

  return {
    id: stringProp("id", `neo4j-advisor-${crypto.randomUUID()}`),
    name: stringProp("name", stringProp("label", "Advisor")),
    firm: stringProp("firm", stringProp("note", ""))
  };
}

function clientNodeToItem(properties: Record<string, unknown>): Client {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;

  return {
    id: stringProp("id", `neo4j-client-${crypto.randomUUID()}`),
    name: stringProp("name", stringProp("label", "Client")),
    clientType: stringProp("clientType", "Client"),
    riskProfile: stringProp("riskProfile", "Unknown"),
    relationshipSince: stringProp("relationshipSince", "Unknown")
  };
}

function meetingNodeToItem(
  properties: Record<string, unknown>,
  clientId = stringFrom(properties.clientId, ""),
  advisorId = stringFrom(properties.advisorId, "")
): Meeting {
  const stringProp = (key: string, fallback = "") => stringFrom(properties[key], fallback);

  return {
    id: stringProp("id", `neo4j-meeting-${crypto.randomUUID()}`),
    clientId,
    advisorId,
    startsAt: stringProp("startsAt"),
    endedAt: stringProp("endedAt", undefined as unknown as string),
    type: stringProp("type", "Meeting"),
    location: stringProp("location", "Unknown"),
    objective: stringProp("objective", "Client meeting"),
    status: stringProp("status", "not_started") as Meeting["status"]
  };
}

function actionNodeToItem(
  properties: Record<string, unknown>,
  clientId: string,
  meetingId = "meeting-2026-06-20-tan",
  owner = "Sarah Lim"
): ActionItem {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;

  return {
    id: stringProp("id", `neo4j-action-${crypto.randomUUID()}`),
    clientId,
    meetingId: stringProp("meetingId", meetingId),
    title: stringProp("title", "Follow-up action"),
    actionType: stringProp("actionType", "follow_up"),
    dueAt: stringProp("dueAt"),
    owner: stringProp("owner", owner),
    status: stringProp("status", "pending") as ActionItem["status"],
    draftText: stringProp("draftText", undefined as unknown as string)
  };
}

function graphNodeToItem(labels: string[], properties: Record<string, unknown>): GraphNode {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;
  const type = graphNodeTypeFromLabels(labels);

  return {
    id: stringProp("id", `neo4j-node-${crypto.randomUUID()}`),
    label: stringProp("label", stringProp("name", stringProp("title", "Graph node"))),
    type,
    note: stringProp("note", stringProp("notes", stringProp("reason")))
  };
}

function graphEdgeToItem(
  id: unknown,
  source: unknown,
  target: unknown,
  type: unknown,
  label: unknown
): GraphEdge {
  const sourceId = typeof source === "string" ? source : "unknown-source";
  const targetId = typeof target === "string" ? target : "unknown-target";
  const relationshipType = typeof type === "string" ? type : "RELATED";

  return {
    id: typeof id === "string" ? id : `${sourceId}-${relationshipType}-${targetId}`,
    source: sourceId,
    target: targetId,
    label: typeof label === "string" ? label : relationshipType.toLowerCase().replaceAll("_", " ")
  };
}

function graphNodeTypeFromLabels(labels: string[]): GraphNode["type"] {
  if (labels.includes("Advisor")) return "Advisor";
  if (labels.includes("Client")) return "Client";
  if (labels.includes("Specialist")) return "Specialist";
  if (labels.includes("ReferralOpportunity")) return "ReferralOpportunity";
  return "Person";
}

function buildSuggestedQuestions(memories: MemoryItem[]) {
  const questions = memories
    .filter((memory) => memory.status === "open" || memory.salience >= 0.85)
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 4)
    .map((memory) => {
      if (memory.category === "Referral Opportunity") {
        return `Would an introduction related to ${memory.title.toLowerCase()} help with the next step?`;
      }
      if (memory.category === "Life Event") {
        return `How has ${memory.title.toLowerCase()} changed your planning priorities?`;
      }
      if (memory.category === "Unresolved Concern") {
        return `What has made ${memory.title.toLowerCase()} hard to complete?`;
      }
      return `What is the next concrete step for ${memory.title.toLowerCase()}?`;
    });

  return questions.length > 0 ? questions : ["What would make the next step feel clear and useful?"];
}

function buildBriefing({
  advisor,
  client,
  upcomingMeeting,
  lastMeeting,
  memories,
  suggestedQuestions
}: {
  advisor: Advisor;
  client: Client;
  upcomingMeeting: Meeting;
  lastMeeting: Meeting;
  memories: MemoryItem[];
  suggestedQuestions: string[];
}) {
  const salient = memories
    .slice()
    .sort((a, b) => b.salience - a.salience)
    .slice(0, 4);
  const open = memories.filter((memory) => memory.status === "open").slice(0, 3);
  const meetingTime = formatMeetingTime(upcomingMeeting.startsAt);
  const lastMeetingDate = lastMeeting?.startsAt ? formatMeetingDate(lastMeeting.startsAt) : "an earlier meeting";
  const importantContext = salient.map((memory) => memory.summary).join(" ");
  const openContext = open.map((memory) => memory.title.toLowerCase()).join(", ");
  const firstQuestion = suggestedQuestions[0];

  return [
    `You are meeting ${client.name}${meetingTime ? ` at ${meetingTime}` : ""}.`,
    `The advisor is ${advisor.name}.`,
    `The last recorded meeting was ${lastMeetingDate}.`,
    importantContext ? `High-salience context: ${importantContext}` : "",
    openContext ? `Open items to handle: ${openContext}.` : "",
    firstQuestion ? `Useful opening question: ${firstQuestion}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function formatMeetingTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Singapore"
  }).format(new Date(timestamp));
}

function formatMeetingDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeZone: "Asia/Singapore"
  }).format(new Date(timestamp));
}

function stringFrom(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { toString?: unknown }).toString === "function") {
    return String(value);
  }
  return fallback;
}

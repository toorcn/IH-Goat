import neo4j, { Driver } from "neo4j-driver";
import { getClientContext } from "./demo-data";
import type { ActionItem, ClientContext, ExtractedMemory, GraphEdge, GraphNode, MemoryItem } from "./types";

let driver: Driver | null = null;

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
  const context = getClientContext(clientId);
  const graphDriver = getDriver();
  if (!graphDriver) return context;

  try {
    const [memoryResult, actionResult, nodeResult, edgeResult] = await Promise.all([
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
        MATCH (:Client {id: $clientId})-[:HAS_MEETING|HAS_MEMORY|HAS_LIFE_EVENT|HAS_CONCERN|HAS_OBJECTIVE|HAS_PROMISE|HAS_ACTION|RELATED_TO|HAS_REFERRAL_OPPORTUNITY]->(node)
        RETURN node
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_MEMORY]->(:Memory)-[:MATERIALIZES_AS]->(node)
        RETURN node
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_MEETING]->(:Meeting)-[:PRODUCED|CREATED]->(node)
        RETURN node
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_ACTION]->(:Action)-[:FOLLOWS_FROM]->(node)
        RETURN node
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_REFERRAL_OPPORTUNITY]->(:ReferralOpportunity)-[:MATCHES_SPECIALIST|INVOLVES]->(node)
        RETURN node
        UNION
        MATCH (:Client {id: $clientId})-[:RELATED_TO]->(:Person)-[:MENTIONED_OPPORTUNITY]->(node)
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
        MATCH (source:Client {id: $clientId})-[r:HAS_MEETING|HAS_MEMORY|HAS_LIFE_EVENT|HAS_CONCERN|HAS_OBJECTIVE|HAS_PROMISE|HAS_ACTION|RELATED_TO|HAS_REFERRAL_OPPORTUNITY]->(target)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_MEMORY]->(source:Memory)-[r:MATERIALIZES_AS]->(target)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_MEETING]->(source:Meeting)-[r:PRODUCED|CREATED]->(target)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_ACTION]->(source:Action)-[r:FOLLOWS_FROM]->(target:Meeting)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        UNION
        MATCH (:Client {id: $clientId})-[:HAS_REFERRAL_OPPORTUNITY]->(source:ReferralOpportunity)-[r:MATCHES_SPECIALIST|INVOLVES]->(target)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        UNION
        MATCH (:Client {id: $clientId})-[:RELATED_TO]->(source:Person)-[r:MENTIONED_OPPORTUNITY]->(target:ReferralOpportunity)
        RETURN source.id AS source, target.id AS target, type(r) AS type, r.label AS label, r.id AS id
        `,
        { clientId },
        getQueryConfig(neo4j.routing.READ)
      )
    ]);

    const neo4jMemories = memoryResult.records.map((record) =>
      memoryNodeToItem(record.get("m").properties, clientId)
    );
    const neo4jActions = actionResult.records.map((record) =>
      actionNodeToItem(record.get("a").properties, clientId)
    );
    const neo4jGraph = {
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

    const byId = new Map(context.memories.map((memory) => [memory.id, memory]));
    for (const memory of neo4jMemories) {
      byId.set(memory.id, memory);
    }

    const actionsById = new Map(context.actions.map((action) => [action.id, action]));
    for (const action of neo4jActions) {
      actionsById.set(action.id, action);
    }

    return {
      ...context,
      memorySource: "neo4j",
      memoryWarning: undefined,
      memories: Array.from(byId.values()),
      actions: Array.from(actionsById.values()),
      graph: neo4jGraph.nodes.length > 0 ? neo4jGraph : context.graph
    };
  } catch (error) {
    return {
      ...context,
      memorySource: "demo",
      memoryWarning: error instanceof Error ? error.message : "Neo4j unavailable."
    };
  }
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

export async function getMemoryLayerDiagnostics(clientId: string) {
  const graphDriver = getDriver();
  if (!graphDriver) {
    return {
      configured: false,
      source: "demo",
      clientId,
      message: "Neo4j environment variables are not configured."
    };
  }

  try {
    const result = await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      CALL {
        WITH c
        MATCH (c)-[r]->()
        RETURN count(r) AS outgoingEdges
      }
      CALL {
        WITH c
        MATCH (c)-[:HAS_MEMORY]->(m:Memory)
        RETURN count(m) AS memories,
               count { (m)-[:MATERIALIZES_AS]->() } AS materializedMemories,
               count { (m)<-[:PRODUCED]-(:Meeting) } AS meetingLinkedMemories
      }
      CALL {
        WITH c
        MATCH (c)-[:HAS_LIFE_EVENT|HAS_CONCERN|HAS_OBJECTIVE|HAS_PROMISE|HAS_ACTION|HAS_REFERRAL_OPPORTUNITY|RELATED_TO]->(typed)
        RETURN count(typed) AS typedNeighbors
      }
      RETURN c.id AS clientId,
             outgoingEdges,
             memories,
             materializedMemories,
             meetingLinkedMemories,
             typedNeighbors
      `,
      { clientId },
      getQueryConfig(neo4j.routing.READ)
    );

    const record = result.records[0];
    if (!record) {
      return {
        configured: true,
        source: "neo4j",
        clientId,
        exists: false
      };
    }

    return {
      configured: true,
      source: "neo4j",
      clientId: record.get("clientId"),
      exists: true,
      outgoingEdges: neo4jNumber(record.get("outgoingEdges")),
      memories: neo4jNumber(record.get("memories")),
      materializedMemories: neo4jNumber(record.get("materializedMemories")),
      meetingLinkedMemories: neo4jNumber(record.get("meetingLinkedMemories")),
      typedNeighbors: neo4jNumber(record.get("typedNeighbors"))
    };
  } catch (error) {
    return {
      configured: true,
      source: "demo",
      clientId,
      error: error instanceof Error ? error.message : "Neo4j diagnostics failed."
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
    await linkMeetingToApprovedMemory(graphDriver, memory);

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
      MERGE (c:Client {id: $clientId})
      MERGE (a:Action {id: $id})
      SET a.title = $title,
          a.actionType = $actionType,
          a.dueAt = $dueAt,
          a.owner = $owner,
          a.status = $status,
          a.draftText = $draftText,
          a.meetingId = $meetingId,
          a.updatedAt = datetime(),
          a.createdAt = coalesce(a.createdAt, datetime())
      MERGE (c)-[:HAS_ACTION]->(a)
      `,
      {
        clientId: action.clientId,
        id: action.id,
        title: action.title,
        actionType: action.actionType,
        dueAt: action.dueAt,
        owner: action.owner,
        status: action.status,
        draftText: action.draftText ?? "",
        meetingId: action.meetingId
      },
      getQueryConfig(neo4j.routing.WRITE)
    );

    if (action.meetingId) {
      await graphDriver.executeQuery(
        `
        MATCH (a:Action {id: $actionId})
        MERGE (m:Meeting {id: $meetingId})
        MERGE (a)-[:FOLLOWS_FROM]->(m)
        `,
        {
          actionId: action.id,
          meetingId: action.meetingId
        },
        getQueryConfig(neo4j.routing.WRITE)
      );
    }

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
  const common = {
    clientId: memory.clientId,
    memoryId: memory.id,
    typedId: typedNodeId(memory),
    title: titleFromMemory(memory),
    summary: memory.summary,
    sourceSnippet: memory.sourceSnippet,
    confidence: memory.confidence,
    timestamp: memory.timestamp
  };

  if (memory.category === "Life Event") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:LifeEvent {id: $typedId})
      SET typed.title = $title,
          typed.summary = $summary,
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.lastConfirmedAt = $timestamp,
          typed.updatedAt = datetime()
      MERGE (c)-[:HAS_LIFE_EVENT]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Unresolved Concern" || memory.category === "Emotional Cue") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:Concern {id: $typedId})
      SET typed.title = $title,
          typed.summary = $summary,
          typed.status = 'open',
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[:HAS_CONCERN]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Goal/Objective") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:Objective {id: $typedId})
      SET typed.title = $title,
          typed.summary = $summary,
          typed.status = 'active',
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[:HAS_OBJECTIVE]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Promise/Commitment") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:Promise {id: $typedId})
      SET typed.title = $title,
          typed.summary = $summary,
          typed.status = 'open',
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[:HAS_PROMISE]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Relationship Mention") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:Person {id: $typedId})
      SET typed.name = $title,
          typed.label = $title,
          typed.note = $summary,
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[rel:RELATED_TO {relationship: 'mentioned'}]->(typed)
      SET rel.label = 'mentioned',
          rel.id = $memoryId + '-relationship'
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Referral Opportunity") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:ReferralOpportunity {id: $typedId})
      SET typed.title = $title,
          typed.label = $title,
          typed.need = $summary,
          typed.reason = $sourceSnippet,
          typed.status = 'pending_advisor_approval',
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[rel:HAS_REFERRAL_OPPORTUNITY]->(typed)
      SET rel.label = 'has opportunity',
          rel.id = $memoryId + '-referral'
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
    return;
  }

  if (memory.category === "Follow-Up Action") {
    await graphDriver.executeQuery(
      `
      MATCH (c:Client {id: $clientId})
      MATCH (mem:Memory {id: $memoryId})
      MERGE (typed:Action {id: $typedId})
      SET typed.title = $title,
          typed.actionType = 'follow_up',
          typed.status = 'pending',
          typed.draftText = $summary,
          typed.sourceSnippet = $sourceSnippet,
          typed.confidence = $confidence,
          typed.updatedAt = datetime()
      MERGE (c)-[:HAS_ACTION]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `,
      common,
      getQueryConfig(neo4j.routing.WRITE)
    );
  }
}

async function linkMeetingToApprovedMemory(graphDriver: Driver, memory: ExtractedMemory) {
  if (!memory.meetingId) return;

  await graphDriver.executeQuery(
    `
    MATCH (mem:Memory {id: $memoryId})
    MERGE (meeting:Meeting {id: $meetingId})
    MERGE (meeting)-[:PRODUCED]->(mem)
    `,
    {
      memoryId: memory.id,
      meetingId: memory.meetingId
    },
    getQueryConfig(neo4j.routing.WRITE)
  );
}

function typedNodeId(memory: ExtractedMemory) {
  if (memory.id === "extract-referral") return "referral-estate";
  if (memory.id === "extract-business-referral") return "referral-business-succession";
  if (memory.id === "extract-ong") return "person-ong";
  return `${memory.id}-typed`;
}

function titleFromMemory(memory: ExtractedMemory) {
  if (memory.id === "extract-ong") return "Mr. Ong";
  if (memory.id === "extract-referral") return "Estate Planning Intro";
  if (memory.id === "extract-business-referral") return "Business Succession Lead";

  const [firstSentence] = memory.summary.split(".");
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}...` : firstSentence;
}

function memoryNodeToItem(properties: Record<string, unknown>, clientId: string): MemoryItem {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;
  const numberProp = (key: string, fallback: number) =>
    typeof properties[key] === "number" ? properties[key] : fallback;

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
    salience: numberProp("salience", 0.7)
  };
}

function actionNodeToItem(properties: Record<string, unknown>, clientId: string): ActionItem {
  const stringProp = (key: string, fallback = "") =>
    typeof properties[key] === "string" ? properties[key] : fallback;

  return {
    id: stringProp("id", `neo4j-action-${crypto.randomUUID()}`),
    clientId,
    meetingId: stringProp("meetingId", "meeting-2026-06-20-tan"),
    title: stringProp("title", "Follow-up action"),
    actionType: stringProp("actionType", "follow_up"),
    dueAt: stringProp("dueAt"),
    owner: stringProp("owner", "Sarah Lim"),
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
    label: stringProp(
      "label",
      stringProp("name", stringProp("title", type === "Meeting" ? stringProp("startsAt", "Meeting") : "Graph node"))
    ),
    type,
    note: stringProp(
      "note",
      stringProp(
        "notes",
        stringProp(
          "reason",
          stringProp(
            "summary",
            stringProp("sourceSnippet", stringProp("objective", stringProp("need", stringProp("draftText"))))
          )
        )
      )
    )
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
  if (labels.includes("Meeting")) return "Meeting";
  if (labels.includes("Memory")) return "Memory";
  if (labels.includes("LifeEvent")) return "LifeEvent";
  if (labels.includes("Concern")) return "Concern";
  if (labels.includes("Objective")) return "Objective";
  if (labels.includes("Promise")) return "Promise";
  if (labels.includes("Action")) return "Action";
  return "Person";
}

function neo4jNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value ?? 0);
}

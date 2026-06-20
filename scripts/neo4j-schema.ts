import neo4j, { type Driver } from "neo4j-driver";
import { getNeo4jDatabaseConfig, loadLocalEnv } from "./load-local-env";

export const nodeLabels = [
  "Advisor",
  "Client",
  "Person",
  "Specialist",
  "ReferralOpportunity",
  "Meeting",
  "Memory",
  "LifeEvent",
  "Concern",
  "Objective",
  "Promise",
  "Action"
] as const;

export const relationshipTypes = [
  "MANAGES",
  "HAS_MEETING",
  "HAS_MEMORY",
  "HAS_LIFE_EVENT",
  "HAS_CONCERN",
  "HAS_OBJECTIVE",
  "HAS_PROMISE",
  "HAS_ACTION",
  "RELATED_TO",
  "HAS_REFERRAL_OPPORTUNITY",
  "MATCHES_SPECIALIST",
  "INVOLVES",
  "MENTIONED_OPPORTUNITY",
  "MATERIALIZES_AS",
  "PRODUCED",
  "CREATED",
  "FOLLOWS_FROM"
] as const;

const constraintQueries = nodeLabels.map(
  (label) => `CREATE CONSTRAINT ${label.toLowerCase()}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`
);

const indexQueries = [
  "CREATE INDEX memory_category_status IF NOT EXISTS FOR (n:Memory) ON (n.category, n.status)",
  "CREATE INDEX action_status_due IF NOT EXISTS FOR (n:Action) ON (n.status, n.dueAt)",
  "CREATE INDEX meeting_starts_at IF NOT EXISTS FOR (n:Meeting) ON (n.startsAt)",
  "CREATE INDEX referral_status IF NOT EXISTS FOR (n:ReferralOpportunity) ON (n.status)"
];

const fullTextIndexQuery = `
CREATE FULLTEXT INDEX advisor_memory_fulltext IF NOT EXISTS
FOR (n:Memory|LifeEvent|Concern|Objective|Promise|Action|ReferralOpportunity|Person|Specialist)
ON EACH [n.title, n.name, n.label, n.summary, n.sourceSnippet, n.note, n.need, n.reason, n.draftText]
`;

export async function ensureNeo4jSchema(driver: Driver) {
  const databaseConfig = getNeo4jDatabaseConfig();
  const applied: string[] = [];

  for (const query of [...constraintQueries, ...indexQueries, fullTextIndexQuery]) {
    await driver.executeQuery(query, {}, { ...databaseConfig, routing: neo4j.routing.WRITE });
    applied.push(query.replace(/\s+/g, " ").trim());
  }

  return applied;
}

export async function getNeo4jGraphHealth(driver: Driver, clientId: string) {
  const databaseConfig = getNeo4jDatabaseConfig();
  const result = await driver.executeQuery(
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
      RETURN count(DISTINCT m) AS memories
    }
    CALL {
      WITH c
      MATCH (c)-[:HAS_MEMORY]->(m:Memory)-[:MATERIALIZES_AS]->()
      RETURN count(DISTINCT m) AS materializedMemories
    }
    CALL {
      WITH c
      MATCH (c)-[:HAS_MEMORY]->(m:Memory)<-[:PRODUCED]-(:Meeting)
      RETURN count(DISTINCT m) AS meetingLinkedMemories
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
    { ...databaseConfig, routing: neo4j.routing.READ }
  );

  const record = result.records[0];
  if (!record) {
    return {
      clientId,
      exists: false,
      outgoingEdges: 0,
      memories: 0,
      materializedMemories: 0,
      meetingLinkedMemories: 0,
      typedNeighbors: 0
    };
  }

  return {
    clientId: record.get("clientId"),
    exists: true,
    outgoingEdges: toNumber(record.get("outgoingEdges")),
    memories: toNumber(record.get("memories")),
    materializedMemories: toNumber(record.get("materializedMemories")),
    meetingLinkedMemories: toNumber(record.get("meetingLinkedMemories")),
    typedNeighbors: toNumber(record.get("typedNeighbors"))
  };
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value ?? 0);
}

async function main() {
  loadLocalEnv();

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error("NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD are required.");
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    connectionTimeout: 8000,
    maxTransactionRetryTime: 3000
  });

  try {
    const applied = await ensureNeo4jSchema(driver);
    console.log("Neo4j schema ensured");
    console.log({ applied: applied.length });
  } finally {
    await driver.close();
  }
}

if (process.argv[1]?.endsWith("neo4j-schema.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

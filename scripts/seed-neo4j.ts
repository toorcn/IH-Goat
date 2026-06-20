import neo4j, { type Driver } from "neo4j-driver";
import {
  actions,
  advisor,
  client,
  graphNodes,
  meetings,
  memories
} from "../lib/demo-data";
import { getNeo4jDatabaseConfig, loadLocalEnv } from "./load-local-env";

loadLocalEnv();

const uri = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const username = process.env.NEO4J_USERNAME ?? "neo4j";
const password = process.env.NEO4J_PASSWORD ?? "password";
const databaseConfig = getNeo4jDatabaseConfig();

async function main() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    connectionTimeout: 8000,
    maxTransactionRetryTime: 3000
  });

  try {
    const serverInfo = await driver.getServerInfo(databaseConfig);
    console.log("Connection established");
    console.log(serverInfo);

    await executeWrite(driver, "MATCH (n) WHERE n.id IN $ids DETACH DELETE n", {
      ids: demoNodeIds()
    });

    await executeWrite(
      driver,
      `
      MERGE (a:Advisor {id: $advisor.id})
      SET a.name = $advisor.name,
          a.firm = $advisor.firm,
          a.label = $advisor.name,
          a.note = $advisor.firm
      MERGE (c:Client {id: $client.id})
      SET c.name = $client.name,
          c.label = $client.name,
          c.note = 'Family client since 2017',
          c.clientType = $client.clientType,
          c.riskProfile = $client.riskProfile,
          c.relationshipSince = $client.relationshipSince
      MERGE (a)-[serves:MANAGES]->(c)
      SET serves.id = 'edge-manages',
          serves.label = 'manages'
      MERGE (a)-[servesAlias:SERVES]->(c)
      SET servesAlias.id = 'edge-serves',
          servesAlias.label = 'serves'
      `,
      { advisor, client }
    );

    for (const meeting of meetings) {
      await executeWrite(
        driver,
        `
        MATCH (c:Client {id: $meeting.clientId})
        MERGE (m:Meeting {id: $meeting.id})
        SET m.startsAt = $meeting.startsAt,
            m.endedAt = $meeting.endedAt,
            m.type = $meeting.type,
            m.location = $meeting.location,
            m.objective = $meeting.objective,
            m.status = $meeting.status
        MERGE (c)-[:HAS_MEETING]->(m)
        `,
        { meeting }
      );
    }

    for (const memory of memories) {
      await executeWrite(
        driver,
        `
        MATCH (c:Client {id: $memory.clientId})
        MERGE (mem:Memory {id: $memory.id})
        SET mem.category = $memory.category,
            mem.title = $memory.title,
            mem.summary = $memory.summary,
            mem.source = $memory.source,
            mem.sourceSnippet = $memory.sourceSnippet,
            mem.confidence = $memory.confidence,
            mem.status = $memory.status,
            mem.validFrom = $memory.validFrom,
            mem.lastConfirmedAt = $memory.lastConfirmedAt,
            mem.salience = $memory.salience
        MERGE (c)-[:HAS_MEMORY]->(mem)
        `,
        { memory }
      );

      await seedTypedMemory(driver, memory);
    }

    for (const action of actions) {
      await executeWrite(
        driver,
        `
        MATCH (c:Client {id: $action.clientId})
        MATCH (m:Meeting {id: $action.meetingId})
        MERGE (act:Action {id: $action.id})
        SET act.title = $action.title,
            act.actionType = $action.actionType,
            act.dueAt = $action.dueAt,
            act.owner = $action.owner,
            act.status = $action.status,
            act.meetingId = $action.meetingId,
            act.draftText = $action.draftText
        MERGE (c)-[:HAS_ACTION]->(act)
        MERGE (act)-[:FOLLOWS_FROM]->(m)
        `,
        { action }
      );
    }

    const spouse = seedNode("person-mdm-lim");
    const daughter = seedNode("person-jia-en");
    const referral = seedNode("referral-estate");
    const evelyn = seedNode("specialist-evelyn");
    const marcus = seedNode("specialist-marcus");

    await executeWrite(
      driver,
      `
      MATCH (c:Client {id: $clientId})
      MERGE (spouse:Person {id: $spouse.id})
      SET spouse.name = $spouse.label,
          spouse.label = $spouse.label,
          spouse.role = 'spouse',
          spouse.note = $spouse.note
      MERGE (daughter:Person {id: $daughter.id})
      SET daughter.name = $daughter.label,
          daughter.label = $daughter.label,
          daughter.role = 'daughter',
          daughter.note = $daughter.note
      MERGE (referral:ReferralOpportunity {id: $referral.id})
      SET referral.title = $referral.label,
          referral.label = $referral.label,
          referral.need = 'Estate planning introduction',
          referral.reason = $referral.note,
          referral.status = 'open',
          referral.note = $referral.note
      MERGE (evelyn:Specialist {id: $evelyn.id})
      SET evelyn.name = $evelyn.label,
          evelyn.label = $evelyn.label,
          evelyn.role = 'estate planner',
          evelyn.note = $evelyn.note
      MERGE (marcus:Specialist {id: $marcus.id})
      SET marcus.name = $marcus.label,
          marcus.label = $marcus.label,
          marcus.role = 'lawyer',
          marcus.note = $marcus.note
      MERGE (c)-[spouseRel:RELATED_TO {relationship: 'spouse'}]->(spouse)
      SET spouseRel.id = 'edge-spouse',
          spouseRel.label = 'spouse'
      MERGE (c)-[daughterRel:RELATED_TO {relationship: 'daughter'}]->(daughter)
      SET daughterRel.id = 'edge-daughter',
          daughterRel.label = 'daughter'
      MERGE (c)-[referralRel:HAS_REFERRAL_OPPORTUNITY]->(referral)
      SET referralRel.id = 'edge-referral',
          referralRel.label = 'has opportunity'
      MERGE (referral)-[evelynRel:MATCHES_SPECIALIST]->(evelyn)
      SET evelynRel.id = 'edge-evelyn',
          evelynRel.label = 'matches'
      MERGE (referral)-[marcusRel:MATCHES_SPECIALIST]->(marcus)
      SET marcusRel.id = 'edge-marcus',
          marcusRel.label = 'legal support'
      MERGE (referral)-[daughterInvolvement:INVOLVES]->(daughter)
      SET daughterInvolvement.id = 'edge-referral-jia-en',
          daughterInvolvement.label = 'family context'
      `,
      { clientId: client.id, spouse, daughter, referral, evelyn, marcus }
    );

    console.log("Seeded Neo4j demo graph for Advisors' Advisor.");
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function seedNode(id: string) {
  const node = graphNodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing graph seed node: ${id}`);
  return node;
}

function demoNodeIds() {
  return [
    advisor.id,
    client.id,
    ...meetings.map((meeting) => meeting.id),
    ...memories.map((memory) => memory.id),
    ...memories.map((memory) => typedMemoryId(memory)),
    "aa-smoke-approved-estate-planning",
    "aa-smoke-approved-estate-planning-typed",
    "realtime-test-will-planning",
    "realtime-test-will-planning-typed",
    ...actions.map((action) => action.id),
    ...graphNodes.map((node) => node.id)
  ];
}

function executeWrite(driver: Driver, query: string, parameters: Record<string, unknown>) {
  return driver.executeQuery(query, parameters, {
    ...databaseConfig,
    routing: neo4j.routing.WRITE
  });
}

function seedTypedMemory(driver: Driver, memory: (typeof memories)[number]) {
  const typed = typedMemoryFor(memory);
  if (!typed) return Promise.resolve();

  return executeWrite(
    driver,
    `
    MATCH (c:Client {id: $clientId})
    MATCH (m:Memory {id: $memoryId})
    OPTIONAL MATCH (meeting:Meeting {id: $meetingId})
    MERGE (typed:${typed.label} {id: $typedId})
    SET typed.title = $title,
        typed.summary = $summary,
        typed.description = $summary,
        typed.source = $source,
        typed.sourceSnippet = $sourceSnippet,
        typed.confidence = $confidence,
        typed.status = $status,
        typed.validFrom = $validFrom,
        typed.lastConfirmedAt = $lastConfirmedAt,
        typed.salience = $salience,
        typed.updatedAt = datetime()
    MERGE (c)-[typedRel:${typed.relationship}]->(typed)
    SET typedRel.label = $relationshipLabel
    MERGE (meeting)-[:PRODUCED]->(m)
    `,
    {
      clientId: memory.clientId,
      memoryId: memory.id,
      meetingId: memory.source.includes("2026-04-08") ? "meeting-2026-04-08-tan" : "meeting-2026-06-20-tan",
      typedId: typedMemoryId(memory),
      title: memory.title,
      summary: memory.summary,
      source: memory.source,
      sourceSnippet: memory.sourceSnippet,
      confidence: memory.confidence,
      status: memory.status,
      validFrom: memory.validFrom,
      lastConfirmedAt: memory.lastConfirmedAt,
      salience: memory.salience,
      relationshipLabel: typed.relationship.toLowerCase().replaceAll("_", " ")
    }
  );
}

function typedMemoryFor(memory: (typeof memories)[number]) {
  if (memory.category === "Life Event") return { label: "LifeEvent", relationship: "HAS_LIFE_EVENT" };
  if (memory.category === "Unresolved Concern" || memory.category === "Emotional Cue") {
    return { label: "Concern", relationship: "HAS_CONCERN" };
  }
  if (memory.category === "Goal/Objective") return { label: "Objective", relationship: "HAS_OBJECTIVE" };
  if (memory.category === "Promise/Commitment") return { label: "Promise", relationship: "HAS_PROMISE" };
  return null;
}

function typedMemoryId(memory: (typeof memories)[number]) {
  return `${memory.id}-typed`;
}

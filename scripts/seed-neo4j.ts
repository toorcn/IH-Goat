import neo4j, { type Driver } from "neo4j-driver";
import {
  actions,
  advisor,
  client,
  graphNodes,
  meetings,
  memories
} from "../lib/demo-data";
import type { MemoryCategory } from "../lib/types";
import { getNeo4jDatabaseConfig, loadLocalEnv } from "./load-local-env";
import { ensureNeo4jSchema, getNeo4jGraphHealth } from "./neo4j-schema";

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
    const schemaApplied = await ensureNeo4jSchema(driver);
    console.log(`Neo4j schema ready (${schemaApplied.length} constraints/indexes checked).`);

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
        WITH mem
        MATCH (meeting:Meeting {id: $sourceMeetingId})
        MERGE (meeting)-[:PRODUCED]->(mem)
        `,
        { memory, sourceMeetingId: sourceMeetingIdForMemory(memory.source) }
      );
      const typed = typedMemoryMutation(memory.category);
      if (typed) {
        await executeWrite(driver, typed.query, {
          memory,
          typedId: typedSeedNodeId(memory.id)
        });
      }
    }

    for (const action of actions) {
      await executeWrite(
        driver,
        `
        MATCH (c:Client {id: $action.clientId})
        MERGE (act:Action {id: $action.id})
        SET act.title = $action.title,
            act.actionType = $action.actionType,
            act.meetingId = $action.meetingId,
            act.dueAt = $action.dueAt,
            act.owner = $action.owner,
            act.status = $action.status,
            act.draftText = $action.draftText
        MERGE (c)-[:HAS_ACTION]->(act)
        WITH act
        MATCH (meeting:Meeting {id: $action.meetingId})
        MERGE (act)-[:FOLLOWS_FROM]->(meeting)
        `,
        { action }
      );
    }

    const spouse = seedNode("person-mdm-lim");
    const daughter = seedNode("person-jia-en");
    const referral = seedNode("referral-estate");
    const evelyn = seedNode("specialist-evelyn");
    const marcus = seedNode("specialist-marcus");
    const ong = seedNode("person-ong");
    const businessReferral = seedNode("referral-business-succession");

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
      MERGE (ong:Person {id: $ong.id})
      SET ong.name = $ong.label,
          ong.label = $ong.label,
          ong.role = 'family business owner',
          ong.note = $ong.note
      MERGE (businessReferral:ReferralOpportunity {id: $businessReferral.id})
      SET businessReferral.title = $businessReferral.label,
          businessReferral.label = $businessReferral.label,
          businessReferral.need = 'Business succession introduction',
          businessReferral.reason = $businessReferral.note,
          businessReferral.status = 'permission_needed',
          businessReferral.note = $businessReferral.note
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
      MERGE (c)-[ongRel:RELATED_TO {relationship: 'friend'}]->(ong)
      SET ongRel.id = 'edge-ong',
          ongRel.label = 'friend'
      MERGE (businessRel:ReferralOpportunity {id: $businessReferral.id})
      MERGE (c)-[businessReferralRel:HAS_REFERRAL_OPPORTUNITY]->(businessRel)
      SET businessReferralRel.id = 'edge-business-referral-client',
          businessReferralRel.label = 'warm lead'
      MERGE (ong)-[businessNeedRel:MENTIONED_OPPORTUNITY]->(businessRel)
      SET businessNeedRel.id = 'edge-business-referral',
          businessNeedRel.label = 'may need'
      `,
      { clientId: client.id, spouse, daughter, referral, evelyn, marcus, ong, businessReferral }
    );

    const health = await getNeo4jGraphHealth(driver, client.id);
    console.log("Seeded Neo4j demo graph for Advisors' Advisor.");
    console.log("Graph health", health);
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
    ...actions.map((action) => action.id),
    ...graphNodes.map((node) => node.id)
  ];
}

function typedSeedNodeId(memoryId: string) {
  if (memoryId === "memory-lawyer-request") return "referral-estate";
  if (memoryId === "memory-ong-business-contact") return "person-ong";
  if (memoryId === "memory-jia-nus") return "life-jia-nus";
  if (memoryId === "memory-will-planning") return "concern-will-planning";
  if (memoryId === "memory-policy-hesitation") return "concern-policy-renewal";
  if (memoryId === "memory-family-transition") return "objective-family-transition";
  if (memoryId === "memory-guide-promise") return "promise-guide";
  return `${memoryId}-typed`;
}

function typedMemoryMutation(category: MemoryCategory) {
  if (category === "Life Event") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:LifeEvent {id: $typedId})
      SET typed.title = $memory.title,
          typed.summary = $memory.summary,
          typed.sourceSnippet = $memory.sourceSnippet,
          typed.confidence = $memory.confidence,
          typed.lastConfirmedAt = $memory.lastConfirmedAt
      MERGE (c)-[:HAS_LIFE_EVENT]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  if (category === "Unresolved Concern" || category === "Emotional Cue") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:Concern {id: $typedId})
      SET typed.title = $memory.title,
          typed.summary = $memory.summary,
          typed.status = $memory.status,
          typed.sourceSnippet = $memory.sourceSnippet,
          typed.confidence = $memory.confidence
      MERGE (c)-[:HAS_CONCERN]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  if (category === "Goal/Objective") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:Objective {id: $typedId})
      SET typed.title = $memory.title,
          typed.summary = $memory.summary,
          typed.status = $memory.status,
          typed.sourceSnippet = $memory.sourceSnippet,
          typed.confidence = $memory.confidence
      MERGE (c)-[:HAS_OBJECTIVE]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  if (category === "Promise/Commitment") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:Promise {id: $typedId})
      SET typed.title = $memory.title,
          typed.summary = $memory.summary,
          typed.status = $memory.status,
          typed.sourceSnippet = $memory.sourceSnippet,
          typed.confidence = $memory.confidence
      MERGE (c)-[:HAS_PROMISE]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  if (category === "Referral Opportunity") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:ReferralOpportunity {id: $typedId})
      SET typed.title = $memory.title,
          typed.label = $memory.title,
          typed.need = $memory.summary,
          typed.reason = $memory.sourceSnippet,
          typed.status = $memory.status,
          typed.confidence = $memory.confidence
      MERGE (c)-[:HAS_REFERRAL_OPPORTUNITY]->(typed)
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  if (category === "Relationship Mention") {
    return {
      query: `
      MATCH (c:Client {id: $memory.clientId})
      MATCH (mem:Memory {id: $memory.id})
      MERGE (typed:Person {id: $typedId})
      SET typed.name = $memory.title,
          typed.label = $memory.title,
          typed.note = $memory.summary,
          typed.sourceSnippet = $memory.sourceSnippet,
          typed.confidence = $memory.confidence
      MERGE (c)-[rel:RELATED_TO {relationship: 'mentioned'}]->(typed)
      SET rel.label = 'mentioned',
          rel.id = $memory.id + '-relationship'
      MERGE (mem)-[:MATERIALIZES_AS]->(typed)
      `
    };
  }

  return null;
}

function sourceMeetingIdForMemory(source: string) {
  if (source.includes("2026-04-08")) return "meeting-2026-04-08-tan";
  return "meeting-2026-06-20-tan";
}

function executeWrite(driver: Driver, query: string, parameters: Record<string, unknown>) {
  return driver.executeQuery(query, parameters, {
    ...databaseConfig,
    routing: neo4j.routing.WRITE
  });
}

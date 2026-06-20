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
    }

    for (const action of actions) {
      await executeWrite(
        driver,
        `
        MATCH (c:Client {id: $action.clientId})
        MERGE (act:Action {id: $action.id})
        SET act.title = $action.title,
            act.actionType = $action.actionType,
            act.dueAt = $action.dueAt,
            act.owner = $action.owner,
            act.status = $action.status,
            act.draftText = $action.draftText
        MERGE (c)-[:HAS_ACTION]->(act)
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

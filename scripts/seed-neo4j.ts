import neo4j from "neo4j-driver";
import {
  actions,
  advisor,
  client,
  graphEdges,
  graphNodes,
  meetings,
  memories
} from "../lib/demo-data";

const uri = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const username = process.env.NEO4J_USERNAME ?? "neo4j";
const password = process.env.NEO4J_PASSWORD ?? "password";

async function main() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    await session.executeWrite(async (tx) => {
      await tx.run("MATCH (n) DETACH DELETE n");

      await tx.run(
        `
        MERGE (a:Advisor {id: $advisor.id})
        SET a.name = $advisor.name, a.firm = $advisor.firm
        MERGE (c:Client {id: $client.id})
        SET c.name = $client.name,
            c.clientType = $client.clientType,
            c.riskProfile = $client.riskProfile,
            c.relationshipSince = $client.relationshipSince
        MERGE (a)-[:MANAGES]->(c)
        `,
        { advisor, client }
      );

      for (const meeting of meetings) {
        await tx.run(
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
        await tx.run(
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
        await tx.run(
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

      for (const node of graphNodes) {
        await tx.run(
          `
          MERGE (n:GraphEntity {id: $node.id})
          SET n.label = $node.label, n.type = $node.type, n.note = $node.note
          `,
          { node }
        );
      }

      for (const edge of graphEdges) {
        await tx.run(
          `
          MATCH (source:GraphEntity {id: $edge.source})
          MATCH (target:GraphEntity {id: $edge.target})
          MERGE (source)-[:RELATED {id: $edge.id, label: $edge.label}]->(target)
          `,
          { edge }
        );
      }
    });

    console.log("Seeded Neo4j demo graph for Advisors' Advisor.");
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

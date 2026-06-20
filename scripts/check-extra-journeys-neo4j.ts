import assert from "node:assert/strict";
import neo4j from "neo4j-driver";
import { extraJourneys } from "../lib/extra-journeys";
import { closeNeo4jDriver, getClientContextWithMemoryLayer } from "../lib/neo4j-memory";
import { getNeo4jDatabaseConfig, loadLocalEnv } from "./load-local-env";

loadLocalEnv();

async function main() {
  const uri = requiredEnv("NEO4J_URI");
  const username = requiredEnv("NEO4J_USERNAME");
  const password = requiredEnv("NEO4J_PASSWORD");
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    connectionTimeout: 8000,
    maxTransactionRetryTime: 3000
  });

  try {
    for (const journey of extraJourneys) {
      const result = await driver.executeQuery(
        `
        MATCH (client:Client {id: $clientId})
        OPTIONAL MATCH (client)-[:HAS_MEETING]->(meeting:Meeting)
        OPTIONAL MATCH (client)-[:HAS_MEMORY]->(memory:Memory)
        OPTIONAL MATCH (client)-[:HAS_ACTION]->(action:Action)
        OPTIONAL MATCH (client)-[rel:RELATED_TO|HAS_REFERRAL_OPPORTUNITY]->(node)
        RETURN client.name AS name,
               count(DISTINCT meeting) AS meetings,
               count(DISTINCT memory) AS memories,
               count(DISTINCT action) AS actions,
               count(DISTINCT node) AS graphNodes
        `,
        { clientId: journey.client.id },
        { ...getNeo4jDatabaseConfig(), routing: neo4j.routing.READ }
      );

      const record = result.records[0];
      assert.ok(record, `No Neo4j record returned for ${journey.client.id}`);
      assert.equal(record.get("name"), journey.client.name);
      assert.ok(record.get("meetings").toNumber() >= 2, `${journey.client.id} missing meetings`);
      assert.ok(record.get("memories").toNumber() >= 4, `${journey.client.id} missing memories`);
      assert.ok(record.get("actions").toNumber() >= 2, `${journey.client.id} missing actions`);
      assert.ok(record.get("graphNodes").toNumber() >= 3, `${journey.client.id} missing graph nodes`);

      const context = await getClientContextWithMemoryLayer(journey.client.id);
      assert.equal(context.memorySource, "neo4j");
      assert.equal(context.client.name, journey.client.name);
      assert.ok(context.memories.length >= 4, `${journey.client.id} app context missing memories`);
      assert.ok(context.actions.length >= 2, `${journey.client.id} app context missing actions`);
      assert.ok(context.graph.nodes.length >= 5, `${journey.client.id} app context missing graph nodes`);

      console.log("Verified extra journey", {
        clientId: journey.client.id,
        name: record.get("name"),
        meetings: record.get("meetings").toNumber(),
        memories: record.get("memories").toNumber(),
        actions: record.get("actions").toNumber(),
        graphNodes: context.graph.nodes.length
      });
    }
  } finally {
    await driver.close();
    await closeNeo4jDriver();
  }
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

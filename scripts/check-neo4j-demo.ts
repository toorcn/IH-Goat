import assert from "node:assert/strict";
import {
  closeNeo4jDriver,
  getClientContextWithMemoryLayer,
  saveApprovedMemory
} from "../lib/neo4j-memory";
import type { ExtractedMemory } from "../lib/types";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

const clientId = "client-tan";
const memoryId = "aa-smoke-approved-estate-planning";

async function main() {
  assertNeo4jEnv();

  try {
    const writeResult = await saveApprovedMemory(approvedSmokeMemory());
    assert.equal(writeResult.writeMode, "neo4j");
    assert.equal(writeResult.saved, true);

    const context = await getClientContextWithMemoryLayer(clientId);
    assert.equal(context.memorySource, "neo4j");

    const approvedMemory = context.memories.find((memory) => memory.id === memoryId);
    assert.ok(approvedMemory, "Approved smoke memory was not returned from Neo4j context.");
    assert.equal(approvedMemory.status, "approved");
    assert.equal(approvedMemory.source, "live meeting companion");
    assert.equal(approvedMemory.salience, 0.95);
    assert.ok(
      approvedMemory.updatedAt || approvedMemory.createdAt,
      "Approved smoke memory is missing Neo4j timestamp metadata."
    );

    const approvedOrRecent = context.memories.filter(
      (memory) => memory.status === "approved" || memory.source === "live meeting companion"
    );
    assert.equal(
      approvedOrRecent.some((memory) => memory.id === memoryId),
      true,
      "Approved smoke memory would not appear in the client profile approved/recent section."
    );

    console.log("Neo4j demo flow checks passed");
  } finally {
    await closeNeo4jDriver();
  }
}

function assertNeo4jEnv() {
  const missing = ["NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD"].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    throw new Error(`${missing.join(", ")} required for npm run check:neo4j-demo.`);
  }
}

function approvedSmokeMemory(): ExtractedMemory {
  return {
    id: memoryId,
    clientId,
    category: "Unresolved Concern",
    summary: "Estate planning is still open and needs an advisor-approved follow-up.",
    sourceSnippet: "I still have not updated my will and would appreciate an introduction.",
    timestamp: new Date().toISOString(),
    confidence: 0.94,
    proposedGraphMutation:
      "MERGE (c:Client {id: 'client-tan'})-[:HAS_CONCERN]->(:Concern {title: 'Estate planning remains open'})"
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

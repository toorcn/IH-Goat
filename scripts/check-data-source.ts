import assert from "node:assert/strict";
import { getCalendar, getClientContextWithMemoryLayer, getDataMode } from "../lib/neo4j-memory";
import { closeNeo4jDriver } from "../lib/neo4j-memory";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

async function main() {
  const expectedMode = process.env.EXPECT_DATA_MODE?.trim();
  const mode = getDataMode();
  if (expectedMode) assert.equal(mode, expectedMode);

  const calendar = await getCalendar();
  assert.ok(calendar.meetings.length > 0, "No meetings returned from selected data source.");

  const firstMeeting = calendar.meetings[0];
  const context = await getClientContextWithMemoryLayer(firstMeeting.clientId);
  assert.equal(context.dataMode, mode);

  if (mode === "neo4j") {
    assert.equal(calendar.source, "neo4j");
    assert.equal(context.memorySource, "neo4j");
    assert.ok(context.memories.length > 0, "Neo4j context returned no memories.");
    assert.ok(context.graph.nodes.length > 0, "Neo4j context returned no graph nodes.");
    assert.notEqual(
      context.briefing,
      "You are meeting Mr. Tan Wee Seng at 10:30. You last met on 2026-04-08, about 10 weeks ago. Last time, will planning was unresolved and he seemed hesitant about policy renewal. His daughter Jia En recently got into NUS, so open by congratulating him before moving into estate planning. Useful next questions: what has made the will update hard to complete, and would an introduction to Evelyn Ng help?",
      "Neo4j mode should generate the briefing from graph data, not reuse the fixed demo briefing."
    );
  }

  console.log("Data source check passed");
  console.log({
    mode,
    calendarSource: calendar.source,
    memorySource: context.memorySource,
    client: context.client.name,
    meeting: context.upcomingMeeting.id,
    memories: context.memories.length,
    graphNodes: context.graph.nodes.length
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await closeNeo4jDriver();
  });

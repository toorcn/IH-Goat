import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const extraJourneyPath = join(process.cwd(), "lib/extra-journeys.ts");
  assert.ok(existsSync(extraJourneyPath), "lib/extra-journeys.ts must exist");

  const { extraJourneys } = await import("../lib/extra-journeys");
  assert.ok(Array.isArray(extraJourneys), "extraJourneys must be an array");
  assert.ok(extraJourneys.length >= 2, "At least two extra journeys are required");

  const ids = new Set<string>();
  for (const journey of extraJourneys) {
    assert.ok(journey.advisor?.id, "Journey advisor id is required");
    assert.ok(journey.client?.id, "Journey client id is required");
    assert.ok(journey.client.name, `Client name missing for ${journey.client.id}`);
    assert.ok(journey.meetings.length >= 2, `${journey.client.id} needs upcoming and prior meetings`);
    assert.ok(
      journey.meetings.some((meeting) => meeting.status !== "review"),
      `${journey.client.id} needs an upcoming/non-review meeting`
    );
    assert.ok(journey.memories.length >= 4, `${journey.client.id} needs at least four memories`);
    assert.ok(journey.actions.length >= 2, `${journey.client.id} needs at least two actions`);
    assert.ok(journey.graphNodes.length >= 5, `${journey.client.id} needs graph nodes`);
    assert.ok(journey.graphEdges.length >= 4, `${journey.client.id} needs graph edges`);
    assert.ok(journey.suggestedQuestions.length >= 3, `${journey.client.id} needs suggested questions`);
    assert.ok(journey.briefing.includes(journey.client.name), `${journey.client.id} briefing should name the client`);

    const uniqueEntityIds = [
      journey.client.id,
      ...journey.meetings.map((meeting) => meeting.id),
      ...journey.memories.map((memory) => memory.id),
      ...journey.actions.map((action) => action.id),
      ...journey.graphEdges.map((edge) => edge.id)
    ];

    assert.ok(
      journey.graphNodes.some((node) => node.id === journey.client.id),
      `${journey.client.id} graph must include the client node`
    );
    assert.ok(
      journey.graphNodes.some((node) => node.id === journey.advisor.id),
      `${journey.client.id} graph must include the advisor node`
    );

    for (const id of uniqueEntityIds) {
      assert.ok(!ids.has(id), `Duplicate journey id: ${id}`);
      ids.add(id);
    }
  }

  console.log("Extra journey checks passed", {
    journeys: extraJourneys.length,
    clients: extraJourneys.map((journey) => journey.client.id)
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

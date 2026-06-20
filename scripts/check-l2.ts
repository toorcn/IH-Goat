import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(`L2 check failed: ${message}`);
    process.exit(1);
  }
}

function readRequired(relativePath: string) {
  const absolutePath = join(root, relativePath);
  assert(existsSync(absolutePath), `${relativePath} does not exist`);
  return readFileSync(absolutePath, "utf8");
}

const page = readRequired("app/l2/[meetingId]/page.tsx");
const component = readRequired("components/l2-memory-writer.tsx");

assert(page.includes("getClientContextForMeeting"), "L2 page must load meeting context");
assert(page.includes("L2MemoryWriter"), "L2 page must render the memory writer component");
assert(page.includes("force-dynamic"), "L2 page should be dynamic for Neo4j-backed context");

assert(component.includes("/api/meetings/${meetingId}/extract"), "L2 writer must call meeting extraction API");
assert(component.includes("/api/memory/approve"), "L2 writer must call memory approval API");
assert(component.includes("Approve all"), "L2 writer must expose an approve-all workflow");
assert(component.includes("No auto-write"), "L2 writer must explicitly communicate the approval gate");

console.log("L2 check passed");

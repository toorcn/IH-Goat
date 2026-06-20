# Advisors' Advisor

Hackathon MVP for an AI memory and meeting companion for financial advisors.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Neo4j driver with explicit `DATA_MODE` selection
- OpenAI Realtime WebRTC briefing with server-minted ephemeral tokens

## L1 Realtime briefing implementation

The pre-meeting advisor briefing uses OpenAI Realtime over WebRTC:

- `/api/realtime/token` mints a short-lived client secret on the server
- The browser opens a `RTCPeerConnection` with microphone audio
- The `oai-events` data channel sends typed test questions and response requests
- The assistant is instructed to answer only from the Neo4j-backed client context
- Realtime receives a `query_client_memory` tool that calls `/api/memory/query`

This project adds the advisor-specific memory layer around that flow:

- `/api/memory/query` reads memories/actions from Neo4j when configured and returns a normalized visual response
- `/api/memory/approve` saves approved candidate memories into Neo4j
- `/api/actions/approve` marks follow-ups as advisor-approved without sending client-facing messages
- `/api/clients/[clientId]/context` reads client context through the selected data mode
- `DATA_MODE=neo4j` reads advisor, client, meetings, memories, actions, graph, and briefing context from Neo4j
- `DATA_MODE=hybrid` overlays Neo4j memory on the seeded demo journey
- `DATA_MODE=demo` uses deterministic local demo data

The briefing page also supports typed fallback Q&A without a Realtime connection.
The adaptive memory panel maps each `/api/memory/query` response into stable L1/L1.5
views: brief answers, memory cards, action tables, relationship graph, timeline,
referral recommendation, evidence snippets, and missing-info next steps.

## L2 standalone memory writer

L2 is a separate page, not an add-on inside L1/L1.5. Open:

```txt
/l2/meeting-2026-06-20-tan
```

Use it to turn a meeting into approved relationship memory:

1. Capture or simulate transcript lines.
2. Extract candidate memories through `POST /api/meetings/[meetingId]/extract`.
3. Review the evidence, confidence, and proposed graph mutation.
4. Approve or reject each memory card.
5. Approved cards call `POST /api/memory/approve`, which writes to Neo4j when configured.

The L2 contract is approve-before-write: extraction can propose memory, but it never
auto-writes to the graph. If Neo4j credentials are missing, the write log shows a
demo fallback instead of pretending persistence succeeded.

## Demo flow

The reliable 5-minute path is:

1. Open the dashboard and start the Mr. Tan briefing.
2. Use the briefing page to show Realtime readiness and client context.
3. Open the live companion and press **Simulate meeting** for silent prompts.
4. Open **L2 Writer**, simulate/extract candidate memories, then approve one or all writes.
5. Open the client profile. When Neo4j is configured, approved L2 memories appear in the dedicated approved/recent memory section after refresh.
6. Use the review board for final follow-up action approval.

Approval is advisor-gated. The app does not send email, WhatsApp, Telegram, calendar invites, or any other client-facing message from the approval buttons.

## Run

```bash
npm install
npm run check:data-source
npm run check:mvp
npm run dev
```

Open `http://localhost:3000`.

## Optional services

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` there only to enable
the realtime token and live transcription routes. Do not commit `.env.local` or
API keys.

Set `DATA_MODE=neo4j` when you want to validate that the MVP is reading from Neo4j
instead of fixed demo data. In this mode, Neo4j failures are visible failures. Use
`DATA_MODE=hybrid` only when you want the old fallback behavior for a resilient demo.

```bash
POST /api/realtime/token
POST /api/meetings/[meetingId]/transcribe
```

Seed Neo4j when a local database is available:

```bash
npm run check:neo4j
npm run seed:neo4j
npm run check:data-source
npm run check:neo4j-demo
```

`check:neo4j-demo` writes one deterministic advisor-approved smoke memory, reads
the client context through the app helper, and verifies that the memory qualifies
for the client profile approved/recent section.

The app can still render without OpenAI or Neo4j when `DATA_MODE=demo`. L1 voice
briefing requires `OPENAI_API_KEY` because it uses OpenAI Realtime over WebRTC.

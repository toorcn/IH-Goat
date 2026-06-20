# Advisors' Advisor

Hackathon MVP for an AI memory operating system for financial advisors.

The demo follows one advisor, Sarah Lim, as she prepares for, runs, reviews, and follows up on a client meeting with Mr. Tan Wee Seng. The product story is simple: the advisor should never walk into a meeting cold, forget important context, miss a referral signal, or save client memory without review.

## What It Proves

- **L1 pre-meeting briefing:** advisor asks grounded voice or typed questions before a client meeting.
- **L1.5 adaptive memory display:** the same memory query can render as a brief answer, cards, table, graph, timeline, recommendation, or missing-info prompt.
- **L2 live meeting companion:** browser microphone capture or scripted simulation produces silent prompts and candidate memory updates.
- **Advisor-gated review:** follow-up actions and memory writes require explicit advisor approval.
- **Neo4j-shaped memory:** the app can run from demo data, real Neo4j data, or a hybrid of both.

## Demo Flow

The reliable 5-minute judge path:

1. Open the dashboard and start the Mr. Tan briefing.
2. Ask a typed or voice question on the briefing page.
3. Open the live meeting companion and press **Simulate meeting**.
4. End and review the generated follow-ups and memory updates.
5. Approve one action and one memory.
6. Open the client profile and inspect the relationship graph, timeline, open items, and approved/recent memory.

Approval buttons do not send client-facing messages. They only mark advisor-reviewed output and, when Neo4j is configured, persist approved records to the memory layer.

## Tech Stack

| Layer | Technology | Why |
| --- | --- | --- |
| App framework | Next.js App Router | Server-rendered pages plus API routes in one deployable app. |
| UI | React 19, TypeScript, Tailwind CSS, lucide-react | Fast product surfaces with typed components and consistent iconography. |
| Voice briefing | OpenAI Realtime over browser WebRTC | Natural pre-meeting Q&A with server-minted ephemeral client secrets. |
| Live transcription | Browser Web Audio API plus OpenAI audio transcription route | Low-friction meeting capture without a phone provider. |
| Memory source | Neo4j driver | Client memory is naturally graph-shaped: advisor, client, family, meetings, referrals, actions. |
| Demo fallback | Deterministic local seed data | Judges and contributors can run the MVP without external services. |
| Verification | TypeScript scripts, ESLint, Next build | Lightweight checks for demo flow, data mode, Neo4j connectivity, and production build. |

## System Architecture

The app is built as one Next.js product surface with server-rendered pages, client-side interactive components, API route boundaries, an explicit data-mode selector, and optional external services. The architecture is intentionally thin around integrations: product logic stays inside the web app and memory layer, while OpenAI and Neo4j are replaceable service boundaries.

### Runtime View

```mermaid
flowchart TB
  Advisor["Advisor"] --> Browser["Browser UI"]

  subgraph UI["Next.js App Router UI"]
    Dashboard["Dashboard"]
    Briefing["L1 Briefing"]
    Companion["L2 Meeting Companion"]
    Review["Review Board"]
    ClientProfile["Client Profile / KG View"]
  end

  subgraph Components["Client Components"]
    VoiceBriefing["VoiceBriefing"]
    AdaptiveDisplay["Adaptive Memory Display"]
    MeetingCompanion["MeetingCompanion"]
    ReviewBoard["ReviewBoard"]
    RelationshipGraph["RelationshipGraph"]
  end

  subgraph API["Next.js API Routes"]
    RealtimeToken["/api/realtime/token"]
    MemoryQuery["/api/memory/query"]
    Transcribe["/api/meetings/:id/transcribe"]
    Extract["/api/meetings/:id/extract"]
    ApproveMemory["/api/memory/approve"]
    ApproveAction["/api/actions/approve"]
    ClientContext["/api/clients/:id/context"]
  end

  subgraph Core["Core App Logic"]
    DataMode["Data mode selector"]
    VisualBuilder["Memory visual response builder"]
    SignalExtraction["Meeting signal extraction"]
    DemoData["Deterministic demo data"]
    Neo4jMemory["Neo4j memory adapter"]
  end

  subgraph External["Optional Services"]
    OpenAIRealtime["OpenAI Realtime"]
    OpenAITranscribe["OpenAI Audio Transcription"]
    Neo4j["Neo4j Graph Database"]
  end

  Browser --> Dashboard
  Browser --> Briefing
  Browser --> Companion
  Browser --> Review
  Browser --> ClientProfile

  Briefing --> VoiceBriefing
  VoiceBriefing --> RealtimeToken
  RealtimeToken --> OpenAIRealtime
  VoiceBriefing --> MemoryQuery
  MemoryQuery --> VisualBuilder

  Companion --> MeetingCompanion
  MeetingCompanion --> Transcribe
  Transcribe --> OpenAITranscribe
  MeetingCompanion --> SignalExtraction
  Extract --> SignalExtraction

  Review --> ReviewBoard
  ReviewBoard --> ApproveMemory
  ReviewBoard --> ApproveAction

  Dashboard --> DataMode
  ClientProfile --> DataMode
  ClientContext --> DataMode
  VisualBuilder --> DataMode
  ApproveMemory --> Neo4jMemory
  ApproveAction --> Neo4jMemory
  DataMode --> DemoData
  DataMode --> Neo4jMemory
  Neo4jMemory --> Neo4j
```

### Layer Responsibilities

| Layer | Responsibility | Key Files |
| --- | --- | --- |
| Route pages | Load selected data-mode context and compose product surfaces. | `app/page.tsx`, `app/briefing/[meetingId]/page.tsx`, `app/meeting/[meetingId]/page.tsx`, `app/post-meeting/[meetingId]/page.tsx`, `app/client/[clientId]/page.tsx` |
| Interactive UI | Voice session, adaptive memory display, meeting capture, review approvals, graph/timeline rendering. | `components/voice-briefing.tsx`, `components/meeting-companion.tsx`, `components/review-board.tsx`, `components/relationship-graph.tsx` |
| API boundary | Keeps browser code away from service secrets and normalizes OpenAI/Neo4j interactions. | `app/api/**/route.ts` |
| Memory access | Chooses `demo`, `hybrid`, or `neo4j`; reads context; writes approved memories/actions. | `lib/neo4j-memory.ts`, `lib/demo-data.ts` |
| Query intelligence | Turns a natural memory query into answer text plus the best visual mode. | `lib/memory-query-response.ts` |
| Meeting intelligence | Converts transcript events into suggestions and candidate memory updates. | `lib/demo-data.ts`, `hooks/use-live-meeting-recorder.ts` |
| Domain contracts | Shared types for advisor, client, meeting, memory, action, graph, transcript, and visual response. | `lib/types.ts` |
| Validation | Fast local checks for MVP behavior, selected data source, Neo4j, and build readiness. | `scripts/*.ts` |

### Core Data Flow

```mermaid
sequenceDiagram
  participant Advisor
  participant UI as "Next.js UI"
  participant API as "API Routes"
  participant Data as "Data Mode Selector"
  participant Demo as "Demo Data"
  participant Graph as "Neo4j"

  Advisor->>UI: Open dashboard / briefing / client page
  UI->>Data: Request client context
  Data->>Demo: Read deterministic journey when DATA_MODE=demo
  Data->>Graph: Read graph context when DATA_MODE=neo4j
  Data-->>UI: Advisor, client, meetings, memories, actions, graph
  Advisor->>UI: Ask memory question
  UI->>API: POST /api/memory/query
  API->>Data: Load current client context
  API-->>UI: Answer + display mode + evidence
  Advisor->>UI: Approve action or memory
  UI->>API: POST approval route
  API->>Graph: Save only if Neo4j is configured
  API-->>UI: Approved status; no client message sent
```

### L1: Pre-Meeting Realtime Briefing

The briefing page uses `VoiceBriefing` for both voice and typed Q&A.

1. Browser asks `POST /api/realtime/token` for a short-lived OpenAI Realtime client secret.
2. Server creates the Realtime session using `OPENAI_API_KEY`; the browser never receives the long-lived API key.
3. Browser opens a WebRTC session with OpenAI and sends microphone audio.
4. The Realtime assistant can call `query_client_memory`.
5. Browser answers that function call by posting to `/api/memory/query`.
6. `/api/memory/query` loads the selected data-mode client context and returns a `MemoryQueryVisualResponse`.
7. The UI shows the spoken/typed answer and the L1.5 adaptive display.

Fallbacks:

- Missing `OPENAI_API_KEY`: voice is disabled, typed Q&A still works.
- Mic denial: typed Q&A still works.
- Neo4j unavailable in `demo` or `hybrid`: deterministic memory remains available.

### L1.5: Adaptive Memory Display

Memory queries do not always render as chat. `lib/memory-query-response.ts` selects a display mode based on the query intent and available evidence.

| Display Mode | Used For | Example Query |
| --- | --- | --- |
| `brief` | Short answer from one or two facts. | "What should I remember?" |
| `cards` | Multiple high-salience memories. | "Summarize this client." |
| `table` | Actions, promises, follow-ups, reminders. | "What do I need to send?" |
| `graph` | Family, specialists, referral network. | "Who is connected to him?" |
| `timeline` | Prior meeting history and dated memory. | "What happened last time?" |
| `recommendation` | Referral or specialist next step. | "Who should I introduce?" |
| `missing_info` | No grounded evidence found. | "Does he have a brother?" |

This lets the same web interface answer as a table, graph, timeline, recommendation, or bullet-style summary depending on what is most useful.

### L2: Live Meeting Companion

The meeting page uses browser-native audio capture and deterministic extraction for demo reliability.

1. `useLiveMeetingRecorder` requests microphone access.
2. Browser Web Audio buffers PCM samples.
3. Silence is skipped; non-silent chunks are encoded as WAV.
4. Chunks are posted to `/api/meetings/[meetingId]/transcribe`.
5. If OpenAI is configured, the route returns transcript text.
6. Transcript events feed `extractMeetingSignals`.
7. The UI shows silent advisor suggestions and candidate memory updates.
8. The scripted **Simulate meeting** button exercises the same extraction path without mic or OpenAI.

Current L2 is designed for a reliable hackathon demo. Full speaker diarization and durable transcript storage are future work.

### Review And Write Path

```mermaid
flowchart LR
  Transcript["Transcript events"] --> Extractor["extractMeetingSignals"]
  Extractor --> Suggestions["Silent suggestions"]
  Extractor --> Candidates["Candidate memory updates"]
  Candidates --> Review["Review Board"]
  Review --> Approve["Advisor approves"]
  Approve --> MemoryAPI["/api/memory/approve"]
  Approve --> ActionAPI["/api/actions/approve"]
  MemoryAPI --> Neo4j["Neo4j when configured"]
  ActionAPI --> Neo4j
  MemoryAPI --> DemoResult["Demo fallback result"]
  ActionAPI --> NoSend["No client-facing send"]
```

The safety boundary is strict: approval marks an action or memory as advisor-reviewed. It does not send WhatsApp, Telegram, email, calendar invites, or client-facing messages.

### Neo4j Graph Shape

The seeded graph mirrors the advisor story and keeps relationships explicit:

```mermaid
graph LR
  AdvisorNode["Advisor: Sarah Lim"] -->|"MANAGES"| ClientNode["Client: Mr. Tan"]
  ClientNode -->|"HAS_MEETING"| UpcomingMeeting["Meeting: 2026-06-20"]
  ClientNode -->|"HAS_MEETING"| PriorMeeting["Meeting: 2026-04-08"]
  ClientNode -->|"HAS_MEMORY"| MemoryNode["Memory"]
  ClientNode -->|"HAS_ACTION"| ActionNode["Action"]
  ClientNode -->|"RELATED_TO"| SpouseNode["Person: Mdm. Lim"]
  ClientNode -->|"RELATED_TO"| DaughterNode["Person: Jia En"]
  ClientNode -->|"HAS_REFERRAL_OPPORTUNITY"| ReferralNode["Referral Opportunity"]
  ReferralNode -->|"MATCHES_SPECIALIST"| EvelynNode["Specialist: Evelyn Ng"]
  ReferralNode -->|"MATCHES_SPECIALIST"| MarcusNode["Specialist: Marcus Lee"]
```

Approved memory writes create a `Memory` node and, for supported categories, typed nodes such as `LifeEvent`, `Concern`, `Objective`, or `Promise`. The current client graph view focuses on the relationship/referral network; approved typed memory is surfaced in the client profile memory section and is ready for future graph expansion.

### Extension Points

Future integrations should plug into the existing contracts instead of bypassing them:

- WhatsApp or Telegram should convert messages into `/api/memory/query`, transcript events, or review proposals.
- Better extraction should preserve the `ExtractedMemory` and `SilentSuggestion` contracts.
- Durable meeting sessions should persist transcript events before review.
- Expanded KG views should read from the same Neo4j memory adapter.
- Authentication should wrap the route/API layer without changing the core memory contracts.

For even more detail, see [docs/system-architecture.md](docs/system-architecture.md).

## Data Modes

The app supports three runtime data modes through `DATA_MODE`.

| Mode | Behavior | Best For |
| --- | --- | --- |
| `demo` | Uses deterministic local data only. No OpenAI or Neo4j required for the UI path. | Fast first run and judge fallback. |
| `hybrid` | Starts from demo journey and overlays Neo4j memory/actions/graph when available. | Resilient demos with partial graph connectivity. |
| `neo4j` | Requires Neo4j for calendar, client context, memories, actions, graph, and writes. Failures are visible. | Integration validation and real memory-layer proof. |

If `DATA_MODE` is unset, the app chooses `neo4j` only when Neo4j env vars exist. Otherwise it runs in `demo` mode.

## Quick Start

```bash
npm install
npm run check:data-source
npm run check:mvp
npm run dev
```

Open:

```text
http://localhost:3000
```

The zero-dependency path works without `.env.local` because it falls back to demo data.

## Optional Environment

Copy `.env.example` to `.env.local` only when you want to enable optional services.

```bash
cp .env.example .env.local
```

Important variables:

```bash
OPENAI_API_KEY=
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_TRANSCRIBE_MODEL=whisper-1

DATA_MODE=demo

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=
```

Use `DATA_MODE=demo` for the safest local run. Switch to `DATA_MODE=neo4j` only after Neo4j is reachable and seeded.

## Neo4j Setup

When a local or Aura Neo4j database is available:

```bash
npm run check:neo4j
npm run seed:neo4j
DATA_MODE=neo4j npm run check:data-source
npm run check:neo4j-demo
```

What the scripts do:

- `check:neo4j` verifies the database connection.
- `seed:neo4j` writes the demo advisor, client, meetings, memories, actions, and relationship graph.
- `check:data-source` confirms the selected data mode returns usable client context.
- `check:neo4j-demo` writes a deterministic approved memory and verifies it appears in the client profile memory section.

## OpenAI Setup

Set `OPENAI_API_KEY` to enable:

- `/api/realtime/token`, used by the pre-meeting Realtime voice briefing.
- `/api/meetings/[meetingId]/transcribe`, used by live meeting audio chunks.

Without `OPENAI_API_KEY`, the app still renders. The briefing page supports typed memory Q&A, and the meeting companion supports the scripted simulation path.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Dashboard and 5-minute demo command center. |
| `/briefing/[meetingId]` | L1 pre-meeting voice and typed Q&A with adaptive L1.5 memory display. |
| `/meeting/[meetingId]` | L2 live meeting companion with mic capture, simulation, suggestions, and captured memory candidates. |
| `/post-meeting/[meetingId]` | Advisor approval board for follow-up actions and memory updates. |
| `/client/[clientId]` | Client context, timeline, graph, approved/recent memory, and open items. |

## Main API Routes

| Endpoint | Purpose |
| --- | --- |
| `POST /api/realtime/token` | Creates a short-lived OpenAI Realtime client secret. |
| `POST /api/memory/query` | Returns a normalized visual memory response for L1/L1.5. |
| `GET /api/clients/[clientId]/context` | Reads the selected data-mode client context. |
| `GET /api/clients/[clientId]/graph` | Reads the selected data-mode relationship graph. |
| `POST /api/meetings/[meetingId]/transcribe` | Transcribes meeting audio chunks when OpenAI is configured. |
| `POST /api/meetings/[meetingId]/extract` | Extracts deterministic suggestions and candidate memories from transcript events. |
| `POST /api/actions/approve` | Marks a follow-up action as advisor-approved. No outbound message is sent. |
| `POST /api/memory/approve` | Saves an advisor-approved memory to Neo4j when configured, with demo fallback. |

## Verification

Run the main checks before pushing:

```bash
npm run lint
npm run check:data-source
npm run check:mvp
npm run build
```

Run Neo4j-specific checks only when Neo4j env vars are real:

```bash
npm run check:neo4j
npm run seed:neo4j
DATA_MODE=neo4j npm run check:data-source
npm run check:neo4j-demo
```

## Product Boundaries

Current `main` branch is focused on the web demo and memory layer proof.

Not included yet:

- Production authentication and multi-advisor tenancy.
- WhatsApp, Telegram, OpenClaw, Vapi, or email integrations.
- Automatic client-facing sends.
- Durable meeting-event storage beyond approved Neo4j writes.
- Full speaker diarization.
- General-purpose CRM search across many clients.

The central safety rule is intentional: the system may suggest, draft, or capture, but advisor approval is required before anything becomes a saved memory or client-facing follow-up.

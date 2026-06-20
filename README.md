# Advisors' Advisor

Hackathon MVP for an AI memory and meeting companion for financial advisors.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Neo4j driver with seeded local fallback data
- OpenAI Realtime WebRTC briefing with server-minted ephemeral tokens

## L1 Realtime briefing implementation

The pre-meeting advisor briefing uses OpenAI Realtime over WebRTC:

- `/api/realtime/token` mints a short-lived client secret on the server
- The browser opens a `RTCPeerConnection` with microphone audio
- The `oai-events` data channel sends typed test questions and response requests
- The assistant is instructed to answer only from the Neo4j-backed client context

This project adds the advisor-specific memory layer around that flow:

- `/api/memory/query` reads memories/actions from Neo4j when configured
- `/api/memory/approve` saves approved candidate memories into Neo4j
- `/api/clients/[clientId]/context` enriches seeded demo context with Neo4j memory
- If Neo4j is not configured, deterministic demo data keeps the hackathon flow runnable

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional services

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to enable the realtime
token and live transcription routes:

```bash
POST /api/realtime/token
POST /api/meetings/[meetingId]/transcribe
```

Seed Neo4j when a local database is available:

```bash
npm run check:neo4j
npm run seed:neo4j
```

The app still renders without OpenAI or Neo4j by using deterministic demo data. L1 voice
briefing requires `OPENAI_API_KEY` because it uses OpenAI Realtime over WebRTC.

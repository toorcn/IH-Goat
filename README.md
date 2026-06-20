# Advisors' Advisor

Hackathon MVP for an AI memory and meeting companion for financial advisors.

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Neo4j driver with seeded local fallback data
- OpenAI Realtime session route with browser voice fallback

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional services

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to enable the realtime
session route:

```bash
POST /api/realtime/session
```

Seed Neo4j when a local database is available:

```bash
npm run seed:neo4j
```

The app still runs without OpenAI or Neo4j by using deterministic demo data and browser
speech synthesis.

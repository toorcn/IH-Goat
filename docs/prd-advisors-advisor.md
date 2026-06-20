# Product Requirements Document: Advisors' Advisor

Version: 0.1  
Date: 2026-06-20  
Status: Draft for hackathon MVP  
Primary goal: Build a demo/pitch-ready prototype that proves the end-to-end advisor workflow.

## 1. Product Summary

Advisors' Advisor is an AI memory and meeting companion for financial advisors. It helps an advisor remember what matters about each client before, during, and after a meeting.

The product uses a client memory graph stored in Neo4j, a realtime voice/chat interface, and a web meeting companion. For the hackathon demo, the product should show one advisor working with one client through a complete journey:

1. A seeded upcoming meeting appears in the advisor's calendar view.
2. The assistant starts a simple web-based pre-meeting "call" with the advisor.
3. The assistant briefs the advisor on the client and answers voice follow-up questions.
4. During the meeting, the web app listens and silently suggests useful questions, relevant context, and relationship/referral cues.
5. After the meeting, the assistant generates follow-up actions and updates the client's memory graph.

The core promise is: advisors should not need to manually remember every personal detail, unresolved concern, family relationship, referral opportunity, or promised follow-up across a large client base.

## 2. Problem

Financial advisors often manage dozens of active client relationships. At the expected sponsor scale, around 800 advisors may serve 50,000+ clients, or roughly 67 clients per advisor. Even good advisors struggle to retain the full context of each relationship:

- What did we discuss last time?
- What did the client care about emotionally?
- What promises did I make?
- What family, business, or friend relationships matter?
- Which concerns remain unresolved?
- Who might need a referral or introduction?
- What should I ask next to move the relationship forward?

Existing CRMs are usually passive. They store notes, but the advisor must remember to search, read, and act. The demo should show an assistant that proactively retrieves context, turns it into useful briefing/suggestion/action surfaces, and saves new memory back into a graph.

## 3. Target Users

### Primary User

Financial advisor or consultant with many client relationships.

Needs:
- Quick client briefing before a meeting.
- Natural Q&A instead of digging through CRM notes.
- Quiet prompts during live meetings without interrupting the human conversation.
- Reliable follow-up capture after the meeting.
- Relationship/referral graph visibility.

### Demo Persona

Advisor: Sarah Lim  
Client: Mr. Tan Wee Seng  
Specialists/referral contacts: Evelyn Ng, Marcus Lee  
Relevant family/contact nodes: Jia En, Mdm. Lim

## 4. Product Principles

1. Advisor stays in control.
   - The AI advises the advisor. It does not talk to the client or contact the client without explicit advisor approval.

2. Voice first before the meeting, silent during the meeting.
   - Pre-meeting flow can speak and answer questions.
   - Live meeting flow should display silent suggestions on screen.

3. Memory should be structured, not just summarized text.
   - Important facts become graph nodes/edges where possible: life events, concerns, promises, relationships, referrals, objectives, meetings, actions.

4. Demo should prove the workflow, not every production integration.
   - Use seeded calendar data first.
   - Use a web-based voice POC first.
   - Add Google Calendar, Vapi, Telegram, OpenClaw, and WhatsApp in later phases.

5. Keep the client interaction human.
   - The client only speaks to the advisor.
   - The product supports the advisor in the background.

## 5. Goals

### MVP Goals

- Show a complete pre-meeting, live-meeting, and post-meeting journey for one advisor and one client.
- Use Neo4j as the memory layer/source of truth.
- Use OpenAI Realtime for voice interaction in the pre-meeting experience.
- Use the web app as the portable interface for both phone and laptop usage.
- Display relevant client context as cards, tables, graph, timeline, or bullet lists depending on the content.
- During a meeting, capture useful details and show silent suggested questions/context.
- After a meeting, generate actions and memory updates that the advisor can review.
- Include referral/network graph capture and visualization.

### Pitch Goals

The demo should make judges/sponsors believe:

- This solves a real workflow pain for advisors with many clients.
- The product is more than a chatbot because it has persistent relationship memory.
- Neo4j is justified because client memory is naturally graph-shaped.
- The assistant can improve recall, follow-through, trust, and referral opportunities.

## 6. Non-Goals For Hackathon MVP

- Production-grade compliance, retention, audit, or consent management.
- Full Google Calendar integration.
- Full WhatsApp integration.
- Full Telegram/OpenClaw automation.
- Real outbound phone call via Vapi.
- Robust speaker diarization.
- Multi-advisor enterprise permissions.
- Fully automated client messaging.
- Financial advice generation or portfolio recommendations.
- Replacing CRM systems.

## 7. Scope By Prototype Level

### L1: Pre-Meeting Voice Briefing

Build a web page that simulates an incoming advisor call before an upcoming meeting.

Requirements:
- Show seeded upcoming meeting for Sarah and Mr. Tan.
- Advisor can start/join the pre-meeting briefing.
- App pre-fetches Mr. Tan context from Neo4j.
- Assistant speaks a concise briefing:
  - who the advisor is meeting
  - when the meeting is
  - how long since the last meeting
  - last discussed topics
  - unresolved concerns
  - important personal/family updates
  - suggested opening line
  - suggested questions
- Advisor can ask natural voice follow-up questions.
- Assistant answers using fetched client memory.

Demo example:
- "You are meeting Mr. Tan Wee Seng at 10:30. You last met on 2026-04-08, about 10 weeks ago. Last time, he was still undecided about updating his will and seemed hesitant about renewing his policy. His daughter Jia En recently got into NUS, so open by congratulating him before moving into estate planning."

### L1.5: Context Visualization

Add a visual output area in the same web interface.

Requirements:
- Display retrieved data in the best useful format:
  - client context card
  - timeline of last interactions
  - open concerns/promises table
  - relationship graph
  - referral candidates
  - suggested talking points
- When the advisor asks a voice question, update the visual panel if the answer has structured data.

Example advisor question:
- "Who should I introduce Mr. Tan to?"

Expected visual:
- Relationship graph showing Mr. Tan, Jia En, spouse, Evelyn Ng, Marcus Lee.
- Recommendation card explaining why Evelyn Ng or Marcus Lee is relevant.

### L2: Live Meeting Companion

Build a web page the advisor can keep open during an in-person or online meeting.

Requirements:
- Capture meeting audio through the browser.
- Show live transcript or lightweight event stream.
- Display silent suggestions on screen, not spoken aloud.
- Fetch relevant client memory when the conversation touches known topics.
- Suggest better questions based on:
  - open concerns
  - known objectives
  - relationship gaps
  - promises from prior meetings
  - referral opportunities
- Capture new useful memory:
  - life events
  - emotional cues
  - unresolved concerns
  - stated goals
  - promises made by the advisor
  - family/friend/business mentions
  - referral opportunities
- Save proposed memory updates for review or directly into Neo4j depending on demo flow.

Explicitly not required for MVP:
- Accurate diarization.
- Perfect distinction between advisor and client.
- Full automatic meeting minutes.

Recommended MVP behavior:
- Treat live audio as a single conversation stream.
- Extract candidate facts with confidence and source transcript snippets.
- Display the candidate facts as "captured memory" cards.
- Let the advisor approve or ignore them.

### L3: Telegram/OpenClaw Advisor Q&A

Integrate a messaging interface after the web demo works.

Requirements:
- At minimum, use Telegram as the first external chat surface.
- Advisor can ask questions about clients from Telegram.
- Bot answers from Neo4j memory.
- Keep responses short and grounded in known client memory.

Example:
- Advisor: "What should I know before meeting Mr. Tan?"
- Bot: returns compact pre-meeting brief.

### L3.1: Passive Chat Profiling Via OpenClaw

Use OpenClaw to read allowlisted advisor-client chats and update memory.

Requirements:
- Only ingest chats from explicitly allowlisted contacts/numbers.
- Extract useful memory from messages:
  - important life events
  - unresolved concerns
  - follow-up promises
  - referral or introduction opportunities
  - contact preferences
- Save extracted items with evidence, source, timestamp, and confidence.

### L3.2: Automated Follow-Up Drafting Via OpenClaw

Generate follow-up drafts for advisor approval.

Requirements:
- Draft follow-up messages after meetings or chats.
- Advisor must approve before sending.
- System should explain why the follow-up is recommended.

### L4: Real Pre-Meeting Phone Calls

Use Vapi or similar service for real outbound phone calls.

Requirements:
- Assistant calls the advisor before upcoming meetings.
- Advisor can receive briefing and ask questions over phone.
- Call still uses Neo4j-backed memory.
- Call is only for the advisor, never the client.

### L5: WhatsApp Integration

Add WhatsApp via OpenClaw when available.

Requirements:
- Allowlisted WhatsApp contacts only.
- Passive profiling from chats.
- Advisor-approved follow-up drafts.
- Respect client privacy and consent requirements.

## 8. Demo Narrative

The demo should follow this story:

1. Sarah starts her day.
   - She sees a seeded calendar item: "10:30 AM - Mr. Tan Wee Seng review meeting."

2. Advisors' Advisor briefs Sarah by voice.
   - Simple incoming-call UI or "Start briefing" state.
   - Assistant says what matters before Sarah meets Mr. Tan.

3. Sarah asks follow-up questions naturally.
   - "What did we discuss last time?"
   - "What should I open with?"
   - "Who can help with estate planning?"

4. The app shows visual context.
   - Client card.
   - Timeline.
   - Open concerns.
   - Relationship/referral graph.

5. Sarah starts the live meeting companion.
   - The app listens in the background.
   - Suggestions appear silently.

6. Mr. Tan mentions relevant new information.
   - Daughter milestone.
   - Will planning gap.
   - Need for lawyer or estate planner.
   - Family/friend/business contact who may need help.

7. The app captures memory and suggests questions.
   - "Congratulate Jia En before moving into planning."
   - "Ask what has made the will update hard to complete."
   - "Offer a warm introduction to Evelyn Ng."
   - "Capture referral opportunity: Marcus Lee/legal support."

8. After the meeting, the app creates actions.
   - Send estate planning guide.
   - Create reminder.
   - Draft intro to Evelyn Ng.
   - Log unresolved concern.
   - Update relationship graph.

9. Sarah reviews and approves.
   - Nothing is sent to the client automatically unless Sarah approves.

## 9. User Stories

### Pre-Meeting

As an advisor, I want the assistant to brief me before a meeting so I can enter the conversation already remembering the client's context.

Acceptance criteria:
- Given an upcoming seeded meeting, the app can generate a voice briefing.
- The briefing includes at least 4 client-specific facts from Neo4j.
- The briefing includes at least 2 suggested questions or openers.
- The advisor can ask at least 2 follow-up questions by voice.
- The assistant answers from known client memory.

### During Meeting

As an advisor, I want silent suggestions during the meeting so I can ask better questions without interrupting the client experience.

Acceptance criteria:
- The app captures meeting audio through the web app.
- The app shows text suggestions without speaking aloud.
- The suggestions are tied to live conversation content or existing memory.
- The app shows relevant historical context when triggered by the conversation.
- The app captures at least 3 candidate memory updates.

### Post-Meeting

As an advisor, I want the assistant to produce follow-ups and memory updates so I do not forget what I promised.

Acceptance criteria:
- The app generates a meeting summary.
- The app proposes follow-up actions.
- The app proposes memory updates with categories and evidence.
- The advisor can approve/ignore proposed updates.
- Approved updates appear in the client profile/graph.

### Referral Tracking

As an advisor, I want relationship/referral opportunities captured so I can make useful introductions and grow my network.

Acceptance criteria:
- The app identifies mentioned family/friends/business contacts.
- The app can represent them in the relationship graph.
- The app can mark a referral opportunity or warm introduction.
- The app can show why a recommended specialist is relevant.

## 10. Functional Requirements

### Calendar And Demo Data

FR-001: The app must provide seeded demo calendar data.  
FR-002: The app must show at least one upcoming meeting.  
FR-003: The meeting must link to a client profile in Neo4j.  
FR-004: Google Calendar integration must be designed as a later replaceable data source, not required in MVP.

### Client Memory Retrieval

FR-010: The app must retrieve client context from Neo4j by client ID.  
FR-011: The app must retrieve recent meetings/interactions.  
FR-012: The app must retrieve open concerns, promises, objectives, and life events.  
FR-013: The app must retrieve relationship/referral graph context.  
FR-014: Retrieval results must include timestamps where available.

### Pre-Meeting Voice

FR-020: The app must create a realtime voice session from the browser.  
FR-021: The browser must request a short-lived/ephemeral Realtime credential from the backend.  
FR-022: The assistant must receive pre-fetched client context before briefing.  
FR-023: The assistant must speak a concise briefing.  
FR-024: The advisor must be able to interrupt or ask follow-up questions.  
FR-025: The app must display a text transcript or summary of the briefing.

### Visual Context

FR-030: The app must display a client context panel.  
FR-031: The app must display open items/actions.  
FR-032: The app must display relationship graph data.  
FR-033: The app must update visuals when a voice answer contains structured data.

### Live Meeting Companion

FR-040: The app must start and stop live meeting capture.  
FR-041: The app must process live meeting transcript/audio events.  
FR-042: The app must show silent suggestions on screen.  
FR-043: The app must show relevant memory/context cards when triggered.  
FR-044: The app must extract candidate memory updates.  
FR-045: The app must not speak during the live meeting mode unless the advisor explicitly switches modes.

### Memory Extraction

FR-050: The app must classify candidate memory updates into categories:
- Life Event
- Emotional Cue
- Unresolved Concern
- Goal/Objective
- Promise/Commitment
- Relationship Mention
- Referral Opportunity
- Follow-Up Action

FR-051: Each candidate memory update must include:
- client ID
- category
- summary
- source transcript snippet or source event
- timestamp
- confidence
- proposed graph mutation

FR-052: The advisor must be able to approve, edit, or ignore candidate updates.

### Post-Meeting Actions

FR-060: The app must generate a meeting summary.  
FR-061: The app must generate follow-up actions.  
FR-062: The app must identify promises made during the meeting.  
FR-063: The app must draft advisor-approved follow-up messages or introductions.  
FR-064: The app must not send messages automatically in MVP.

### Graph Visualization

FR-070: The app must show the client relationship graph.  
FR-071: The graph must include client, family, specialists, and referral contacts.  
FR-072: The graph must show edge labels or relationship types.  
FR-073: The graph must allow selecting a node to view supporting context.

## 11. Non-Functional Requirements

NFR-001: The demo should run locally with seeded data.  
NFR-002: The UI should work on laptop and mobile browser widths.  
NFR-003: Pre-meeting voice should feel responsive enough for a live demo.  
NFR-004: Live suggestions should appear quickly enough to feel realtime, even if backed by a simplified pipeline.  
NFR-005: Demo data must be synthetic and should not contain real client PII.  
NFR-006: Failed realtime connection should degrade to typed chat or scripted demo mode if possible.  
NFR-007: The advisor should always be able to review AI-generated memory/actions before client-facing follow-up.

## 12. Recommended Technical Architecture

### Frontend

Framework:
- Next.js
- React
- TypeScript
- Tailwind CSS

Implementation direction:
- Use Next.js App Router for pages, layouts, route handlers, and server-side data access where useful.
- Use Tailwind CSS as the primary styling system for responsive layouts, component states, and demo polish.
- Keep UI components local and lightweight for the hackathon MVP; introduce a component library only if it speeds delivery without increasing setup risk.

Key pages:
- `/` or `/dashboard`: advisor day view and upcoming meetings
- `/briefing/[meetingId]`: pre-meeting voice briefing and Q&A
- `/meeting/[meetingId]`: live meeting companion
- `/client/[clientId]`: client profile, memory, timeline, graph
- `/post-meeting/[meetingId]`: summary, action review, memory update review

UI components:
- Calendar/agenda list
- Incoming briefing call panel
- Voice session controls
- Client context card
- Timeline
- Open items table
- Silent suggestion feed
- Captured memory review cards
- Relationship graph
- Post-meeting action board

### Backend

Recommended route responsibilities:
- `POST /api/realtime/token`
  - Server creates an ephemeral OpenAI Realtime session for the browser.
- `GET /api/demo/calendar`
  - Returns seeded demo meetings.
- `GET /api/clients/:clientId/context`
  - Returns Neo4j-backed client context for briefing.
- `GET /api/clients/:clientId/graph`
  - Returns nodes/edges for visualization.
- `POST /api/meetings/:meetingId/events`
  - Accepts transcript/events from live meeting mode.
- `POST /api/meetings/:meetingId/extract`
  - Extracts candidate memories/actions from transcript.
- `POST /api/memory/approve`
  - Writes approved memory updates to Neo4j.
- `POST /api/actions/approve`
  - Marks action/follow-up as accepted, completed, or saved.

### AI Layer

Pre-meeting mode:
- Use OpenAI Realtime via browser WebRTC.
- Backend mints ephemeral session credentials.
- Assistant receives pre-fetched client context and produces spoken responses.
- Assistant can answer advisor Q&A from the context bundle.

Live meeting mode:
- Use realtime audio/transcript capture.
- Use browser microphone capture, buffered audio chunks, silence skipping, a transcription endpoint, and transcript-driven analysis.
- Prefer text/silent outputs.
- Use extraction prompts or structured output calls to create candidate memory/action records.
- Keep human-in-the-loop approval for updates and follow-ups.

### Memory Layer

Use Neo4j as the source of truth for demo memory.

Live meeting memory behavior:
- Query Neo4j for additional client memory when building live context.
- Save approved captured memories/actions to Neo4j after advisor review.
- Store proposed graph mutations as auditable metadata first; do not execute arbitrary AI-generated Cypher without validation.

Optional later additions:
- Vector indexes in Neo4j for semantic memory retrieval.
- Separate object storage for raw transcripts/audio.
- Mem0 only if teammate feedback requires a higher-level memory abstraction; current default is Neo4j.

## 13. Neo4j Data Model

### Core Node Labels

- `Advisor`
- `Client`
- `Meeting`
- `Memory`
- `LifeEvent`
- `Concern`
- `Objective`
- `Promise`
- `Action`
- `Person`
- `Specialist`
- `ReferralOpportunity`
- `Interaction`

### Core Relationships

- `(Advisor)-[:MANAGES]->(Client)`
- `(Client)-[:HAS_MEETING]->(Meeting)`
- `(Meeting)-[:PRODUCED]->(Memory)`
- `(Client)-[:HAS_MEMORY]->(Memory)`
- `(Client)-[:HAS_LIFE_EVENT]->(LifeEvent)`
- `(Client)-[:HAS_CONCERN]->(Concern)`
- `(Client)-[:HAS_OBJECTIVE]->(Objective)`
- `(Client)-[:HAS_PROMISE]->(Promise)`
- `(Client)-[:HAS_ACTION]->(Action)`
- `(Client)-[:RELATED_TO {relationship}]->(Person)`
- `(Client)-[:HAS_REFERRAL_OPPORTUNITY]->(ReferralOpportunity)`
- `(ReferralOpportunity)-[:INVOLVES]->(Person)`
- `(ReferralOpportunity)-[:MATCHES_SPECIALIST]->(Specialist)`
- `(Action)-[:FOLLOWS_FROM]->(Meeting)`

### Important Properties

Common properties:
- `id`
- `title`
- `summary`
- `createdAt`
- `updatedAt`
- `source`
- `sourceSnippet`
- `confidence`
- `status`

Meeting properties:
- `startsAt`
- `endedAt`
- `type`
- `location`
- `objective`

Memory properties:
- `category`
- `salience`
- `validFrom`
- `lastConfirmedAt`

Action properties:
- `actionType`
- `dueAt`
- `owner`
- `status`
- `draftText`

ReferralOpportunity properties:
- `need`
- `reason`
- `urgency`
- `status`

## 14. Seed Demo Data

### Advisor

Name: Sarah Lim  
Firm: Peak Wealth Advisors

### Client

Name: Mr. Tan Wee Seng  
Client type: Family client  
Risk profile: Moderate  
Relationship since: 2017

### Upcoming Meeting

Date: 2026-06-20  
Time: 10:30 AM  
Purpose: Review protection, estate planning, and family updates

### Last Meeting

Date: 2026-04-08  
Key notes:
- Discussed estate planning.
- Will update was unresolved.
- Mr. Tan seemed hesitant about policy renewal.
- Sarah promised to send an estate planning guide.
- Mr. Tan asked whether Sarah knew a good lawyer.

### Known Memory

Life events:
- Jia En, Mr. Tan's daughter, got into NUS.

Concerns:
- Will planning is unresolved.
- Hesitant about policy renewal.
- Wants family transition to feel smooth.

Promises/actions:
- Send estate planning guide.
- Follow up on will planning.
- Consider introduction to estate planner/lawyer.

Relationship/referral graph:
- Mdm. Lim: spouse
- Jia En: daughter
- Evelyn Ng: estate planner, trusted specialist
- Marcus Lee: lawyer, in network

## 15. UX Requirements

UI implementation:
- Build responsive screens with Tailwind utility classes and shared React components.
- Prioritize clear, dense advisor workflow surfaces over marketing-style pages.
- Use consistent status states for briefing, listening, captured memory, pending approval, approved, and ignored.
- Ensure laptop and mobile layouts preserve the same core workflow: dashboard, briefing, meeting companion, and review.

### Dashboard

Purpose:
- Show Sarah what is happening today.

Must show:
- Upcoming meeting card.
- Client name.
- Meeting time.
- Briefing status.
- Button to start briefing.

### Pre-Meeting Briefing Page

Purpose:
- Replace CRM digging with voice briefing and Q&A.

Must show:
- Simple call/voice interface.
- Current client and meeting.
- Transcript or briefing summary.
- Client context panel.
- Suggested questions.
- Relationship/referral panel when relevant.

### Live Meeting Companion Page

Purpose:
- Listen during the meeting and support Sarah silently.

Must show:
- Start/stop meeting capture.
- Compact suggestion feed.
- Relevant memory cards.
- Captured memory candidates.
- Clear "silent mode" behavior.

### Post-Meeting Review Page

Purpose:
- Convert meeting into follow-through.

Must show:
- Meeting summary.
- Proposed actions.
- Proposed memory updates.
- Referral/introduction drafts.
- Approve/edit/ignore controls.
- Updated graph preview.

## 16. Demo Acceptance Criteria

The demo is successful if the presenter can complete this flow in under 5 minutes:

1. Open dashboard and show upcoming Mr. Tan meeting.
2. Start pre-meeting briefing.
3. Hear a spoken briefing with specific client context.
4. Ask a voice follow-up question and receive a grounded answer.
5. Show visual client context and relationship graph.
6. Start live meeting companion.
7. Simulate a few meeting statements.
8. See silent suggestions and relevant memory cards appear.
9. See candidate memory/referral updates generated.
10. End meeting and review follow-up actions.
11. Approve at least one action and one memory update.
12. Show updated client memory/graph.

Minimum demo content:
- 1 advisor
- 1 client
- 1 upcoming meeting
- 1 previous meeting
- 5+ memory items
- 2+ relationship nodes
- 1+ referral opportunity
- 3+ post-meeting actions

## 17. Risks And Mitigations

### Realtime Voice Reliability

Risk:
- Voice session may fail during demo.

Mitigation:
- Provide typed chat fallback.
- Provide scripted demo transcript fallback.
- Keep pre-fetched context visible even if voice fails.

### Scope Creep

Risk:
- External integrations consume all build time.

Mitigation:
- Prioritize seeded calendar, web voice, Neo4j, and demo story first.
- Treat Telegram/OpenClaw/Vapi/WhatsApp as later levels.

### Privacy And Consent

Risk:
- Meeting capture and passive chat profiling have consent/compliance implications.

Mitigation:
- Use synthetic demo data.
- Add visible consent/disclaimer language for demo.
- Keep advisor approval before memory/action writebacks.
- Do not contact clients automatically.

### Hallucinated Client Facts

Risk:
- Assistant may invent details not in memory.

Mitigation:
- Pre-fetch context.
- Prompt assistant to answer only from provided client memory.
- Show source snippets/timestamps.
- Prefer "I do not have that in memory" when unsupported.

### Graph Complexity

Risk:
- Over-modeling slows MVP.

Mitigation:
- Start with a small graph schema.
- Add generic `Memory` nodes first, then specialized labels for high-value categories.

## 18. Success Metrics

For the hackathon:
- Demo flow completes without manual code changes.
- Advisor can receive and interact with voice briefing.
- Live meeting companion produces useful suggestions.
- Post-meeting flow creates credible actions and memory updates.
- Relationship/referral graph is visible and understandable.

For future product validation:
- Reduction in time spent preparing for meetings.
- Increase in completed follow-ups.
- Increase in captured client life events and concerns.
- Increase in successful warm introductions/referrals.
- Advisor-reported confidence before meetings.
- Client-reported feeling of being remembered and understood.

## 19. Implementation Priority

### Must Build First

1. Seed Neo4j data for Sarah/Mr. Tan.
2. Dashboard with seeded upcoming meeting.
3. Client context retrieval API.
4. Pre-meeting briefing page.
5. Realtime voice session for briefing/Q&A.
6. Client context visual cards.
7. Relationship graph display.

### Must Build Second

1. Live meeting companion page.
2. Transcript/event stream.
3. Silent suggestion feed.
4. Candidate memory extraction.
5. Post-meeting review page.
6. Approved memory update writeback.

### Build If Time Allows

1. Telegram Q&A.
2. More polished graph exploration.
3. Google Calendar integration.
4. Vapi outbound advisor call.
5. OpenClaw passive chat import.
6. WhatsApp support.

## 20. Open Questions

1. Should candidate memory updates be auto-saved for demo speed, or require explicit advisor approval?
2. Should the live meeting transcript be visible, or should the UI only show suggestions and captured memory?
3. Does the hackathon judging criteria reward a real external integration more than a complete end-to-end product story?
4. Does the teammate prefer pure Neo4j memory, or a hybrid Neo4j plus higher-level memory library?
5. What minimum privacy/consent wording is acceptable for the demo?

## 21. Definition Of Done For MVP

The MVP is done when:

- A user can run the app locally.
- Seed data exists for Sarah and Mr. Tan.
- The dashboard shows the upcoming meeting.
- The pre-meeting voice briefing works or has a reliable fallback.
- Advisor Q&A returns grounded answers from client memory.
- Visual context appears in the app.
- Live meeting companion can show silent suggestions.
- Candidate memory/referral updates can be generated.
- Post-meeting actions can be reviewed.
- Approved updates are reflected in the client memory/graph.

## 22. References

- OpenAI Realtime WebRTC guide: https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI Realtime conversations guide: https://developers.openai.com/api/docs/guides/realtime-conversations
- Neo4j vector indexes: https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/

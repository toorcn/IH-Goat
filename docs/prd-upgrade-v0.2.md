# Product Requirements Document: Upgrade v0.2

Version: 0.2  
Date: 2026-06-20  
Status: Proposed next upgrade on `upgrade` branch  
Primary goal: Make Advisors' Advisor feel like a 5-minute advisor memory operating system demo that judges can understand immediately.

## 1. Summary

The v0.1 MVP proves the core technical flow: pre-meeting briefing, live-meeting support, post-meeting review, and a client knowledge graph. The next upgrade should not add more backend surface area first. It should make the existing product feel intentional, legible, and narratively strong.

The upgrade theme is:

> Advisors' Advisor as a 5-minute advisor memory operating system demo.

The demo should communicate one simple idea: Sarah does not need to remember every client detail manually because the product retrieves, speaks, suggests, captures, reviews, and visualizes client memory across the full advisor workflow.

## 2. Audience

Primary audience:

- Hackathon judges who need to understand the product quickly.
- Sponsors or operators evaluating whether this solves a real advisor workflow pain.
- Internal contributors deciding what to polish next on the `upgrade` branch.

Secondary audience:

- Future implementers of graph storage, external chat, calls, and messaging integrations.

## 3. Current State Baseline

The current `upgrade` branch already includes:

- Dashboard and seeded Sarah / Mr. Tan demo context.
- L1 pre-meeting Realtime briefing with typed fallback.
- L1.5 visual outputs and relationship knowledge graph surface.
- L2 live meeting companion with transcript events, silent suggestions, triggered memories, and candidate memory capture.
- Post-meeting review with actions and memory updates.
- API contracts for memory proposals, memory commit, and action creation.

The v0.2 PRD assumes these surfaces exist and should be made easier to present, not replaced.

## 4. Product Principles For v0.2

1. The first screen should tell the story.
   - A judge should know where to click next without the presenter explaining the app structure.

2. Every page needs one obvious proof moment.
   - The product should not just show data; it should prove a workflow advantage.

3. The knowledge graph is a handoff surface.
   - Graph data, storage, allocation, and schema ownership are outside this v0.2 branch unless supplied externally.
   - The app consumes graph nodes and edges, visualizes them, and uses them to explain advisor memory.

4. Reliability beats fragile magic.
   - Missing OpenAI, Neo4j, or microphone permission should still leave a clean scripted demo path.

5. External integrations stay parked.
   - Vapi, OpenClaw, Telegram, and WhatsApp remain roadmap-only until the web demo is undeniable.

## 5. Demo Command Center

The dashboard should become the command center for the judge demo.

Requirements:

- Show the demo sequence as a clear flow: Briefing -> Live Meeting -> Review -> Client KG.
- Each step should have a direct action button and a one-line explanation of what it proves.
- Show demo readiness status for:
  - Realtime voice or typed fallback.
  - Memory source status.
  - Meeting companion readiness.
  - Review queue readiness.
  - Knowledge graph readiness.
- Provide a "start demo" path that begins with the Mr. Tan briefing.
- Keep the interface dense and work-focused, not a landing page.

Success criteria:

- A judge can start the correct flow without reading documentation.
- The presenter can use the dashboard as the opening frame of the pitch.
- The dashboard makes the product look like an advisor workflow system, not disconnected pages.

## 6. Five-Minute Judge Narrative

Target demo length: 5 minutes.

### 0:00-0:30 - Open Dashboard

Presenter action:

- Open the dashboard.
- Point to the Mr. Tan meeting and demo sequence.

Expected output:

- Sarah has an upcoming review meeting.
- The app shows the demo path and system readiness.

What this proves:

- The product starts from the advisor's day, not from a chatbot prompt.

### 0:30-1:30 - Pre-Meeting Briefing

Presenter action:

- Open the briefing page.
- Start Realtime or typed demo fallback.
- Ask: "Who should I introduce Mr. Tan to?"

Expected output:

- The assistant gives a grounded answer based on known client memory.
- Visual output switches to relevant referral or graph context.

What this proves:

- Client memory can be spoken, queried, and visualized before the meeting.

### 1:30-2:45 - Live Meeting Companion

Presenter action:

- Open live meeting companion.
- Simulate meeting statements.

Expected output:

- Silent suggestions appear.
- Triggered memories appear when the transcript touches known topics.
- Captured memory cards include facts, concerns, relationships, referrals, evidence, confidence, and proposed graph impact.

What this proves:

- The product listens without interrupting and turns conversation into advisor memory.

### 2:45-3:45 - Review And Approve

Presenter action:

- Open post-meeting review.
- Approve at least one action and one memory update.

Expected output:

- Follow-ups and memory updates remain pending until Sarah approves.
- The review queue shows evidence and recommended action.

What this proves:

- The advisor stays in control; the AI does not message clients automatically.

### 3:45-5:00 - Client Knowledge Graph

Presenter action:

- Open client profile or graph.
- Zoom, pan, and select a node.
- Show referral path or family context.

Expected output:

- Interactive KG shows client, family, specialists, concerns, promises, actions, and referral opportunities.
- Selecting a node shows connected evidence.

What this proves:

- The product is persistent relationship memory, not just meeting notes.

## 7. Judge-Facing Proof Moments

The next upgrade should make these proof moments obvious:

1. Grounded voice Q&A
   - Sarah asks a question and receives an answer that clearly depends on client memory.

2. Dynamic visual display
   - The UI chooses a useful display mode such as graph, table, chart, or bullets based on the question.

3. Live memory retrieval
   - The meeting companion surfaces relevant old context when the live transcript mentions a related topic.

4. Referral capture
   - A family, friend, business contact, or specialist mention becomes a candidate relationship or referral update.

5. Interactive KG exploration
   - The graph can be zoomed, panned, and selected to show relationship evidence.

## 8. Surface Success Criteria

### Dashboard / Command Center

Must show:

- Today meeting context.
- Demo sequence.
- Direct entry points into briefing, meeting, review, and client KG.
- Readiness status for fallback modes.

Success criteria:

- It can open the pitch by itself.
- It does not require the presenter to explain page navigation.

### Briefing Page

Must show:

- Voice or typed briefing controls.
- Suggested follow-up questions.
- Current client context.
- Visual output that changes when a structured answer is useful.

Success criteria:

- A judge sees the assistant answer from memory, not generic advice.
- Unknown information is handled honestly.

### Live Meeting Page

Must show:

- Start/stop capture.
- Event stream or transcript.
- Silent suggestions.
- Triggered memory cards.
- Captured memory proposals.

Success criteria:

- The page never speaks to the client.
- It captures at least three useful candidate updates during the scripted demo.

### Post-Meeting Review Page

Must show:

- Meeting summary.
- Follow-up actions.
- Candidate memory updates.
- Evidence snippets.
- Approve and ignore controls.

Success criteria:

- Nothing client-facing is sent automatically.
- The advisor can approve at least one action and one memory update.

### Client KG Page

Must show:

- Interactive KG canvas.
- Zoom, pan, fit, node selection.
- Client, family, specialist, referral, concern, promise, action, and meeting nodes when provided.
- Connected evidence for selected nodes.

Success criteria:

- The graph is readable on desktop and contained on mobile.
- Graph data allocation and schema design are not owned by this v0.2 branch.

## 9. Reliability Layer

The demo must remain presentable under common failure modes.

### No OpenAI API Key

Expected behavior:

- Realtime voice falls back to grounded typed Q&A.
- The demo still shows briefing transcript, suggested questions, visual output, and client context.

### Microphone Permission Denied

Expected behavior:

- The presenter can use typed questions or simulated transcript statements.
- The UI should explain that voice capture is unavailable without derailing the demo.

### No Neo4j Configuration

Expected behavior:

- The app uses deterministic seeded demo data.
- The UI may identify fallback status, but should not make the demo feel broken.

### Demo Reset Needed

Expected behavior:

- The presenter can reload and repeat the scripted flow.
- Simulated meeting statements recreate useful suggestions and captured memory.

## 10. KG Handoff Boundary

The knowledge graph boundary is explicit:

- In scope for this branch:
  - Display graph nodes and edges supplied by the app or external graph source.
  - Let users zoom, pan, fit, select nodes, and inspect connected evidence.
  - Explain why a relationship or referral path matters to the advisor.

- Out of scope for this branch:
  - Neo4j allocation.
  - Graph schema redesign.
  - Data modeling ownership.
  - Production graph migrations.
  - Automatic graph layout beyond a presentable demo canvas.

Owner-managed graph data can be added later without changing the product story. The v0.2 app should be ready to consume and present it.

## 11. What Not To Build Next

Do not spend the next upgrade on:

- Vapi outbound calls.
- OpenClaw integration.
- Telegram bot Q&A.
- WhatsApp ingestion.
- New Neo4j schema or allocation work.
- Production compliance systems.
- Automatic client messaging.
- A marketing landing page.

These are roadmap items. The next highest-value work is making the web demo impossible to misunderstand.

## 12. Acceptance Criteria

The v0.2 PRD is satisfied when:

- A complete 5-minute demo path is documented.
- The PRD identifies at least five judge-facing proof moments.
- Each existing surface has success criteria.
- The KG ownership boundary is explicit.
- Reliability fallbacks are documented for OpenAI, microphone, Neo4j, and demo reset.
- L3, L4, and L5 integrations remain roadmap-only.
- The upgrade branch has a clear product direction without requiring backend changes.

## 13. Recommended Next Implementation After This PRD

After this PRD is accepted, the next implementation task should be:

1. Polish the dashboard into a demo command center.
2. Add explicit readiness/fallback status.
3. Tighten each page's proof moment copy and control hierarchy.
4. Add a demo reset or repeatable scripted flow if needed.
5. Re-run the full 5-minute demo against desktop and mobile widths.

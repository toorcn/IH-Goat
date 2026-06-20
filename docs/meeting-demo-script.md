# Meeting Demo Script

Use this script to move back and forth through the demo while showcasing the full Advisors' Advisor loop.

Demo meeting id: `meeting-2026-06-20-tan`

Primary path:

1. `/`
2. `/briefing/meeting-2026-06-20-tan`
3. `/qna/meeting-2026-06-20-tan`
4. `/live/meeting-2026-06-20-tan`
5. `/post-meeting/meeting-2026-06-20-tan`
6. `/client/client-tan`

## 1. Dashboard Opening

Presenter:

"This is Sarah Lim's advisor dashboard. The system has already pulled her next meeting, the client context, the prior meeting, open concerns, relationship graph, and pending follow-ups. The key point is that Sarah does not start from a blank CRM screen. She starts from the next best advisory workflow."

Click `Start briefing`.

If someone asks about reliability:

"The app can run from demo memory, Neo4j memory, or hybrid mode. For demo reliability, the same seeded client journey is available even if external services are unavailable."

## 2. Pre-Meeting Briefing

Presenter:

"Before the meeting, Sarah can get a voice briefing and ask grounded follow-up questions. The assistant is advisor-only and uses only the stored client memory."

Show the briefing summary:

"It remembers that Mr. Tan's daughter Jia En got into NUS, that will planning was unresolved, that he seemed hesitant about policy renewal, and that a specialist introduction may help."

If voice is configured, press the voice briefing control and say:

"What should I open with?"

Expected talking point:

"The assistant should recommend opening with Jia En's NUS milestone, then moving into estate planning."

Then ask:

"What is still unresolved from the last meeting?"

Expected talking point:

"This demonstrates grounded memory retrieval. It should point to will planning, policy renewal hesitation, and the promised estate planning guide."

Click `Open Q&A-only view`.

## 3. Q&A Visual Memory Showcase

Presenter:

"This is the faster judge-facing view. It proves that memory Q&A is not just chat. The answer changes shape based on the question."

Ask these in sequence:

- "Summarize this client."
- "Who is connected to him?"
- "What follow ups are open?"
- "What happened last time?"
- "Who should I introduce?"
- "Does he have a brother?"

Expected talking points:

- Summary becomes cards or a brief answer.
- Relationship questions become a graph.
- Follow-up questions become a table.
- History questions become a timeline.
- Referral questions become a recommendation.
- Unsupported questions become a missing-info response instead of a hallucination.

Click `Open companion`.

## 4. Live Meeting Companion

Presenter:

"During the meeting, the companion listens silently. It never speaks to the client. It separates advisor support from client communication, surfaces prompts only to Sarah, and captures candidate memory for review."

Press `Start`.

Use this live dialogue to trigger the strongest demo signals:

Advisor:

"Hi Mr. Tan, good to see you again. Before we start, congratulations again on Jia En getting into NUS."

Client:

"Thank you. The whole family is excited, but it also made me think more seriously about planning properly."

Advisor:

"Last time you mentioned the will update felt hard to start. Is that still the main blocker?"

Client:

"Yes. I know I should update the will, but I am not sure who to speak to or what documents I need."

Advisor:

"Would a warm introduction to Evelyn Ng help? She focuses on estate planning."

Client:

"Yes, please introduce me. I would also like the simple estate planning guide you mentioned."

Advisor:

"I will send the estate planning guide after this meeting and draft the introduction to Evelyn."

While speaking, point out:

- The caption area shows live transcript.
- The `Ask` panel shows silent suggested follow-up questions.
- The `Relevant` panel can show matching client memory and partner recommendations.
- The `Saved` panel shows captured durable facts.
- `Save to memory` or auto-save demonstrates the write path, with duplicate protection.

If Realtime or mic is unavailable:

"The app still demonstrates the same intelligence path with deterministic demo extraction and the review board. The product boundary is the same: transcript signals become advisor-only prompts, memory candidates, and follow-up actions."

Click `End and review`.

## 5. Post-Meeting Review

Presenter:

"After the meeting, the system does not blindly update records or contact clients. Sarah reviews what was captured."

Show these sections:

- Detected follow-up actions.
- Memory updates.
- Recommended next best actions.
- Relationship memory visual.
- Prepared next interaction.

Click `Approve memory updates`, or approve one memory manually.

Presenter:

"Approval writes to Neo4j when configured. In demo mode, it marks the approval locally and explains that persistent memory is not configured. Either way, nothing client-facing is sent without Sarah."

Open a draft email or calendar reminder if useful:

"These are handoff accelerators. They prepare Sarah's next step; they do not bypass advisor control."

Click `View full memory`.

## 6. Client Memory Page

Presenter:

"This is the durable client memory surface. Sarah can inspect what is known, what is still open, the relationship timeline, the network graph, approved memories, and unresolved work."

Open each tab:

- `Timeline`: proves prior meeting evidence and dated context.
- `Network`: proves graph-shaped relationship memory.
- `Memory`: proves approved or recent durable facts.
- `Open Work`: proves unresolved concerns and follow-ups stay visible.

Closing line:

"The demo proves the complete loop: prepare before the meeting, assist silently during the meeting, extract useful signals, keep the advisor in control, and carry approved memory forward into the next client interaction."

## Quick Back-And-Forth Route

Use this when time is short:

1. Dashboard: "Next meeting is ready."
2. Briefing: "What should Sarah remember?"
3. Q&A: "The same memory renders as cards, graph, table, timeline, recommendation, or missing info."
4. Live companion: "Advisor-only prompts and memory capture during the meeting."
5. Review: "Human approval before writes or follow-up."
6. Client page: "Approved memory becomes durable relationship context."

## One-Minute Version

"Advisors' Advisor is an AI memory operating system for financial advisors. It starts before the meeting by briefing Sarah from graph-shaped client memory. During the meeting, it listens silently, suggests useful advisor-only prompts, surfaces relevant context, and captures durable facts such as Jia En's NUS milestone, unresolved will planning, and the request for an estate planning specialist. Afterward, it prepares follow-ups and memory updates, but Sarah must approve them before anything becomes official. The client page then shows the durable result: timeline evidence, relationship graph, approved memories, and open work ready for the next interaction."

# Example shooting scripts

This is a real-world example: shooting scripts for an 8-video training series. Use it as a template for the structure of your own scripts — each table is the **shot list** + narration for one video, designed to translate mechanically into a `VideoDirector` spec (one row → one `narrate()` / `click()` / `point()` call).

> The product-specific content (247HRM Helpdesk) is illustrative. Replace with your own beats. The format and granularity are the value.

Conventions:
- **V** = visual caption shown on screen
- **A** = audio narration (omit if same as V)
- **Action** = what Playwright does (click / type / point / pause)
- **ms** = how long the caption + action is held
- **Voice** = which speaker (defaults to Amara unless flagged)

Voice plan per video is summarised in [VOICE-CHOICES.md](VOICE-CHOICES.md).

---

## 02 — Triaging your inbox (~80s, Amara primary)

| # | V (caption) | A (TTS override) | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Triaging your inbox. | — | title card on `/tickets` | 3000 | Amara |
| 2 | Six counters at the top show today's pulse. | — | point at the stat strip | 3800 | Amara |
| 3 | Waiting and Pool are where you start. | — | hover Waiting card, then Pool card | 4000 | Amara |
| 4 | Saved views narrow the list to what matters now. | — | point at view chips row | 4200 | Amara |
| 5 | Click "Unassigned" to see the pool. | — | click `Unassigned` chip | 3000 | Amara |
| 6 | Sort by SLA to see what's about to breach. | — | click SLA column header | 3800 | Amara |
| 7 | Now let's pick one up. | — | — | 1800 | **Gaurav** |
| 8 | Click any ticket to open it. | — | click first row | 3500 | Gaurav |
| 9 | Once it's yours, hit Self-assign. | — | point at Self-assign button | 4000 | Gaurav |
| 10 | That's how a ticket lands on your plate. | — | brief pause on the assigned ticket | 3500 | Gaurav |
| 11 | Next video: replying to your customer. | — | fade-out beat | 3000 | Amara |

---

## 03 — Replying to a customer (~95s, Amara explains, Gaurav demos the reply)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Replying to your customer. | — | open a ticket detail | 2800 | Amara |
| 2 | The reply box has two tabs at the top. | — | point at Public Reply / Internal Note tabs | 4200 | Amara |
| 3 | Public Reply emails the customer. | — | hover Public Reply tab | 3500 | Amara |
| 4 | Internal Note is private — only your team sees it. | — | hover Internal Note tab | 4200 | Amara |
| 5 | The toolbar gives you formatting basics. | — | point at editor toolbar | 3500 | Amara |
| 6 | Below: Attach, "Client's input required", and Send. | — | point at footer row | 4500 | Amara |
| 7 | Now I'll write a reply. | — | — | 2200 | **Gaurav** |
| 8 | I'll start with a canned response to save typing. | — | click Canned Response dropdown | 4200 | Gaurav |
| 9 | Pick a template and the editor fills in. | — | click first canned response | 4000 | Gaurav |
| 10 | I can edit the placeholders before sending. | — | type a tweak in the editor | 4200 | Gaurav |
| 11 | At-mention pulls a teammate in. | At-mention pulls a teammate in. | type `@` then a name | 4500 | Gaurav |
| 12 | Tick "Client's input required" if I'm asking for info. | — | tick checkbox | 4500 | Gaurav |
| 13 | That ticks the ticket to Pending and pauses the SLA. | — | point at status pill changing | 4500 | Gaurav |
| 14 | Hit Send — the customer gets the email. | — | click Send | 3500 | Gaurav |
| 15 | Next video: pulling teammates in as watchers. | — | fade out | 3000 | Amara |

---

## 04 — Watchers, CCs, contacts (~75s, Amara explains, Gaurav demos)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Watchers, CCs, and contacts. | — | start on a ticket detail | 3000 | Amara |
| 2 | Three ways to pull people in. | — | point at right-hand panel | 3500 | Amara |
| 3 | Watcher: any active internal user. | — | hover Watchers section | 3800 | Amara |
| 4 | CC participant: an external email address. | — | hover CC section | 3800 | Amara |
| 5 | Contact: someone on the customer's organisation. | — | hover Reporter card | 4200 | Amara |
| 6 | Let me add my manager as a watcher. | — | — | 2500 | **Gaurav** |
| 7 | Click the plus next to Watchers. | — | click `+` on Watchers | 3000 | Gaurav |
| 8 | Search by name or email. | — | type a name | 3500 | Gaurav |
| 9 | Pick — chip is added, picker closes. | — | click suggestion | 4000 | Gaurav |
| 10 | Removing a watcher is one click on the X. | — | hover the X on a chip | 3800 | Gaurav |
| 11 | And to capture a new contact, hit person-add. | — | click person-add icon on Reporter | 4500 | Amara |
| 12 | Fill the form and the contact saves on the client. | — | brief view of the dialog | 4000 | Amara |

---

## 05 — Status & SLA in practice (~85s, Amara explains, Gaurav demos transitions)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Status and SLA in practice. | S L A in practice. | open a ticket | 3000 | Amara |
| 2 | A ticket has one status at a time. | — | point at status pill | 3500 | Amara |
| 3 | Open, In Progress, Investigating, Pending, Resolved. | — | — | 4500 | Amara |
| 4 | Pending pauses the SLA — the rest don't. | S L A | — | 4200 | Amara |
| 5 | First Response and Resolution clocks tick alongside. | — | point at SLA badges | 4500 | Amara |
| 6 | Green is healthy, amber is at risk, red is breached. | — | — | 4200 | Amara |
| 7 | To change status, click "Change Status". | — | — | 3000 | **Gaurav** |
| 8 | Click the button. | — | click Change Status | 2800 | Gaurav |
| 9 | Only legal transitions appear. | — | hover the dialog options | 4000 | Gaurav |
| 10 | I'll move this to Resolved. | — | click Resolved | 3500 | Gaurav |
| 11 | Resolution Note becomes the closure email. | — | type a resolution note | 4500 | Gaurav |
| 12 | Confirm — and the SLA resolution clock stops. | S L A | click Save | 4500 | Gaurav |
| 13 | Customer gets the closure email. | — | brief overview shot | 3500 | Amara |
| 14 | Next: when to escalate to engineering. | — | fade out | 3000 | Amara |

---

## 06 — Escalating to Jira (~90s, Amara explains why, Gaurav narrates the dialog)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Escalating to engineering. | — | start on a ticket | 2800 | Amara |
| 2 | Some tickets aren't fixable in support — they're bugs. | — | — | 4500 | Amara |
| 3 | Hit "Escalate to Jira" to file an issue. | — | point at button | 3800 | Amara |
| 4 | Comments and status will sync both ways. | — | — | 4000 | Amara |
| 5 | Let me show you the form. | — | — | 2500 | **Gaurav** |
| 6 | Click Escalate to Jira. | — | click button | 2800 | Gaurav |
| 7 | Project: AFD for frontend, LFD for backend. | A F D for frontend, L F D for backend. | open Project dropdown | 4500 | Gaurav |
| 8 | Pick the issue type — Bug or Improvement. | — | open type dropdown | 4000 | Gaurav |
| 9 | Most fields pre-fill from the ticket. | — | scroll the form | 4000 | Gaurav |
| 10 | Steps to reproduce, expected vs actual — be specific. | — | point at those fields | 4500 | Gaurav |
| 11 | Submit. | — | click Submit | 2500 | Gaurav |
| 12 | Jira chip appears in the header. | — | point at the new chip | 4000 | Amara |
| 13 | Engineering replies arrive as internal notes. | — | — | 4000 | Amara |
| 14 | When Jira closes, you confirm with the customer. | — | fade out | 4000 | Amara |

---

## 07 — Saved views & automation rules (~70s, Gaurav single host)

Tactical / power-user content. Gaurav handles solo — keeps it brisk.

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Saved views and automation. | — | start on `/tickets` | 3000 | Gaurav |
| 2 | A saved view is a filter combo with a name. | — | apply a filter set | 4500 | Gaurav |
| 3 | Save — name it — share with the role if useful. | — | click Save View | 4200 | Gaurav |
| 4 | Now it's a one-click chip in your toolbar. | — | click the saved chip | 4000 | Gaurav |
| 5 | Automation rules are filters that take action. | — | nav to `/tickets/automation-rules` | 4500 | Gaurav |
| 6 | New rule. Pick an event. | — | click + New Rule | 3500 | Gaurav |
| 7 | Conditions match the ticket; actions modify it. | — | walk through the form | 4500 | Gaurav |
| 8 | Save — rule is live. | — | click Save | 3000 | Gaurav |
| 9 | One pattern: auto-assign Urgent SaaS to the lead. | One pattern: auto-assign Urgent Sass to the lead. | show example rule | 4500 | Gaurav |
| 10 | That's saved views and automation. | — | fade out | 3000 | Gaurav |

---

## 08 — Notification preferences (~65s, Amara solo)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | Notification preferences. | — | open user menu | 2800 | Amara |
| 2 | Click your name top-right, then Notification preferences. | — | click menu item | 4200 | Amara |
| 3 | Each event has Email and In-app toggles. | — | scroll the prefs page | 4500 | Amara |
| 4 | Customer events at the top — keep these on. | — | point at first group | 4200 | Amara |
| 5 | Agent collaboration in the middle. | — | point at second group | 3500 | Amara |
| 6 | SLA and escalation at the bottom — leave on. | S L A and escalation at the bottom — leave on. | point at third group | 4500 | Amara |
| 7 | If your bell is too noisy, mute Public Reply email. | — | toggle one off | 4500 | Amara |
| 8 | If your inbox is too noisy, mute Client Replied email. | — | toggle another | 4500 | Amara |
| 9 | Save — your preferences only affect you. | — | click Save | 3500 | Amara |
| 10 | Per-event control beats inbox filters. | — | fade out | 3500 | Amara |

---

## 09 — The public portal — what your customer sees (~70s, Amara, customer perspective)

| # | V | A | Action | ms | Voice |
|---|---|---|---|---|---|
| 1 | What your customer sees. | — | open `/public/support` in a new context | 3000 | Amara |
| 2 | They visit the support portal. | — | show the email field | 3800 | Amara |
| 3 | Email — Send OTP — verify. Same as agent login. | Email — send O T P — verify. Same as agent login. | quick demo of OTP step | 4500 | Amara |
| 4 | New ticket form: subject, description, priority. | — | walk through fields | 4500 | Amara |
| 5 | Knowledge base suggestions appear inline. | — | point at suggestions | 4200 | Amara |
| 6 | Submit — they get the same auto-acknowledgement. | — | submit (or simulate) | 4500 | Amara |
| 7 | Their ticket list shows status and last update. | — | back to portal home | 4200 | Amara |
| 8 | They reply by email, by portal, or both. | — | — | 3800 | Amara |
| 9 | When you Resolve, they get a five-star CSAT prompt. | — | point at imagined CSAT | 4500 | Amara |
| 10 | That's the customer's view — and the end of the series. | — | fade out | 4200 | Amara |

---

## Production order

I'd shoot in this order:

1. **02, 03, 05, 04** — most-used tactical content. Gets agents productive fastest.
2. **08, 09** — preferences + portal. Lower-frequency but useful day-1.
3. **06, 07** — power-user stuff. Last because it's least urgent.

Each video: ~30-45 minutes to write the spec, record, generate audio, mux. ~7 hours total for v2-v9.

## Total cost estimate

Across v2-v9: ~6500 chars of narration → **~$2 of ElevenLabs credits** at turbo_v2_5 pricing. Trivial.

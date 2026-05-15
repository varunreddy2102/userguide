# 7 — Status & SLA

[← back to index](README.md)

The most important page in the guide. Get this right and the rest of the helpdesk takes care of itself.

---

## The status state machine

A ticket is in exactly one status at a time. The valid transitions are:

```
            (auto, on inbound email or portal submit)
                            ▼
    ┌────────► Open ──────────► InProgress ──────► Investigating
    │                                │                   │
    │                                ▼                   ▼
    └─── Reopened ◄──────────── Resolved ◄───────────────┘
                                     │
                                     ▼
                                  Closed (auto, after 3 idle days)
```

Plus one off-path status:
- **Pending** — set when you're waiting on the customer. **Auto-pauses the SLA clock.**

### What each status means

| Status | Meaning | Visible to customer? | SLA effect |
|---|---|---|---|
| `Open` | Just created, no agent has touched it | yes | First-response clock running |
| `InProgress` | An agent is actively working it | yes | Both clocks running |
| `Investigating` | An agent is digging in (perhaps with engineering) | yes | Both clocks running |
| `Pending` | Waiting on the customer | yes | **Both clocks paused** |
| `Resolved` | Agent believes it's fixed; awaiting customer confirmation | yes | Resolution clock stopped |
| `Closed` | Done. No further action expected. | no (silent transition) | n/a |
| `Reopened` | Customer or agent re-activated a Resolved/Closed ticket | yes | Resolution clock restarted |

> **From Atlassian.** There is **no manual SLA pause/resume button**. The status itself is the switch — moving to `Pending` pauses, moving back resumes. This is intentional: it makes the SLA history reproducible from the status history.

---

## Changing status

Click the **Change Status** button in the ticket toolbar (the status pill itself is read-only). A dialog appears showing only **legal** transitions from the current status (illegal ones are hidden, not greyed out).

> **Shortcut.** If your reply asks the customer for information, tick **Client's input required** in the reply footer instead of opening the dialog. Sending the reply moves the ticket to `Pending` automatically and pauses the SLA — one click instead of three.

For some transitions you'll be prompted for extra detail:

- **Resolved** → asks for a **Resolution Note**. This becomes part of the customer-facing close email.
- **Reopened** → asks for a reason. Goes into the audit log as the reopen justification.
- **Pending** → optionally asks why (free-text); the customer's status-change email will include this verbatim if you provide it.

---

## SLA — the badges

Two badges on every ticket:

| Badge | Counts time until… | Stops at |
|---|---|---|
| **First Response** | Your first public reply lands | The first agent reply |
| **Resolution** | Status hits `Resolved` | Status moves out of all open states |

Each badge is colour-coded:

- 🟢 **Green** — over 50% of the SLA window remaining
- 🟡 **Amber** — under 50% remaining ("at risk")
- 🔴 **Red** — breached. Recorded in `SlaCompliance` reports.

Hover the badge for the absolute deadline timestamp in your timezone.

### Where SLA values come from

Every client is assigned a **Support Plan**. The plan defines:

- First-response target (per priority)
- Resolution target (per priority)
- Business hours / 24×7
- Emergency module exceptions (some modules get 24×7 coverage even on a business-hours plan)

If the customer asks "what's my SLA?", look at **Clients → {their client} → Support Plan tab**, or open `/support-plans/assign`.

---

## Internal escalation

There are two paths — automatic and manual.

**Automatic** — when a ticket is heading for breach without an agent reply, the system escalates by itself, no one pushes a button. The triggers:

| Trigger | Escalates to | Notification |
|---|---|---|
| First-response SLA hits its half-life **and ticket is still unassigned** | Role 5 (Support Manager) + Role 11 (CS Head) + agents with matching `UserClientAccess` (SaaS / OS / MOS scope) | `UnassignedHalfwayEscalation` |
| First-response SLA breaches | Role 5 + Role 11 | `SlaBreachInternal` |
| Resolution SLA breaches | Role 5 + Role 11 | `SlaBreachInternal` |
| Customer marks `Reopened` | Last assignee + watchers | `TicketReopened` |

The notification goes to the bell **and** to email. If you're seeing your bell light up out of nowhere — this is probably why.

**Manual** — the **Escalate Internally** button in the ticket toolbar. Use it when you can already see the ticket is going sideways and you want eyes on it *before* SLA half-life triggers the automatic flow. It dispatches the same role ladder as `UnassignedHalfwayEscalation` (Role 5 + Role 11 + matching UCA scope), with a different notification reason so it's distinguishable in audit.

---

## Customer-facing notifications

What the customer sees, automatically:

| Event | Email subject pattern | Sent because |
|---|---|---|
| Ticket created | `[TKT-{n}] We received your request: {subject}` | Auto-ack; same regardless of source (email vs portal) |
| Status changed (to a customer-visible status) | `[TKT-{n}] Status update: {newStatus}` | The status moved into one of the configured `CustomerVisibleStatuses` (`InProgress`, `Investigating`, `Pending`) |
| Reopened | `[TKT-{n}] Reopened` | An agent re-activated a Resolved/Closed ticket |
| Pending — awaiting customer | (carried by the status-change email above with a "we need input from you" line) | Status moved to `Pending` |
| Resolved | `[TKT-{n}] Resolved` (with the resolution note) | Status moved to `Resolved` |
| Public reply | The reply itself, threaded with previous emails | You hit Send on a non-internal message |

CC participants are CC'd on every one of the above except the very first auto-ack (a known limitation we accept; subsequent replies CC them correctly).

---

## What fires into your notification bell

The bell shows **internal** events targeted at you. The complete list:

- `TicketAssigned` — you became the assignee
- `TicketCreatedInternal` — a new ticket landed for a client you have scope on
- `InternalNoteAdded` — someone left an internal note on a ticket where you're assignee or watcher
- `AgentMentioned` — someone @-mentioned you
- `CommentEdited` / `CommentDeleted` — on a ticket where you're assignee or watcher
- `UnassignedHalfwayEscalation`, `SlaBreachInternal` — see [internal escalation](#internal-escalation)
- `TicketReopened` — on a ticket where you were the last assignee

Click any notification to jump to the ticket. **Mark all as read** clears the badge.

---

## What's next?

- Hand a ticket to engineering → [Jira integration](08-jira-integration.md)
- Automate the boilerplate → [Automation & saved views](10-automation-and-views.md)

# 8 — Jira integration

[← back to index](README.md)

The helpdesk has a deep, two-way link with the engineering Jira instance at `interbiz-jira.atlassian.net`. When you've done your support work and a real bug needs engineering eyes, you escalate. From that point on, comments and status flow both ways automatically.

This is the closest thing in the system to what you used to call a "linked issue" in Atlassian.

---

## When to escalate

Escalate to Jira when **all** of the following are true:

- You've reproduced (or strongly believe in) a defect in the product.
- The fix needs an engineering change — not a config tweak, not training, not a workaround.
- You have enough detail to file a useful Jira issue (steps to reproduce, expected vs actual, affected module).

Don't escalate for:
- General "the app feels slow" feedback (file as Improvement only with concrete data)
- Configuration questions that the customer can self-serve
- Tickets that are still in customer-input stage (`Pending`)

---

## The escalation dialog

Click **Escalate to Jira** in the ticket toolbar. A structured form opens, modelled on the AFD project's bug template.

### Required fields

- **Project** — `AFD` (Angular Fresh Desk, default) or `LFD` (Legacy Fresh Desk). Pick the codebase the bug lives in.
- **Issue Type** — `Bug` or `Improvement`.
- **Summary** — short, search-friendly title. Pre-filled from the ticket subject; tweak as needed.
- **Client** — pre-filled from the ticket; rarely change.
- **Module** — the 22-value list (Payroll, Attendance, Leave, etc.). Pre-fills from the ticket Module if set.
- **HR ID** (employee identifier in the customer system, where applicable)
- **URL** — the page where the bug appears
- **Steps to reproduce** — numbered list
- **Expected behaviour** — one-liner
- **Actual behaviour** — one-liner

### Optional collapsible section

Click "Show optional fields" to add:
- Browser / OS / device
- Frequency (always / sometimes / once)
- Workaround (if any)
- Severity / business impact note
- Attachments (additional, beyond what's already on the ticket)

When you submit, the system:
1. Creates the Jira issue and grabs its key (e.g. `AFD-2987`).
2. Posts the formatted description as the issue body, with the helpdesk ticket ID + client name in the header.
3. Adds a **remote link** to the Jira issue pointing back to the helpdesk ticket — so engineering can click through.
4. Posts an audit-log entry on the helpdesk ticket with the Jira key.
5. Drops a **Jira chip** in the ticket header you can click to jump to the issue.

---

## The Jira status panel

After escalation, a new panel appears in the right column of the ticket detail page:

- **Jira key** (clickable)
- **Summary** (mirrored)
- **Status** (`To Do` / `In Progress` / `In Review` / `Done` / etc.)
- **Assignee** in Jira
- **Priority** in Jira
- A **Refresh** button — pulls the latest from Jira on demand
- A **Resolve helpdesk ticket** button that lights up when the Jira issue hits a Done-equivalent state

You don't have to click Refresh in normal use — Jira webhooks push updates automatically. The button is for when you suspect the webhook missed an event.

---

## Comment sync

Both directions, with author attribution preserved.

### Helpdesk → Jira

When you send a **public reply or internal note** on a ticket that has been escalated, the message also posts as a comment on the linked Jira issue, prefixed with your name:
> *Anita Sharma (via Helpdesk):* "We've confirmed the customer is on Premium plan. Please prioritise."

### Jira → Helpdesk

When an engineer comments on the Jira issue, that comment is mirrored back into the helpdesk ticket as an **internal note** (never public — engineering's wording is rarely customer-ready). Author name from Jira is preserved.

> **Loop prevention.** The system tags comments it originated with `(via Helpdesk)` (and Jira's webhook receives them but discards them on re-ingest). You won't see infinite ping-pong.

---

## Field sync

Several fields sync both ways on changes:

| Field | Helpdesk → Jira | Jira → Helpdesk |
|---|---|---|
| **Priority** | yes (`Urgent` ↔ `Highest`, `High` ↔ `High`, etc.) | yes |
| **Tags / Labels** | yes | yes |
| **Status** | one-way: helpdesk reflects Jira status in the panel | one-way: helpdesk picks up Jira status |
| **Assignee** | no — keeping these independent on purpose | yes — engineering Jira assignee shows in the helpdesk panel and an internal note announces the change |

---

## The `@helpdesk` keyword

If an engineer types `@helpdesk` in a Jira comment, the **escalating agent** (the one who originally clicked Escalate) gets:

- A bell notification: "Engineering needs your attention on TKT-1234"
- An email with a deep link

This is how engineering pings you back when they need a customer detail you haven't already provided.

---

## Closing the loop

When the Jira issue moves to a **resolved** state (Done, Won't Do, Duplicate, etc.):

1. The escalating agent gets a bell + email.
2. The helpdesk Jira panel shows a **Resolve helpdesk ticket** button.
3. Click it to:
   - Move the helpdesk ticket to `Resolved` (with the Jira resolution as the resolution note prefix)
   - Send the standard customer-facing resolution email
4. If the customer is happy, the ticket auto-`Closed`s after 3 idle days as usual.

---

## What's next?

- Understand every email the system sends → [Email notifications](09-email-notifications.md)
- Automate "if priority Urgent then assign me" → [Automation & saved views](10-automation-and-views.md)

# 4 — Anatomy of a ticket

[← back to index](README.md)

A labelled tour of the ticket-detail screen. Skim this once and the rest of the guide will make more sense.

![Ticket detail — top](images/20-ticket-detail.png)

The page has two columns and they scroll independently — pick a customer reply on the left, the right-side fields stay where you put them.

---

## Left column — the conversation

### Header strip

At the very top:
- **Back arrow** (`←`) — returns to your inbox
- **Ticket ID** (`TKT-{n}`) and **Subject**
- **Status pill** — read-only display of the current status (e.g. `Resolved`)
- **Resolution badge** — only when the ticket is `Resolved`; shows the resolution category (e.g. `Resolution: Done`)
- **Change Status** button — opens the [transition dialog](07-status-and-sla.md#changing-status); the only way to move state
- **Escalate to Jira** button — opens the [escalation dialog](08-jira-integration.md)
- **Escalate Internally** button — bumps the ticket up the role ladder manually (in addition to the automatic SLA-driven escalation)
- **Merge** button — opens the merge dialog if you've got a duplicate to fold in

### Conversation thread

Every message in chronological order, **oldest first**. Customer messages on the left, agent messages on the right (visually distinguished). Internal notes are tinted yellow with a 🔒 icon — they are **never** sent to the customer.

Each message shows:
- Sender name + email
- Timestamp in your timezone (hover for absolute, see relative on first display)
- `(edited)` tag with hover-tooltip if the author edited it
- `[deleted]` placeholder if the author deleted it (the body is preserved server-side for forensics)
- ✏️ Edit and 🗑️ Delete buttons on **your own** messages (admins/managers can edit-delete anyone's)
- Attachments inline — click any image to open the preview dialog; click any other file to download

### Reply box

Below the thread. Detailed in [Working a ticket](05-working-tickets.md).

![Ticket detail — reply box and watchers](images/21-ticket-detail-bottom.png)

---

## Right column — the Properties panel

Titled **Properties**. A vertical stack of editable fields. Most have an **edit pencil**; click it, change the value, save inline. No separate "edit ticket" page.

### Reporter card

The customer who filed the ticket. Shows their name, email, and any other contact data on file. Below the email row sits a small **person-add icon** — clicking opens [Add Contact](06-collaboration.md#adding-a-customer-contact) so you can capture a new person right from the ticket.

### Client

The customer organisation. Searchable inline-edit dropdown. Changing this re-anchors the ticket against a different client and recomputes SLA against that client's Support Plan.

> **Heads-up.** Changing the client mid-ticket is rare and audited. If you do it, write an internal note explaining why.

### Assignee

Who owns the ticket. Searchable dropdown of all eligible agents. Empty = unassigned. Use the **Self-assign** button at the top of the panel as a one-click shortcut.

### Ticket Type

Editable dropdown — Bug / Feature Request / Question / Incident / etc. Drives some automation rules.

### Module

The product area, drawn from the same 22-value list as the AFD Jira project. Important when escalating: the value here pre-fills the **Module** field on the Jira issue.

### Priority

Same pill as in the header — duplicated here for convenience.

### Watchers

A chip-list of internal users notified about updates. Detailed in [Collaboration](06-collaboration.md). Each chip has an `×` to remove, and the `+` button opens a searchable user picker.

### CC participants

External email addresses that get CC'd on every customer-facing reply (and, on inbound, on auto-acknowledgement). Adding a known customer contact here is one click.

### SLA badges

The Properties panel ends with a stack of three SLA readouts:
- **SLA Status** — a single pill (`Ok` / `At Risk` / `Breached`)
- **First Response** — `{n}h {m}m remaining (Due: {timestamp})` while pending; flips to a `met` indicator once you reply
- **Resolution** — same shape, against the resolution deadline

See [Status & SLA](07-status-and-sla.md) for what drives the targets.

### Labels

Below the SLA block. A chip list with a count next to the section header (`Labels (2)`). Click `+` to add, click the `×` on a chip to remove. Replaces what Atlassian called *labels* — the name is the same; just be aware the inbox column header also reads **Labels**.

### System metadata

At the bottom: created, updated, closed timestamps; created via (email / portal / API); IMAP message ID for inbound mail. Read-only.

---

## What's next?

- Send a reply → [Working a ticket](05-working-tickets.md)
- Add a teammate → [Collaboration](06-collaboration.md)
- Customer wants an update on status → [Status & SLA](07-status-and-sla.md)

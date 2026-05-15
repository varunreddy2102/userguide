# 3 — The inbox

[← back to index](README.md)

Your day-to-day workspace. Everything that needs an agent's attention shows up here.

![Ticket list](images/10-ticket-list.png)

---

## Two views, one page

There are two related routes you'll bounce between:

| Route | What it shows | When to use |
|---|---|---|
| `/tickets` | **Every** ticket your role is allowed to see — assigned, unassigned, open, closed | Default working view |
| `/tickets/pool` | Just **unassigned, open** tickets, sorted by priority + SLA urgency | Picking up new work at start of shift |

![Pool](images/11-ticket-pool.png)

---

## The page layout

At the top:

- **A stat strip** — six counter cards (`Waiting` / `Customer` / `Urgent` / `SLA Breach` / `Mine` / `Pool`) — the same six helpdesk metrics you see on the [Dashboard](02-dashboard.md), repeated here so you don't have to flip back.
- **A client-type tab strip** — `All / SaaS / OS / MOS / DEMO`. One click scopes the entire grid to that client type.
- **A row of saved-view chips** — `All Tickets`, `My Open Tickets`, `Unassigned`, `SLA At Risk`, `Urgent and High`, plus a **Save View** button to capture your current filter combination as a new chip.
- **A filter row** — Search, Status, Priority, Module, Assigned To, Client, plus an **All Tickets / My Tickets** toggle, a refresh button, an **Export** button, and **+ New Ticket** to file a ticket on a customer's behalf.

## The columns

Default columns from left to right:

- **Ticket #** — `TKT-{n}` identifier. Click to open the ticket.
- **Subject** — the customer-facing subject line. **Bolded if the ticket has unread updates** *for you*. Once you open it, the bold disappears.
- **Client** — the company that filed the ticket. Searchable in the filter row.
- **Priority** — `Urgent` / `High` / `Medium` / `Low`. Color-coded.
- **Status** — see [Status & SLA](07-status-and-sla.md) for the full state machine.
- **Labels** — free-text chips applied to the ticket.
- **SLA** — a badge showing time to next deadline. Green / amber / red. `Breached` shows in red.
- **Jira** — if the ticket has been escalated, shows the linked Jira key (e.g. `AFD-2987`). Clickable.
- **Assigned to** — empty for unassigned, otherwise the agent's name.

Each column header has a small **filter funnel** for in-place filtering on top of the row above. The **Columns** menu (top-right of the grid) toggles individual column visibility — your choice persists per user.

---

## Filtering

The filter row across the top of the table accepts:

- **Search** — full-text across subject, body, and ticket ID
- **Status** — multi-select
- **Priority** — multi-select
- **Module** — the 22-value module list shared with the AFD Jira project
- **Assignee** — searchable (incremental search, hits both name and email)
- **Client** — searchable
- **Date range** — created or updated, your pick

Filters compose. Once you have a filter combo you like, save it as a **Saved view**.

---

## Saved views

Saved views are the helpdesk's answer to Atlassian's queues. They're personal by default — you create one for yourself, you see it. Admins can publish a shared view to a role.

To create one:
1. Apply your filters.
2. Click **Save view** in the toolbar.
3. Give it a name (e.g. "Urgent SaaS open"); optionally check **Share with role**.

Your saved views appear in a dropdown next to **Save view** for one-click recall.

> **From Atlassian.** Where you'd normally jump between project queues, here you jump between saved views in a single inbox. The conceptual switch: **client** is the noun, not **project**.

---

## Bulk actions

Select rows with the checkbox column to enable bulk actions:

- **Bulk assign** — pick an agent, applies to the whole selection
- **Bulk priority change**
- **Bulk close** — useful for spam sweeps; will fire the `TicketStatusChanged` notification per ticket

> **Heads-up.** Bulk close *does* email each customer (one mail per ticket) just like a single close would. If you're sweeping noise, set the priority to `Low` first to mute the SLA churn, then use a canned response in the close dialog.

---

## The "bold-unread" model

A ticket is **unread for you** if any of the following happened since you last opened it:

- A customer reply landed
- An internal note was added by another agent
- The status, assignee, priority, or fields changed
- A watcher was added or removed

Opening the ticket clears your personal unread flag. Other agents' flags are independent — you can't "mark as unread for everyone".

---

## What's next?

- Open a ticket and learn the layout → [Anatomy of a ticket](04-anatomy-of-a-ticket.md)
- Send your first reply → [Working a ticket](05-working-tickets.md)

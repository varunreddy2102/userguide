# 9 — Automation & saved views

[← back to index](README.md)

Two features that move you from typing repetitive things to letting the system handle them.

---

## Saved views

Already covered briefly in [The inbox](03-inbox.md#saved-views), here's the management surface.

**Where:** the saved-view dropdown in the ticket-list toolbar.

A saved view captures:
- Filter combination (status, priority, module, assignee, client, date range, free-text search)
- Column visibility
- Sort order

A saved view does **not** capture:
- Pagination state
- Bulk-select selection

Views are personal by default. **SuperAdmin** and **Management** can publish a view to a role — everyone in that role sees it appear in their dropdown.

> **Tip.** A common starter set:
> - "My open" — assignee = me, status ∈ open
> - "SaaS urgent" — client type = SaaS, priority = Urgent, status ∈ open
> - "SLA at risk" — sort by SLA badge ascending, status ∈ open
> - "Stale Pending" — status = Pending, updated > 3 days ago

---

## Automation rules

**Where:** `/tickets/automation-rules`.

![Automation rules](images/32-automation-rules.png)

A rule fires when an **event** occurs, evaluates a **condition** (JSON-encoded), and runs an **action**. They're the helpdesk's analogue of Jira automation — same shape, much smaller surface.

### Supported events

- `TicketCreated`
- `TicketStatusChanged`
- `TicketPriorityChanged`
- `TicketAssigned`
- `TicketTagsChanged`
- `MessageAdded` (public or internal)

### Conditions

JSON object compared against the ticket. Keys you can match on:
- `clientType` (SaaS / OS / MOS / Demo)
- `priority`
- `module`
- `status`
- `tagsContains` (any of)
- `subjectMatches` (regex)

Example:
```json
{ "clientType": "SaaS", "priority": "Urgent" }
```

### Supported actions

- `assignToUser` (with `userId`)
- `assignToRole` (round-robin within active members of a role with matching client scope)
- `setPriority`
- `addTag` / `removeTag`
- `addWatcher`
- `addInternalNote` (with templated body)

### Creating a rule

1. Click **+ New rule**.
2. Pick the event.
3. Fill the conditions JSON.
4. Pick an action and its parameter.
5. Save. Rules default to **active**.

You'll see them list with a toggle for active/inactive and a delete button. Test by triggering the event on a real ticket — the rule fires synchronously inside the request.

> **Heads-up — multi-rule sequencing.** If two rules in the same event evaluation both fire `assignToUser`, **both** target users get the assignment notification, but only the second sticks. This is a known quirk; usually it's better to have one rule per event with disjoint conditions.

> **Heads-up — automation-driven assignment doesn't write an "Assigned" audit row** the way a manual assignment does. Pre-existing gap; on the backlog. If you need a paper trail, add an `addInternalNote` action alongside.

---

## Pattern library — rules worth copying

| Goal | Event | Condition | Action |
|---|---|---|---|
| Auto-assign Urgent SaaS to the SaaS lead | `TicketCreated` | `{ "clientType": "SaaS", "priority": "Urgent" }` | `assignToUser: <lead>` |
| Tag billing-related tickets | `TicketCreated` | `{ "subjectMatches": "(?i)(invoice|bill|payment)" }` | `addTag: billing` |
| Page CS Head on Reopened | `TicketStatusChanged` | `{ "status": "Reopened" }` | `addWatcher: <CS Head userId>` |
| Auto-pin a "follow up" tag when assigned to junior agents | `TicketAssigned` | `{ "assigneeRoleId": 2 }` | `addTag: needs-review` |

---

## What's next?

- Build your canned-response library → [Self-service tools](11-self-service-tools.md)
- Looking at last month's numbers → [Self-service tools — reports](11-self-service-tools.md#reports)

# 247HRM Helpdesk — Agent Handbook

Welcome. This guide gets you productive in the 247HRM helpdesk in under an hour, even if everything you know about ticketing was learned in Atlassian Jira Service Management or Freshdesk.

We've kept it short and visual. Every page maps a real screen you'll see, with screenshots, the keystrokes that matter, and — where it helps — a "**In Atlassian this was…**" crosswalk so you don't have to relearn concepts, just the new buttons.

---

## Where to start

| If you're… | Read this first |
|---|---|
| New to the helpdesk | [01 — Getting started](01-getting-started.md) |
| Trying to triage your inbox | [03 — The inbox](03-inbox.md) |
| Replying to a customer | [05 — Working a ticket](05-working-tickets.md) |
| Stuck on an SLA breach | [07 — Status & SLA](07-status-and-sla.md) |
| Escalating to engineering | [08 — Jira integration](08-jira-integration.md) |
| Wondering when an email goes out | [09 — Email notifications](09-email-notifications.md) |
| Looking for a button you can't find | [13 — Troubleshooting](13-troubleshooting.md) |

---

## The full table of contents

1. [Getting started](01-getting-started.md) — login, the layout shell, sidenav, top bar, switching timezone
2. [Dashboard](02-dashboard.md) — the stat cards, drill-downs, and what each metric actually means
3. [The inbox](03-inbox.md) — ticket list, the unassigned pool, filters, saved views, bold-unread
4. [Anatomy of a ticket](04-anatomy-of-a-ticket.md) — a labelled tour of the ticket detail page
5. [Working a ticket](05-working-tickets.md) — replies, internal notes, @-mentions, edit & delete, attachments, canned responses
6. [Collaboration](06-collaboration.md) — watchers, CC participants, adding a customer contact
7. [Status & SLA](07-status-and-sla.md) — statuses, transitions, auto-pause, SLA badges, internal escalation, what the customer sees
8. [Jira integration](08-jira-integration.md) — the escalation dialog, the status panel, two-way comment sync
9. [Email notifications](09-email-notifications.md) — every email the system sends, when, and to whom; per-user preferences
10. [Automation & saved views](10-automation-and-views.md) — let the system do the boring parts
11. [Self-service tools](11-self-service-tools.md) — canned responses, knowledge base, reports
12. [The public portal](12-public-portal.md) — what your customers see when they file a ticket
13. [Troubleshooting & FAQ](13-troubleshooting.md) — the questions everyone asks in week one

---

## Atlassian → 247HRM crosswalk

A quick translation table for muscle memory. If a page mentions a feature you knew under a different name, this is where to look.

| Atlassian concept | 247HRM equivalent | Where it lives |
|---|---|---|
| Queue | Ticket list filtered by a Saved View | [Inbox](03-inbox.md) |
| Project | Implicit — there is one helpdesk; you scope by **Client** instead | [Inbox](03-inbox.md) |
| Request type | **Ticket Type** field on the ticket | [Anatomy](04-anatomy-of-a-ticket.md) |
| Internal comment | **Internal note** toggle on the reply box | [Working a ticket](05-working-tickets.md) |
| Reporter | **Reporter** (same name) | [Anatomy](04-anatomy-of-a-ticket.md) |
| Request participant | **CC participant** on the ticket | [Collaboration](06-collaboration.md) |
| Watcher | **Watcher** (same name, but any active internal user can be added — not just an "approver list") | [Collaboration](06-collaboration.md) |
| Components | **Module** (driven by a 22-value list shared with the engineering Jira project) | [Anatomy](04-anatomy-of-a-ticket.md) |
| Labels | **Labels** (same name) | [Anatomy](04-anatomy-of-a-ticket.md) |
| SLA — Time to first response / Time to resolution | **First Response SLA** / **Resolution SLA**, driven by the **Support Plan** assigned to the client | [Status & SLA](07-status-and-sla.md) |
| Pause SLA on status | **Auto-pause** when the ticket moves to `Pending` (waiting on customer). There is no manual pause/resume any more — the status is the switch. | [Status & SLA](07-status-and-sla.md) |
| Escalation rules | **Internal escalation** (auto, on SLA half-life) + **Jira escalation** (manual, agent-driven) | [Status & SLA](07-status-and-sla.md), [Jira integration](08-jira-integration.md) |
| Notification scheme | **Notification dispatcher** + per-user preferences (email + in-app per event) | [Email notifications](09-email-notifications.md) |
| Jira automation | **Automation rules** (event → conditions → actions) | [Automation & views](10-automation-and-views.md) |
| Canned response / template | **Canned response** | [Self-service tools](11-self-service-tools.md) |
| Knowledge base article | **Knowledge base article** | [Self-service tools](11-self-service-tools.md) |
| Customer portal | **Public portal** at `/public/support` | [Public portal](12-public-portal.md) |
| Linked issue (to engineering) | A Jira issue created from the ticket via the **Escalate to Jira** dialog. Comments and status sync both ways. | [Jira integration](08-jira-integration.md) |
| Service desk dashboard | **Dashboard** with helpdesk widgets | [Dashboard](02-dashboard.md) |

---

## Conventions used in this guide

- **Bold UI labels** match exactly what you'll see on the screen.
- `Code-style paths` are routes you can paste after the helpdesk URL.
- Callouts:
  - **Tip** — a faster way to do something
  - **Heads-up** — something that surprises people in week one
  - **From Atlassian** — a behaviour that is genuinely different from what you're used to

If something in this guide doesn't match what you see, ping `varunr@interbiz.in` — the guide is versioned with the codebase and we want to keep it accurate.

— *Last updated against branch `Implementation` on 2026-05-05.*

# 10 — Self-service tools

[← back to index](README.md)

Three places under **Tickets** in the sidenav that aren't tickets themselves but make working tickets faster.

---

## Canned responses

**Where:** `/tickets/canned-responses`.

![Canned responses](images/30-canned-responses.png)

Reusable reply templates. Available from the **Canned response** dropdown above the reply box on any ticket.

### Creating one

1. Click **+ New canned response**.
2. Fill:
   - **Title** — what you'll see in the dropdown ("Acknowledge — payroll ETA")
   - **Body** — the message. Supports rich text and merge fields.
3. Save.

### Merge fields

You can include any of these in the body — they expand when the canned response is loaded into the reply box:

- `{client_name}` — customer organisation
- `{ticket_id}` — `TKT-{n}`
- `{reporter_name}` — the person who filed the ticket
- `{assignee_name}` — current assignee
- `{agent_name}` — your name (the person sending)

### Best-practice library

A starter set most teams build:

| Title | When to use |
|---|---|
| Acknowledge — under investigation | First reply when you need a few hours to dig in |
| Awaiting customer info | Right before flipping to `Pending` |
| Bug confirmed — escalated to engineering | After you escalate to Jira |
| Resolution — config change | Used in resolution notes when fix was config-side |
| Resolution — bug fix shipped | Used when an AFD/LFD release contains the fix |

> **Tip.** Title with the *outcome* (what happens when you send) not the *reason* (why you're sending). "Acknowledge under investigation" reads better in a hurried dropdown than "Tickets that need investigation".

---

## Knowledge base

**Where:** `/tickets/knowledge-base`.

![Knowledge base](images/31-knowledge-base.png)

A searchable library of customer-facing articles. Two audiences:

1. **Customers** — the public portal at `/public/support` shows KB suggestions when they're filing a new ticket.
2. **Agents** — searchable from the reply box; lets you paste a link to an article rather than re-explaining the same thing weekly.

### Authoring

1. **+ New article.**
2. Fill **Title**, **Category**, **Tags**, **Body** (rich text).
3. Toggle **Published** to make it customer-visible. Drafts are agent-only.
4. Save.

The article gets a stable URL and a per-article view counter you can see on the list.

### Categories

Conventionally: Payroll / Attendance / Leave / Onboarding / Mobile App / Billing / Integrations / Troubleshooting. Add new categories freely.

> **Tip.** Articles should answer **one** question. If yours starts with "and also…", split it into two.

---

## Reports

**Where:** `/tickets/reports`.

![Ticket reports](images/33-ticket-reports.png)

Aggregate metrics over a configurable date range.

### What you'll see

- **SLA compliance rate** — % of tickets that hit both First Response and Resolution targets in the date range
- **CSAT average** — mean rating of resolved tickets, on a 1-5 scale
- **Resolution time** — by priority, by assignee
- **First-response time** — same breakdowns
- **Volume trend** — created vs closed per day, line chart
- **Top modules** — which module generated the most tickets
- **Top reporters** — which clients filed the most

### Filters

- **Date range** — last 7 / 30 / 90 days, custom
- **Client** — multi-select for cross-comparison
- **Priority** — multi-select

### Exporting

Each chart has an **Export** menu — PNG (image), CSV (raw rows), Excel (formatted).

> **Heads-up.** Reports are read from the same DB the helpdesk runs against, with no caching. On a busy day, very wide date ranges (>90 days) can take a few seconds. Narrow the range first, widen if you actually need the long view.

---

## What's next?

- See what your customers see → [The public portal](12-public-portal.md)
- Stuck? → [Troubleshooting & FAQ](13-troubleshooting.md)

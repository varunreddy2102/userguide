# 11 — The public portal

[← back to index](README.md)

You won't spend much time here, but every ticket that arrives via the portal originated on this page. Knowing what your customers see lets you write replies that connect to their experience.

**URL:** `https://admin.247hrm.com/public/support` (or local: `http://localhost:4200/public/support`)

![Public portal](images/70-public-portal.png)

---

## What customers can do

### File a new ticket

1. They enter their email and request an OTP (no login required).
2. Once verified, the new-ticket form appears with:
   - **Subject** — required
   - **Description** — required, rich text
   - **Priority** — defaults to `Medium`; they can pick Urgent if they need to
   - **Module** — optional, helps your routing
   - **Attachments** — multiple
3. As they type the subject, **KB suggestions** appear underneath — a deflection nudge.
4. Submit. They get the same `[TKT-{n}] We received your request` email you'd see on inbound mail.

### View their tickets

After OTP verification, customers see a paginated list of **their own** tickets:
- Searchable by subject
- Status pill, priority, last update
- Click to open

### Reply to an existing ticket

On any open ticket they own:
- A reply box (no internal-note option, of course)
- Their replies are emailed to the helpdesk and appear in your thread, attributed to the customer

### Rate a resolved ticket (CSAT)

When a ticket reaches `Resolved`, the customer's view of it includes a **5-star rating** and an optional comment. Their submission populates the **CSAT** widget on the [Dashboard](02-dashboard.md) and [Reports](11-self-service-tools.md#reports).

---

## What customers cannot do

- See other clients' tickets (scoped to their email's organisation)
- See **internal notes** — these are never sent and never visible
- See watcher membership, assignee changes, or audit log
- Reopen a `Closed` ticket directly — they can file a new ticket that links to the old one (the email-ingestion subject-matcher will sometimes auto-link them)

---

## Common questions agents get from customers

| Customer question | Honest answer |
|---|---|
| "Why didn't I get an email?" | Check spam (especially Gmail "Promotions"). Mail comes from `noreply@247hrm.com`. |
| "Can I CC someone?" | Yes — they can add CC addresses in their email reply, and the system captures them as participants. |
| "Where do I see status?" | The portal at `/public/support`, or the latest status email we sent them. |
| "Can I escalate?" | Tell them to reply on the ticket with the word "urgent" and your manager's name in the body — that's enough to get the right eyes on it via watchers/automation. |

---

## What's next?

- Final stop → [Troubleshooting & FAQ](13-troubleshooting.md)

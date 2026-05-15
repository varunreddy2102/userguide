# 5 — Working a ticket

[← back to index](README.md)

This is the page you'll come back to most often. Replying, leaving notes for a teammate, mentioning someone, fixing your typos — it all happens in the reply box.

![Reply box](images/21-ticket-detail-bottom.png)

---

## The reply box at a glance

The reply box has three rows:
1. **Two tabs at the top — `Public Reply` and `Internal Note`.** This is the toggle that decides whether the customer sees the message. The active tab is underlined.
2. A **Canned Response** button immediately below the tabs.
3. A rich-text editor with a small toolbar (B / I / U / bullet list / numbered list / link / clear formatting), and a **placeholder** ("Type your response…").
4. A footer row: an **Attach** paperclip on the left, a **Client's input required** checkbox in the middle (more on this below), and the **Send** button on the right.

## Sending a reply to the customer

1. Make sure the **Public Reply** tab is active (it's the default).
2. Type your message. Markdown-style shortcuts work; the toolbar covers the basics.
3. (Optional) Click **Attach** to upload files. Multiple files supported, S3-backed.
4. (Optional) Tick **Client's input required** if your reply asks the customer for something — this transitions the ticket to `Pending` and pauses the SLA clock when you Send.
5. Click **Send**.

Behind the scenes:
- The customer (and any CC participants) receive an email from `noreply@247hrm.com`.
- The ticket status auto-advances to `InProgress` if it was `Open`.
- The First Response SLA clock stops if this is the first agent reply.
- A `TicketStatusChangedCustomer` notification fires (if status changed into a customer-visible state).

> **From Atlassian.** There is no separate "respond to customer" vs "comment" menu — the toggle below the editor controls it.

---

## Internal notes

Click the **Internal Note** tab at the top of the reply box (it sits next to **Public Reply**). The editor stays in the same position, but anything you Send from this tab is private. The message turns yellow in the thread, the customer never sees it, and an `InternalNoteAdded` notification goes to the assignee + watchers (excluding you, the actor).

Use internal notes for:
- "@Anita can you take this — billing is your area"
- "Customer is on the Premium plan, escalation is fine"
- "Verified the bug locally, ticket AFD-2987 tracks the fix"

Use them sparingly for status updates the customer would actually want — when in doubt, send the reply public.

---

## @-mentioning a teammate

Inside any message (public or internal):

1. Type `@`.
2. A dropdown appears showing matching users. Type more letters to narrow it.
3. Use **↑ / ↓** to navigate, **Enter** or **Tab** to insert. **Esc** dismisses.
4. The mention becomes literal text (`@anita`) but triggers an `AgentMentioned` notification to that user when you Send.

> **Tip.** Mentions in *internal notes* are the politest way to hand off a ticket — the assignee stays the same, but the mentioned person is pulled in by the bell + email.

---

## Editing or deleting a message

Hover any message **you wrote**. Two icons appear at the top-right of the bubble:

- ✏️ **Edit** — replaces the body with an inline textarea. Save or cancel. The bubble gets an `(edited at <timestamp>)` tag visible to everyone, and a `CommentEdited` notification fires.
- 🗑️ **Delete** — soft-delete. The bubble is replaced with `[deleted]` for everyone, but the original body is preserved server-side for compliance. A `CommentDeleted` notification fires.

**Who can edit/delete what:**
- You can always edit and delete your **own** messages.
- **SuperAdmin** (Role 1) and **Management** (Role 4) can edit-delete anyone's messages — for cleaning up accidental customer-visible PII, mostly.
- Nobody else can.

> **Heads-up.** "Delete" doesn't email the customer that you deleted something. If they're already looking at the message in their inbox, they still have it. Don't rely on Delete to recall a leaked secret — rotate the secret and tell the customer.

---

## Attachments

Three flavours:

- **Inline images** — paste a screenshot from the clipboard; renders inline in the email and the thread.
- **Standalone files** — paperclip → upload. Stored in S3 with a per-tenant prefix.
- **Forwarded inbound** — when a customer emails the helpdesk with attachments, they appear inline on the customer's message in the thread, sourced from the same S3 store.

Attachments **count** toward the message — if you attach a file but type nothing, that still creates a message in the thread. Add at least one character of body text if you want the email to read as something other than "see attached".

---

## Canned responses

If you find yourself typing the same paragraph weekly, save it as a canned response.

While in the reply box:
- Click the **Canned response** dropdown above the editor.
- Pick one — its body fills the editor.
- Edit any merge fields (`{client_name}`, `{ticket_id}`, etc. expand automatically).
- Send as you would any reply.

Manage your canned responses at `/tickets/canned-responses`. Detailed in [Self-service tools](11-self-service-tools.md).

---

## What's next?

- Add a watcher or CC → [Collaboration](06-collaboration.md)
- Change the status / handle SLAs → [Status & SLA](07-status-and-sla.md)
- Escalate to engineering → [Jira integration](08-jira-integration.md)

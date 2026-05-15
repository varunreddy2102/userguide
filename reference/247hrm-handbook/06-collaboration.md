# 6 — Collaboration

[← back to index](README.md)

Three ways to pull other people into a ticket:

| Mechanism | Who it pulls in | What they get |
|---|---|---|
| **Assignee** | One internal agent | Owns the ticket; gets every notification |
| **Watcher** | Any number of internal users | Bell + email on updates; cannot be the customer |
| **CC participant** | Any number of email addresses | CC'd on **outbound** customer-facing replies; CC'd on inbound auto-ack |

This page covers Watchers and CC participants. For inline-editing the Assignee, see [Anatomy of a ticket](04-anatomy-of-a-ticket.md#assignee).

---

## Watchers

In the right panel, find the **Watchers** section. You'll see a chip per current watcher, plus a `+` button.

### Adding a watcher

1. Click `+`.
2. A searchable picker appears — type any name or email of an active internal user.
3. Click the suggestion. The chip is added and the picker auto-closes.

That user immediately starts receiving:
- Bell notifications for every ticket update
- Emails for high-impact events (assignment, status change to customer-visible, internal notes, mentions, comment edits/deletes)

### Removing a watcher

Click the **×** on their chip. Removal is silent — no notification fires to the watcher or anyone else.

> **From Atlassian.** A watcher in 247HRM is **anyone** active in the system, not just members of an "approver" or "stakeholder" group. The list is unrestricted by design — if you need a teammate to see updates, just add them.

> **Heads-up.** Watcher membership has nothing to do with **escalation ladders**. The escalation chain (when SLA breaches loom) is computed from role assignments and `UserClientAccess` scopes, not from the watcher list. See [Status & SLA](07-status-and-sla.md#internal-escalation).

---

## CC participants

Below the Watchers section. CC participants are **external** people — usually a customer's manager, a sales contact, or a billing AP person — who should see every reply that goes to the customer.

### Adding a CC

You have two paths:

1. **From inbound CC.** When a customer's original email had people on CC, they're auto-added as CC participants on the ticket. No action needed.
2. **Manually.** Click `+` next to **CC participants**. Three sub-options:
   - **Type any email** — accepts any valid address.
   - **Pick a known contact** — a dropdown of contacts already on the customer's organisation record.
   - **Add new contact** — opens the [Add Contact](#adding-a-customer-contact) dialog (recommended; see below).

CC'd participants will be on every subsequent customer-facing reply, and on the close confirmation if you check "send a closure email".

### Removing a CC

Click the **×** on the chip. The address still has access to the original thread (those emails were sent already), but won't appear on future replies.

---

## Adding a customer contact

A common scenario: a customer files a ticket, someone new pops up in the conversation ("loop in our IT lead"), and you'd like to capture them in the customer's contact list for next time.

From the **Reporter** card on a ticket, click the **person-add icon**. A dialog opens with all the contact fields:

- Name, email, phone
- Designation, escalation level (1 / 2 / 3)
- Preferred channel (email / phone)
- Notify on (Tickets / Billing / Both)
- Free-text remarks
- **Add as CC on this ticket** checkbox — *defaults to ON*. Leave it ticked to immediately add the contact as a CC participant on the current ticket.

Save. The contact is now stored on the **Client → Contacts** tab and is selectable from any future ticket's CC picker.

> **Permissions.** The system is generous about who can create contacts: anyone who can see the client (via role + module access), or anyone who is a watcher on any ticket for that client. The point is that a watcher with no broader client-management rights can still capture a new contact during a conversation. Edit/Delete on contacts is reserved for users with the `ManageClients` permission.

---

## What's next?

- Walk through statuses and SLAs → [Status & SLA](07-status-and-sla.md)
- Hand off to engineering → [Jira integration](08-jira-integration.md)

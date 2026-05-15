# 12 — Troubleshooting & FAQ

[← back to index](README.md)

The questions every new agent asks in their first two weeks. If yours isn't here, ping `varunr@interbiz.in` and we'll add it.

---

## Login & access

### "I'm not getting the OTP email."

In order:
1. Wait 30 seconds — there's a deliberate cooldown before the resend button works.
2. Check spam, including Gmail's "Promotions" tab.
3. Confirm the address you typed exactly matches the address on file. The system is case-insensitive but typos still bite.
4. Ask a SuperAdmin to confirm your account is **Active** under **Users**.
5. If all four are clean: there's a chance SES is throttling or the helpdesk SMTP relay is down. Ping ops.

### "The sidenav doesn't show Tickets / Clients / Demo Requests."

You don't have **module access** for that area. This is configured per-role under **Users → Roles**. Ask a SuperAdmin or your Role Owner to grant the missing module.

### "I get a 403 / 'Forbidden' when I click something."

You have access to the *area* but not the specific *action* (e.g., you can see clients but can't edit billing). Action permissions are separate from module access. Same fix: ask the role to be widened.

---

## Tickets you can't see

### "A ticket I expected to see isn't in my list."

Most likely:
- Your role's `UserClientAccess` (UCA) doesn't include that client's type/scope. SaaS / OS / MOS scopes filter the list.
- The ticket is `Closed` and your filters exclude closed.
- The assignee is set to someone else and your filter is "My tickets only".

### "I can see the ticket but can't reply."

You're allowed to view in scope but not to act. Same UCA / role gate. Most agents have act permission on the same scopes they can view.

---

## Notifications & email

### "I'm getting too many notifications."

There **is** per-event opt-out — open the user menu → **Notification preferences**. For every event you can independently turn off Email and/or In-app. Full event list and what each one does: [Email notifications](09-email-notifications.md). Quick wins:
- Mute `ClientReplied` and `PublicReplySent` Email if your bell already covers it.
- Leave SLA breach + assignment events on — they're the safety net.
- If the noise is per-ticket (not per-event), remove yourself as a watcher (`×` on your chip on the ticket detail page).
- If you're escalated to too aggressively at role-level, you may be the only active member of a heavy role — talk to admin about distributing the load.

### "The customer says they didn't get my reply."

In order:
1. Check the ticket thread — did the reply go out? It will be on the right side of the thread with a timestamp.
2. Check `Logs/app-{Date}.txt` (or ask ops to) for the SES message ID — that confirms whether SES accepted the message.
3. Most "didn't get it" cases are spam-folder issues at the recipient. The first attempt should be: forward the original from your own mailbox to the recipient as a reachability test.

### "The customer's reply didn't show up on the ticket."

The IMAP ingestion service polls every minute. Wait 60 seconds.

If it still doesn't appear:
- Check that they replied *to the same thread* (didn't strip the `[TKT-{n}]` from the subject).
- If they sent a fresh email, the subject-matcher tries to attach it to an open ticket but is fuzzy; it can occasionally land as a *new* ticket if the subject diverges from the original.
- Worst case: ask them to forward to `support@247hrm.com` with the ticket ID on the first line.

---

## Status & SLA puzzles

### "Why is the SLA red — I just opened the ticket?"

Two reasons:
- The ticket was sitting `Open` for hours before you assigned it. The First Response clock started at creation.
- The customer's Support Plan has a tight First Response target for the priority of this ticket (e.g., `Urgent` on Premium = 30 min).

Click the **SLA badge** to see the absolute deadline. If you legitimately can't meet it, that's what `Pending` (waiting on customer info) and **internal escalation** are for.

### "Why is the customer getting status emails I didn't ask for?"

Status changes that move into a **customer-visible status** trigger an automatic email. Customer-visible statuses (config: `TicketSettings:CustomerVisibleStatuses`) are `InProgress`, `Investigating`, `Pending` by default. Avoid round-tripping a ticket through these unnecessarily.

### "I want to manually pause SLA for a tricky case."

There is no manual pause. The pause mechanism is `Pending` status. If you're waiting on the customer, flip to `Pending` and the clock pauses. If you're waiting on engineering, the right move is to **escalate to Jira** — that's what the Jira link is for, not an SLA pause.

---

## Jira

### "I escalated but the Jira issue doesn't show in the panel."

The escalation is synchronous against the Jira API; if it failed, you would have seen an error toast at the time. If the panel is missing now:
- **Refresh** the page (it's cached).
- Click **Refresh from Jira** in the panel — pulls latest by key.
- If the linked Jira key is stale (issue moved/deleted), you'll see a "Jira issue not found" warning. Re-escalate.

### "Engineering closed the Jira but the helpdesk ticket is still open."

Closing is intentional, manual, and agent-driven. The Jira-resolved state lights up the **Resolve helpdesk ticket** button — *you* click it once you've verified with the customer. This avoids the awkward "engineering said done but customer still sees the bug" close.

### "My internal note appeared on the Jira issue."

Yes — when a ticket is escalated, both public replies and internal notes mirror to Jira (engineering needs the context). Don't put customer-confidential PII in internal notes on escalated tickets. Use the **redact via edit** feature if you've already sent something sensitive.

---

## Edit / delete

### "I can't see the Edit button on a teammate's message."

By design. You can edit and delete only **your own** messages. SuperAdmin (Role 1) and Management (Role 4) can edit/delete anyone's; nobody else can.

### "I deleted a message and the customer still has it in their inbox."

Right — Delete is a soft-delete on our side that replaces the message with `[deleted]` for everyone in the helpdesk UI. Anything we already emailed is already gone. If a leaked secret prompted the delete, **rotate the secret** and tell the customer.

---

## "Where do I find…?" (the missing-button index)

| Looking for | Where it lives |
|---|---|
| The list of clients | `/clients` (sidenav: Clients) |
| A client's contacts | Client detail → **Contacts** tab |
| A client's billing history | Client detail → **Billing History** tab |
| A client's Support Plan / SLA targets | Client detail → **Support Plan** tab, or `/support-plans/assign` |
| Demo requests | `/demo-requests` |
| Audit log | `/audit` (SuperAdmin only) |
| Internal user list | `/users` (SuperAdmin only) |
| The configured 22-value Module list | `appsettings.json → JiraSettings:ModuleField` (read-only for agents — ask admin to extend) |
| Implementation tracker (onboarding) | `/implementation` (Implementation SPOC and CS Head roles only) |
| Background jobs / health | `/admin/jobs` (SuperAdmin only) |

---

## Still stuck?

- Open an internal ticket against the **AFD** Jira project, type **Support — internal**.
- Or: reply on this guide's PR/Issue tracker so the FAQ can grow.

— *That's the whole guide. If you read this far, you're ahead of 90% of teammates by week two. ☕*

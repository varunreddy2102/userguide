# 9 — Email notifications

[← back to index](README.md)

This page is the single source of truth for **what email actually leaves the system**, when, and to whom. If a customer asks "why didn't I get an email?" or a teammate asks "why am I getting these?" — the answer is on this page.

There are **two engines** that send email, and knowing the difference saves you debugging time:

| Engine | What it sends | Configurable per-user? | Goes through dispatch log? |
|---|---|---|---|
| **Notification dispatcher** | Most ticket-lifecycle events (assigned, mention, status change, SLA, etc.) | **Yes** — see [Per-user preferences](#per-user-preferences) | **Yes** — every send is logged |
| **Direct sends** from `TicketService` & friends | Inactivity reminders, auto-close confirmations, public-portal OTP, billing OTPs | **No** — these are mandatory operational emails | **No** — they show up in `Logs/app-{Date}.txt` only |

---

## The dispatcher event catalogue

Every event below has both an Email and an In-App template (a few are in-app only). Each fires from a specific code path; the **resolver** decides who gets the message; **per-user prefs** decide whether each recipient actually receives email, in-app, or both.

### Customer-facing events

These touch the *external* customer (the reporter, plus any CC participants).

| Event | When it fires | Who gets the email |
|---|---|---|
| `TicketCreated` | A ticket is filed (via portal, email, or agent on customer's behalf) | Reporter + inbound CCs |
| `TicketStatusChangedCustomer` | Status moves into a **customer-visible** state (`InProgress`, `Investigating`, `Pending` by default) | Reporter + CC participants |
| `TicketReopened` | An agent re-activates a `Resolved`/`Closed` ticket | Reporter + CC participants |
| `PublicReplySent` | An agent sends a public reply | Reporter + CC participants |
| `ClientReplied` | A customer replies (inbound email or portal) | Assignee + watchers (so you know they answered) |
| `CsatRequested` | A ticket transitions to `Resolved` and CSAT is enabled | Reporter — one-time link to a 5-star form |

### Agent-collaboration events

These are internal to your team.

| Event | When it fires | Who gets the email |
|---|---|---|
| `TicketAssigned` | Someone assigns a ticket to a user | The new assignee |
| `TicketReassigned` | Assignment changes from one user to another | The new assignee |
| `TicketCreatedInternal` | A new ticket is filed (internal counterpart of customer event) | Agents with UCA scope on the client |
| `InternalNoteAdded` | Someone posts an internal note | Assignee + watchers (excluding the actor) |
| `AgentMentioned` | `@username` is included in a public reply or internal note | The mentioned user only |
| `WatcherAdded` | A user is added as a watcher | The new watcher |
| `ParticipantAdded` | An external CC is added | Configurable — usually the new CC |
| `CommentEdited` | Someone edits a thread message | Assignee + watchers |
| `CommentDeleted` | Someone soft-deletes a message | Assignee + watchers |
| `TicketClientChanged` | A ticket is moved from one client to another | Assignee + watchers |

### SLA / escalation events

| Event | When it fires | Who gets the email |
|---|---|---|
| `SlaWarning` | First-Response or Resolution SLA hits **75 %** of its window | Assignee |
| `SlaBreach` | First-Response or Resolution SLA passes its deadline | Assignee + Role 5 (Support Manager) + Role 11 (CS Head) |
| `UnassignedHalfwayEscalation` | First-Response SLA hits its half-life **and ticket is still unassigned** | Role 5 + Role 11 + agents with matching `UserClientAccess` (SaaS / OS / MOS scope) |
| `EscalatedInternally` | An agent clicks the **Escalate Internally** button manually | Same role ladder as `UnassignedHalfwayEscalation` |

### Billing & review events (info, mostly out of agent scope)

| Event | When it fires | Who gets the email |
|---|---|---|
| `BillingPaymentRecorded` | A payment is logged against a billing record | Configured billing recipients on the client |
| `ClientReviewAdded` | A new external review is captured for a client | Internal reviews mailing list |

> **Important.** All recipient selection runs through a **resolver** class per event under `Interbiz_Admin.API/Services/Notifications/Resolvers/`. The resolver is the only place that knows who should receive a given event — if you suspect the wrong people are being notified, that's the file to read.

---

## Direct (non-dispatcher) emails

These are sent inline from service code. They are **not** in the dispatch log and **not** controllable via user preferences. They're mandatory operational mail.

### Inactivity reminder — *"Awaiting Your Response"*

- **When:** every 23+ hours, against any ticket in `Pending` (or `Open` with no recent activity) where the customer hasn't replied for at least **1 day**
- **To:** the reporter
- **Subject:** `Re: {subject} [{TKT-n}] — Awaiting Your Response`
- **Body:** "We're still waiting for your response on ticket TKT-… If the issue has been resolved, no action is needed — the ticket will be automatically closed in {N} day(s)."
- **State:** writes `InactivityReminderSentAt` on the ticket so we don't double-send within 23 h

### Auto-close confirmation — *"Auto-Closed"*

- **When:** the inactivity counter reaches `autoCloseDays` (configured in `appsettings.json:TicketSettings:AutoCloseAfterDays`, typically 3 days)
- **To:** the reporter
- **Subject:** `Re: {subject} [{TKT-n}] — Auto-Closed`
- **Body:** "Your ticket has been automatically closed due to no response. If you still need help, simply reply to this email to reopen the ticket."
- **Effect:** ticket transitions to `Closed`. Replying re-opens via the email-ingestion path.

### Public-portal OTP

- **When:** a customer requests an OTP on `/public/support`
- **To:** the email they typed
- **Subject:** `247HRM Support — Your verification code`
- **Body:** the 6-digit code, 5-minute validity, plain text

### Other operational emails

The same pattern applies for: **agent login OTP** (`/login`), **billing OTPs** (each sensitive billing action requires an OTP), **SQL-patch approval OTP**, **support-plan-change OTP**, and the **review edit/delete OTPs**. None of these go through the notification dispatcher; they all fire inline from `OtpService` or domain controllers and live only in `Logs/app-{Date}.txt`.

---

## Per-user preferences

> **From Atlassian.** Atlassian's per-event opt-out has a direct equivalent here.

Every dispatcher event can be controlled per-user, per-channel:

- Open the **Notification preferences** page from the user menu (top-right → **Notification preferences**) — this is the same data exposed by `GET /api/notification-prefs` and `PUT /api/notification-prefs`.
- For each event you'll see two checkboxes: **Email** and **In-app**.
- Saving overrides the system default (`DefaultEmail` / `DefaultInApp` on the `NotificationEventType` row) for *your* user only.

Useful patterns:
- **"Stop emailing me on every customer reply, but keep the bell."** Uncheck Email on `ClientReplied` and `PublicReplySent`. Leave In-app ticked.
- **"I'm out tomorrow, mute everything."** There is no "mute all" toggle today; uncheck Email on all events temporarily. (Vacation autoresponder on the *receiving* side is your friend.)
- **"Customer-visible events only."** For management roles who want to know what the customer is seeing without the chatter, uncheck every internal-collaboration event (`InternalNoteAdded`, `AgentMentioned`, `CommentEdited/Deleted`) and leave the customer-facing six.

> **Heads-up.** SLA breach (`SlaBreach`) and unassigned-halfway events have `DefaultEmail = true` for their target roles. Individual users *can* turn them off, but managers should usually leave them on — this is the system's safety net.

---

## The dispatch log

Every dispatcher send is recorded in `Auth.NotificationDispatchLog` with:

- `EventKey` (e.g. `TicketAssigned`)
- `RecipientUserId` / `RecipientEmail`
- `Channel` (`Email` or `InApp`)
- `Status` (`Pending` → `Sent` / `Failed` / `Skipped`)
- `DispatchedAt`, `CompletedAt`
- `EntityId` (the ticket ID, usually) and an idempotency key to prevent duplicates within a window

This is exposed at `/admin/notification-dispatch-log` (SuperAdmin / Management only). When a customer or agent says "I didn't get the email", this is where to look:
- `Sent` — left our system; check spam at the recipient
- `Failed` — SES rejection or template render error; the row carries the reason
- `Skipped` — dedupe blocked it (already sent the same event to the same recipient within the dedupe window) or per-user preferences turned off the channel
- No row at all — the resolver didn't include this recipient. Check the resolver class.

---

## Templates

Email templates live as plain `.template` files at `Interbiz_Admin.API/Services/Notifications/Templates/`, one Email + one InApp per event. They're rendered with simple `{{Placeholder}}` substitution by `NotificationTemplateRenderer`.

If a customer-facing email needs wording changes, edit the `.template` file — no recompile needed for content tweaks (a restart picks them up). Variables available depend on the event; common ones are `{{TicketNumber}}`, `{{TicketSubject}}`, `{{TicketUrl}}`, `{{RecipientName}}`, `{{ActorName}}`, `{{ClientName}}`.

---

## Quick troubleshooting matrix

| Symptom | Likely cause | Fix / next step |
|---|---|---|
| Customer says "I never got the ticket-created email" | Spam folder; or `noreply@247hrm.com` not whitelisted | Check `NotificationDispatchLog` for `TicketCreated` row — if `Sent`, problem is on their side |
| Agent says "I'm not getting assignment emails" | Their per-user prefs have `TicketAssigned` Email unchecked | Open `/api/notification-prefs` for that user; toggle back on |
| Customer is getting **two** status emails on reopen | Known accepted behaviour: `Reopened` + `StatusChangedCustomer` both fire | Pre-existing; not a bug. To dedupe: turn off one of the two events globally |
| "I clicked Resolve but no email went out" | Reporter has no email on file | Check ticket's Reporter card |
| Auto-close email not arriving | `TicketSettings:AutoCloseAfterDays` not configured, or background service not running | Check `appsettings.json` and process list |
| All emails are slow today | SES throttling or relay issue | `Logs/app-{Date}.txt` will show SES errors; check ops |

---

## What's next?

- Saving filters and writing rules → [Automation & saved views](10-automation-and-views.md)
- Tools to make replies faster → [Self-service tools](11-self-service-tools.md)
- Common questions → [Troubleshooting & FAQ](13-troubleshooting.md)

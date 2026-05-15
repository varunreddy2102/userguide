# 1 — Getting started

[← back to index](README.md)

This page gets you logged in, oriented, and clear on what every region of the screen does. If you're already inside, skip ahead to [the inbox](03-inbox.md).

---

## Logging in

The helpdesk uses passwordless email-OTP login. There is no password to remember and no SSO step.

1. Go to your helpdesk URL (production: `https://admin.247hrm.com/login`; local: `http://localhost:4200/login`).
2. Enter your work email and click **Send OTP**.

   ![Login — email step](images/01-login-email.png)

3. Check your inbox for a 6-digit code (look for the sender `noreply@247hrm.com`). Codes are valid for **5 minutes**.
4. Type the code in the **OTP** field and click **Validate OTP**.

   ![Login — OTP step](images/02-login-otp.png)

5. You'll land on the [Dashboard](02-dashboard.md).

> **Heads-up.** If you don't get the email within ~30 seconds, check spam, then ask an admin to confirm your account is **Active**. The button has a 30-second cooldown before you can resend.

> **From Atlassian.** There is no Atlassian-account login flow, no MFA prompt, no session-token refresh dance. Each new device gets a fresh OTP; the session cookie lasts long enough that you'll only see this screen every couple of weeks.

---

## The layout shell

Once logged in, the screen has three persistent regions you'll see on every page.

![Layout shell](images/04-layout-shell.png)

### A — Top bar

From left to right:
- **App title** ("Interbiz Admin") — clicking it returns you to the [Dashboard](02-dashboard.md).
- **Timezone switcher** — every date in the app is rendered in *your* selected timezone. Persisted per-user. Use this if you handle clients across regions.
- **Notification bell** — opens the in-app notification feed. Badge shows unread count. See [Notifications](07-status-and-sla.md#what-fires-into-your-notification-bell).
- **Your name + role badge** — confirms which role's permissions are in effect.
- **Logout** — does what you'd expect.

### B — Sidenav

Lists every module you have access to. Items are role-gated: a Finance Admin will see different links than a Support Agent. Common entries for support agents:

- **Dashboard** — always visible.
- **Tickets** — the heart of the helpdesk. Expands to **All tickets**, **Pool** (unassigned), **Saved views**, **Canned responses**, **Knowledge base**, **Automation rules**, **Reports**.
- **Clients** — for agents who need to see customer org details (most do).
- **Demo Requests** — inbound leads, if your role handles them.
- **Implementation** — onboarding tracker, for SPOC and CS Head roles only.

If a section is missing from your sidenav, you don't have the module access for it. That's a configuration thing — talk to a SuperAdmin.

### C — Main content

Everything else. The route in the URL bar always reflects what you're looking at, so you can deep-link a teammate to the exact ticket or view you're on.

---

## A note on timezones

The system stores everything in UTC and renders in your selected zone. If a teammate says "the customer pinged at 3pm" and you see "9:30am", you're not out of sync — you're in different zones. Switch the dropdown in the top bar to match theirs and the entire UI re-renders.

> **Tip.** A common gotcha: SLA deadlines are computed against the *client's* business hours (defined on their Support Plan), not yours. The badge will say "due in 2h 14m" relative to *their* working day, not yours. See [Status & SLA](07-status-and-sla.md).

---

## What's next?

- See your queue and learn to triage → [The inbox](03-inbox.md)
- Tour the dashboard widgets → [Dashboard](02-dashboard.md)
- Need to reply right now? → [Working a ticket](05-working-tickets.md)

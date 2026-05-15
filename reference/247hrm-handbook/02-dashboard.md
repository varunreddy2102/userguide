# 2 — Dashboard

[← back to index](README.md)

The dashboard is the first thing you see after login. It's designed for two types of glance: **"how busy am I right now"** and **"how is my team doing this month"**.

![Dashboard](images/03-dashboard.png)

---

## The top stat strip

A strip of large counter cards at the very top. The first row is **client distribution** (read-only):

| Card | What it counts |
|---|---|
| **Total Clients** | All clients on file (active + inactive) |
| **SaaS & TC** | SaaS production + Test Cluster |
| **OS & MOS** | On-Site + Managed On-Site |
| **Non-production** | Test / Demo accounts |

Each card shows the **active / inactive** breakdown underneath the headline number.

The second row is **helpdesk-focused** — these are the cards you actually drive your day from:

| Card | What it counts | Use when |
|---|---|---|
| **Waiting (for support)** | Open tickets where you owe the customer a reply | Starting your shift |
| **Customer (waiting)** | Tickets in `Pending` — we're waiting on customer info | Sweeping for stale Pendings |
| **Urgent** | Open tickets at priority `Urgent` | Triage any time |
| **SLA Breach** | Open tickets past either deadline | Immediate damage control |
| **Mine** | Tickets assigned to **you** | Personal queue |
| **Pool** | Unassigned open tickets | Picking up new work |

The buttons at the top right of the page — **Sync Stats**, **Sync Domain Status**, **Refresh** — recompute the figures on demand (some metrics are cached).

---

## Lower charts

Below the counters are four widgets:

- **Client Distribution** — pie of clients by type (SaaS / TC / OS / MOS / Demo / etc.)
- **UI Versions** — top frontend versions by client count
- **DB Versions** — top database schema versions
- **At Risk Clients** — active clients with zero logins in the last 30 days

These are mainly informational for managers and CS leads. Clickable segments where it makes sense.

---

## What it does *not* do

The dashboard is read-only. You cannot create tickets from here, edit clients, or change settings. It's a pure overview surface.

For everything else, navigate via the sidenav.

---

[Next → 03 The inbox](03-inbox.md)

# Bossy

Bossy is a manager/boss dashboard that brings communication, notifications, social automation, and employee productivity insights into one place.

The core of Bossy is an **event-driven architecture powered by Inngest**. Instead of making every task happen directly inside an API request, Bossy emits events and lets Inngest execute durable background workflows, delayed tasks, retries, grouping, and automation.

---

## 1. Project Goals

Bossy should allow a manager, boss, team lead, or business owner to:

- View and send Gmail messages from one dashboard.
- Receive alerts when new emails arrive.
- Automatically classify/group incoming emails as:
  - Important
  - Normal
  - Spam
- Send notifications to Discord or WhatsApp.
- Schedule and automate LinkedIn posts.
- Monitor employee productivity.
- Detect productivity-related events or conditions.
- Notify employees through Discord or WhatsApp when appropriate.
- Run long-running and scheduled workflows reliably using Inngest.
- Keep an activity/history log of automated actions.

---

## 2. Core Architecture

```text
                         ┌──────────────────────┐
                         │       Bossy UI       │
                         │   Manager Dashboard  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Node.js API     │
                         │ Auth / REST / Webhook │
                         └──────────┬───────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
          ┌───────────┐       ┌───────────┐       ┌────────────┐
          │ PostgreSQL│       │   Redis   │       │  Inngest   │
          │  Main DB  │       │ Cache/etc │       │ Workflows  │
          └───────────┘       └───────────┘       └─────┬──────┘
                                                        │
                   ┌────────────────────────────────────┼──────────────────┐
                   │                 │                   │                  │
                   ▼                 ▼                   ▼                  ▼
              ┌─────────┐       ┌─────────┐       ┌──────────┐       ┌──────────┐
              │  Gmail  │       │ Discord │       │ WhatsApp │       │ LinkedIn │
              └─────────┘       └─────────┘       └──────────┘       └──────────┘
```

---

# 3. Main Inngest Events

Bossy should be designed around meaningful application events.

## Email events

```text
email.received
email.classified
email.important
email.spam
email.replied
email.sent
```

Example:

```ts
await inngest.send({
  name: "email.received",
  data: {
    messageId,
    threadId,
    sender,
    recipient,
    subject,
    receivedAt,
  },
});
```

---

## Employee events

```text
employee.activity.recorded
employee.productivity.updated
employee.productivity.low
employee.productivity.high
employee.alert.required
```


## Notification events

```text
notification.send
notification.email
notification.discord
notification.whatsapp
```



# 4. Gmail Workflow

### Goal

Bossy should monitor Gmail and make incoming messages visible in the dashboard.

```text
Gmail
  │
  │ new message
  ▼
Bossy
  │
  ▼
email.received
  │
  ▼
Inngest
  │
  ├── Store email
  │
  ├── Classify email
  │
  ├── Detect spam
  │
  ├── Detect importance
  │
  └── Notify manager if necessary
```


# 5. Email Classification

Bossy should group incoming emails into categories.

```text
                  Incoming Email
                        │
                        ▼
                ┌───────────────┐
                │ Classification│
                └───────┬───────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
          IMPORTANT   NORMAL      SPAM
```

# 6. Gmail Dashboard

Bossy should provide a Gmail-like interface:

```text
┌────────────────────────────────────────────────────────────┐
│ Bossy                                      Manager Account │
├──────────────┬─────────────────────────────────────────────┤
│ Inbox        │                                             │
│ Important    │  Emails                                     │
│ Spam         │                                             │
│ Sent         │  ┌───────────────────────────────────────┐  │
│              │  │ John        Project update            │  │
│              │  │ Sarah       Meeting confirmation      │  │
│              │  │ Finance     Invoice received          │  │
│              │  └───────────────────────────────────────┘  │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

Features:

- Read email
- Search
- Filter
- Mark read/unread
- Mark important
- Move to spam
- Reply
- Send new email
- View conversation/thread
- Display attachments where supported

---

# 7. Notifications

Bossy should support external notifications.

Initial options:

```text
Bossy
  │
  ▼
notification.send
  │
  ├── Discord
  │
  └── WhatsApp
```

# 8. LinkedIn Automation

Bossy should allow managers to prepare and schedule LinkedIn posts.

```text
Manager
  │
  ▼
Create Post
  │
  ▼
Schedule
  │
  ▼
linkedin.post.scheduled
  │
  ▼
Inngest
  │
  │ waits until scheduled time
  ▼
linkedin.post.publish
  │
  ▼
LinkedIn
```


# 9. Employee Productivity

Bossy should collect measurable activity rather than simply assuming an employee is productive or unproductive.

Potential signals:

- Tasks completed
- Tasks overdue
- Project activity
- Commits
- Pull requests
- Support tickets
- Meeting participation
- Work items completed
- Activity over a defined period

Example:

```text
Employee Activity
       │
       ▼
Productivity Aggregator
       │
       ▼
Productivity Score
       │
       ├── Normal
       ├── Needs Attention
       └── Alert
```

Example event:

```ts
await inngest.send({
  name: "employee.productivity.updated",
  data: {
    employeeId: "emp_123",
    productivityScore: 62,
    period: "weekly",
  },
});
```

---

# 10. Productivity Alert Workflow

```text
Employee activity
       │
       ▼
Calculate metrics
       │
       ▼
Store metrics
       │
       ▼
Check configured thresholds
       │
       ▼
Needs attention?
       │
      YES
       │
       ▼
employee.productivity.low
       │
       ▼
Notification workflow
       │
       ├── Discord
       │
       └── WhatsApp
```

Important: productivity alerts should be based on **explicit, measurable metrics and configurable thresholds**, not arbitrary judgments.

---

# 11. PostgreSQL Data Model

Initial entities:


User
 │
 ├── manages ──> Employee
 │
 ├── owns ─────> Email
 │
 ├── creates ──> LinkedInPost
 │
 └── configures > Integration

EmailThread
 │
 └── contains ──> Email

Employee
 │
 └── has ───────> ProductivityMetric

ProductivityMetric
 │
 └── can trigger > ProductivityAlert

Automation
 │
 └── produces ──> AutomationLog
```

---

# 12. Redis

Redis should be used where fast temporary/shared state is useful.

Potential uses:

### Caching

```text
gmail:inbox:{userId}
employee:productivity:{employeeId}
linkedin:scheduled:{postId}
```

### Rate limiting

```text
bossy:ratelimit:{userId}
```

### Distributed state

Useful when multiple Node.js instances are running.

### Pub/Sub

For real-time dashboard updates:

```text
Gmail
  │
  ▼
Node.js
  │
  ▼
Redis Pub/Sub
  │
  ▼
WebSocket servers
  │
  ▼
Bossy dashboard
```

---

# 13. WebSockets

WebSockets can provide real-time updates to the dashboard.

Example:

```text
New Gmail message
       │
       ▼
Inngest workflow
       │
       ▼
PostgreSQL
       │
       ▼
Redis Pub/Sub
       │
       ▼
WebSocket server
       │
       ▼
Manager's browser
       │
       ▼
"New email received"
```

This avoids requiring the browser to constantly poll the API.




That architecture makes Bossy a practical project for learning **Node.js, PostgreSQL, Redis, WebSockets, OAuth integrations, event-driven architecture, background jobs, retries, scheduling, and durable workflows**.

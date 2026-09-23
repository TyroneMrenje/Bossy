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

Example:

```ts
await inngest.send({
  name: "employee.productivity.updated",
  data: {
    employeeId,
    productivityScore,
    period: "daily",
  },
});
```

---

## LinkedIn events

```text
linkedin.post.scheduled
linkedin.post.publish
linkedin.post.published
linkedin.post.failed
```

Example:

```ts
await inngest.send({
  name: "linkedin.post.scheduled",
  data: {
    postId,
    scheduledFor,
  },
});
```

---

## Notification events

```text
notification.send
notification.email
notification.discord
notification.whatsapp
```

These allow the application to separate the event that something happened from the mechanism used to notify someone.

---

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

### Example workflow

```ts
const processEmail = inngest.createFunction(
  {
    id: "process-incoming-email",
    triggers: [{ event: "email.received" }],
  },
  async ({ event, step }) => {
    const email = await step.run("store-email", async () => {
      // Save email to PostgreSQL
    });

    const classification = await step.run(
      "classify-email",
      async () => {
        // Determine spam / important / normal
      }
    );

    if (classification === "important") {
      await step.run("notify-manager", async () => {
        // Send Discord/WhatsApp notification
      });
    }

    return classification;
  }
);
```

---

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

The initial implementation can use rules such as:

- Sender
- Subject
- Keywords
- Sender history
- Existing labels
- Email metadata

An AI/LLM classifier can be added later.

### Example database fields

```text
email
├── id
├── provider_message_id
├── thread_id
├── sender
├── recipient
├── subject
├── body
├── classification
├── is_read
├── received_at
└── created_at
```

---

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

Discord can be implemented first for development because it can provide a relatively simple webhook/bot-based notification path.

WhatsApp can be added as a separate provider.

The notification service should hide provider-specific implementation:

```ts
interface NotificationProvider {
  send(message: string, recipient: string): Promise<void>;
}
```

Possible implementations:

```text
DiscordNotificationProvider
WhatsAppNotificationProvider
```

This makes it possible to switch providers without changing the rest of the application.

---

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

Example:

```ts
const publishLinkedInPost = inngest.createFunction(
  {
    id: "publish-linkedin-post",
    triggers: [{ event: "linkedin.post.scheduled" }],
  },
  async ({ event, step }) => {
    await step.sleepUntil(
      "wait-until-scheduled",
      event.data.scheduledFor
    );

    await step.run("publish", async () => {
      // Call LinkedIn API
    });

    await step.run("record-publication", async () => {
      // Update PostgreSQL
    });
  }
);
```

The actual LinkedIn API permissions and publishing capabilities must be verified during implementation.

---

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

```text
User
Employee
Team
Email
EmailThread
EmailClassification
Notification
LinkedInPost
ProductivityMetric
ProductivityAlert
Integration
AutomationLog
```

Possible relationships:

```text
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

---

# 14. Suggested Node.js Structure

```text
src/
│
├── server.ts
│
├── routes/
│   ├── email.routes.ts
│   ├── employee.routes.ts
│   ├── linkedin.routes.ts
│   └── notification.routes.ts
│
├── controllers/
│
├── services/
│   ├── gmail.service.ts
│   ├── email.service.ts
│   ├── employee.service.ts
│   ├── linkedin.service.ts
│   └── notification.service.ts
│
├── inngest/
│   ├── client.ts
│   ├── email.functions.ts
│   ├── linkedin.functions.ts
│   ├── productivity.functions.ts
│   └── notification.functions.ts
│
├── integrations/
│   ├── gmail/
│   ├── linkedin/
│   ├── discord/
│   └── whatsapp/
│
├── websocket/
│   └── server.ts
│
├── redis/
│   └── client.ts
│
└── db/
    ├── schema/
    └── client.ts
```

---

# 15. Core Inngest Functions

The initial project should eventually contain functions similar to:

```text
processIncomingEmail
classifyEmail
notifyImportantEmail
sendEmail
scheduleLinkedInPost
publishLinkedInPost
calculateProductivity
checkProductivityAlerts
sendDiscordNotification
sendWhatsAppNotification
```

These should be separated into small durable workflows rather than putting the entire application inside one huge Inngest function.

---

# 16. MVP

Build the first version in this order:

### Phase 1 — Foundation

- Node.js API
- PostgreSQL
- Redis
- Inngest Dev Server
- Authentication
- Basic dashboard

### Phase 2 — Gmail

- Gmail OAuth
- Fetch inbox
- Store emails
- Display emails
- Send emails
- `email.received` event
- Important/spam classification

### Phase 3 — Notifications

- Discord integration
- Important email alerts
- Productivity alerts

### Phase 4 — Inngest workflows

- Retries
- Delayed jobs
- Scheduled workflows
- Fan-out
- Durable steps
- Workflow history

### Phase 5 — LinkedIn

- Create posts
- Schedule posts
- Publish posts
- Publication history

### Phase 6 — Productivity

- Employee activity ingestion
- Metrics
- Configurable thresholds
- Productivity dashboard
- Alerts

### Phase 7 — Real-time infrastructure

- WebSockets
- Redis Pub/Sub
- Multi-instance Node.js
- Connection management
- Rate limiting
- Monitoring

---

# 17. Example End-to-End Workflow

A manager receives an important email.

```text
                 Gmail
                   │
                   ▼
            email.received
                   │
                   ▼
               Inngest
                   │
          ┌────────┴────────┐
          ▼                 ▼
     Store Email       Classify Email
                            │
                            ▼
                       IMPORTANT
                            │
                            ▼
                  notification.send
                            │
                    ┌───────┴───────┐
                    ▼               ▼
                 Discord         WhatsApp
                    │
                    ▼
              Manager alerted
                    │
                    ▼
             Bossy WebSocket
                    │
                    ▼
             Dashboard updates
```

This demonstrates the main architectural purpose of Bossy:

**External event → Inngest workflow → persistent state → notification → real-time UI.**

---

# 18. Long-Term Architecture

The final system should be designed so that additional integrations can be added without rewriting the core application.

```text
                    ┌─────────────┐
                    │    Bossy    │
                    └──────┬──────┘
                           │
                    Event-driven core
                           │
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
           Gmail        LinkedIn       Employees
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                        Inngest
                           │
          ┌────────────────┼─────────────────┐
          ▼                ▼                 ▼
       PostgreSQL        Redis           Integrations
          │                │                 │
          │                │          ┌──────┴──────┐
          │                │          ▼             ▼
          │                │       Discord       WhatsApp
          │                │
          └────────────────┼───────────────┐
                           ▼               │
                       WebSockets          │
                           │               │
                           ▼               ▼
                       Bossy Dashboard
```

---

## Core Principle

Bossy should not treat Inngest as merely a place to put slow functions.

The architectural goal is to make important business actions **event-driven and durable**:

```text
Something happens
      ↓
Emit an event
      ↓
Inngest receives it
      ↓
Run one or more durable steps
      ↓
Persist the result
      ↓
Notify interested systems/users
      ↓
Update the real-time dashboard
```

That architecture makes Bossy a practical project for learning **Node.js, PostgreSQL, Redis, WebSockets, OAuth integrations, event-driven architecture, background jobs, retries, scheduling, and durable workflows**.

import { Inngest } from "inngest";
import { query } from "../db/postclient";

const IMPORTANT_SENDERS = [
  "tyronemrenje@gmail.com",
  "tyronemrenje1985@gmail.com",
  "boss@gmail.com",
];


export const inngest = new Inngest({ id: "my-app" });

export const emailReceived = inngest.createFunction(
  {
    id: "process-email",
    triggers: [{ event: "email.received" }],
  },
  async ({ event, step }) => {
    const isImportant = await step.run("classify-email", async () => {
      return IMPORTANT_SENDERS.includes(event.data.sender);
    });

    await step.run("save-email", async () => {
      await query(
        `INSERT INTO emails (message_id, thread_id, sender, recipient, subject, is_important, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (message_id) DO NOTHING`,
        [
          event.data.messageId,
          event.data.threadId,
          event.data.sender,
          event.data.recipient,
          event.data.subject,
          isImportant,
          event.data.receivedAt,
        ]
      );
    });

    return { isImportant };
  }
);
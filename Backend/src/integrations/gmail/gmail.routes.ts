import { Router } from "express";
import { gmailAuthClient } from "./gmail.client";
import { getGmailAuthUrl,handleOAuthCallback , getGmailClient, getLastHistoryId, setLastHistoryId} from "./gmail.auth";
import { startWatch } from "./gmail.watch";
import { inngest } from "../../inngest/index"; 

const router = Router();

router.get("/oauth", (req, res) => {
  const url = getGmailAuthUrl();

  res.redirect(url);
});


router.get("/oauth/callback", async (req, res, next) => {
  try {
    const code = req.query.code as string;
    const email = await handleOAuthCallback(code);
    await startWatch();
    res.send(`Gmail connected for ${email}. Watching inbox for changes.`);
  } catch (err) {
    next(err);
  }
});
router.post("/webhook", async (req, res, next) => {
  try {

    res.status(204).send();
 
    const raw = Buffer.from(req.body.message.data, "base64").toString("utf-8");
    const { historyId } = JSON.parse(raw) as { emailAddress: string; historyId: string };
 
    const gmail = await getGmailClient();
    const startHistoryId = await getLastHistoryId();
 
    if (!startHistoryId) {
      
      await setLastHistoryId(historyId);
      return;
    }
 
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
    });
 
    for (const record of history.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        const messageId = added.message?.id;
        const threadId = added.message?.threadId;
        if (!messageId) continue;
 
        const full = await gmail.users.messages.get({ userId: "me", id: messageId });
        const headers = full.data.payload?.headers ?? [];
        const getHeader = (name: string) => headers.find((h) => h.name === name)?.value;
 
        await inngest.send({
          name: "email.received",
          data: {
            messageId,
            threadId,
            sender: getHeader("From"),
            recipient: getHeader("To"),
            subject: getHeader("Subject"),
            receivedAt: new Date().toISOString(),
          },
        });
      }
    }
 
    await setLastHistoryId(historyId);
  } catch (err) {
    
    console.error("Gmail webhook processing failed", err);
  }
});
 

export default router;
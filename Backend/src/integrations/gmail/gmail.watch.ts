import { getGmailClient, setLastHistoryId } from "./gmail.auth";

export async function startWatch() {
  const gmail = await getGmailClient();

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: process.env.GMAIL_PUBSUB || null, 
      labelIds: ["INBOX"],
    },
  });

  if (res.data.historyId) {
    await setLastHistoryId(res.data.historyId);
  }

  return res.data;
}
import { gmailAuthClient } from "./gmail.client";
import { google } from "googleapis";
import { query } from "../../db/postclient";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify"

];

export function getGmailAuthUrl() {
  return gmailAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
  });

}



export async function handleOAuthCallback(code: string) {
      const { tokens } = await gmailAuthClient.getToken(code);
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Google did not return the expected tokens");
      }

      console.log("tokens from getToken:", tokens);
      gmailAuthClient.setCredentials(tokens);
      const profile = await google.oauth2({ version: "v2", auth: gmailAuthClient }).userinfo.get();
    
      await query(
        `INSERT INTO gmail_state (email_address, access_token, refresh_token, token_expiry)
        VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))`,
        [profile.data.email, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
      );
    
      return profile.data.email;
}


export async function getGmailClient() {
    const { rows } = await query<{
        id: number;
        access_token: string;
        refresh_token: string;
      }>("SELECT id, access_token, refresh_token FROM gmail_state ORDER BY id DESC LIMIT 1");
    
      if (rows.length === 0) {
        throw new Error("No Gmail account connected yet — visit /api/gmail/auth first");
      }
    
      const state = rows[0]!;
      gmailAuthClient.setCredentials({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
      });


    gmailAuthClient.on("tokens", async (tokens) => {
        if (tokens.access_token) {
          await query("UPDATE gmail_state SET access_token = $1, updated_at = now() WHERE id = $2", [
            tokens.access_token,
            state.id,
          ]);
        }
      });
    
      return google.gmail({ version: "v1", auth: gmailAuthClient });

}



export async function getLastHistoryId(): Promise<string | null> {
  const { rows } = await query<{ last_history_id: string | null }>(
    "SELECT last_history_id FROM gmail_state ORDER BY id DESC LIMIT 1"
  );
  return rows[0]?.last_history_id ?? null;
}

 
export async function setLastHistoryId(historyId: string) {
  await query(
    "UPDATE gmail_state SET last_history_id = $1, updated_at = now() WHERE id = (SELECT id FROM gmail_state ORDER BY id DESC LIMIT 1)",
    [historyId]
  );
}
 

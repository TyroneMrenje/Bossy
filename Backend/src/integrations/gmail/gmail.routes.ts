import { Router } from "express";
import { gmailAuthClient } from "./gmail.client";
import { getGmailAuthUrl,handleOAuthCallback } from "./gmail.auth";

const router = Router();

router.get("/oauth", (req, res) => {
  const url = getGmailAuthUrl();

  res.redirect(url);
});

router.get("/oauth/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Missing authorization code",
      });
    }

    const { tokens } =
      await gmailAuthClient.getToken(code);

    console.log("Google tokens received");

    console.log({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    res.json({
      message: "Gmail connected successfully",
    });
  } catch (error) {
    console.error("Gmail OAuth error:", error);

    res.status(500).json({
      error: "Failed to connect Gmail",
    });
  }
});

export default router;
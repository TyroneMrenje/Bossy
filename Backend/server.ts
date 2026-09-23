import express from "express";
import "dotenv/config";
import { inngest, functions } from "./src/inngest"
import { serve } from "inngest/express";
import gmailRoutes from "./src/integrations/gmail/gmail.routes";

const app = express();

app.use(express.json());

app.use("/api/gmail", gmailRoutes);

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (_req, res) => {
  res.json({
    name: "Bossy",
    status: "running",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bossy running on http://localhost:${PORT}`);
});
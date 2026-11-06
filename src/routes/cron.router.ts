import { timingSafeEqual } from "node:crypto";
import { RequestHandler, Router } from "express";
import { runTransactionCleanup } from "../lib/scheduler";
import { expirePoints } from "../scripts/pointsExpiryScheduler";

const cronRouter = Router();

const requireCronSecret: RequestHandler = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    res.status(503).json({ message: "Cron secret is not configured." });
    return;
  }

  const expectedToken = Buffer.from(`Bearer ${cronSecret}`);
  const receivedToken = Buffer.from(req.get("authorization") ?? "");

  if (
    receivedToken.length !== expectedToken.length ||
    !timingSafeEqual(receivedToken, expectedToken)
  ) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  next();
};

cronRouter.get("/transactions", requireCronSecret, async (_req, res) => {
  try {
    res.status(200).json(await runTransactionCleanup());
  } catch (error) {
    console.error("Transaction cleanup cron failed:", error);
    res.status(500).json({ message: "Transaction cleanup failed." });
  }
});

cronRouter.get("/daily", requireCronSecret, async (_req, res) => {
  try {
    const [transactions, expiredUsers] = await Promise.all([
      runTransactionCleanup(),
      expirePoints(),
    ]);

    res.status(200).json({ ...transactions, expiredUsers });
  } catch (error) {
    console.error("Daily cleanup cron failed:", error);
    res.status(500).json({ message: "Daily cleanup failed." });
  }
});

cronRouter.get("/points", requireCronSecret, async (_req, res) => {
  try {
    const expiredUsers = await expirePoints();
    res.status(200).json({ expiredUsers });
  } catch (error) {
    console.error("Points expiry cron failed:", error);
    res.status(500).json({ message: "Points expiry failed." });
  }
});

export default cronRouter;

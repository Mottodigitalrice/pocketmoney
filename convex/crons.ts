/**
 * Convex cron schedule (Pocket Money).
 *
 * Resilience guarantees (F3):
 *   - `creditWeeklySaveInterest` (Mon 10:00 UTC): on each run the handler
 *     walks back UP TO 4 prior week-starts (the current Monday + 3 missed)
 *     and credits any (child, week) where no `interest` transaction exists
 *     in `[weekStart, weekStart+7d)`. Idempotent: re-running same-day or
 *     within the same week is a no-op. Manual recovery for longer outages:
 *     call `wallets.runInterestForWeek({ weekStartISO })` from the Convex
 *     dashboard. See `convex/README.md#manual-recovery`.
 *   - `cleanupApprovedPhotoProofs` (Mon 10:15 UTC): on each run the handler
 *     sweeps ALL approved jobInstances with an undeleted proof older than
 *     14 days, up to a 90-day lookback floor (bounds scan cost; anything
 *     older requires manual intervention). Idempotent: gated on
 *     `proofDeletedAt === undefined`.
 *
 * Schedule (kept unchanged by F3 — only handler logic is resilient now):
 *   Mon 10:00 UTC → Save-interest
 *   Mon 10:15 UTC → Photo-proof cleanup
 */
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly(
  "credit weekly Save jar interest",
  {
    dayOfWeek: "monday",
    hourUTC: 10,
    minuteUTC: 0,
  },
  internal.functions.wallets.creditWeeklySaveInterest,
);

crons.weekly(
  "delete approved photo proofs after retention window",
  {
    dayOfWeek: "monday",
    hourUTC: 10,
    minuteUTC: 15,
  },
  internal.functions.jobInstances.cleanupApprovedPhotoProofs,
);

export default crons;

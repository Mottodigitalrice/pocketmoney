/**
 * Sentry sample-rate constants — single source of truth.
 *
 * These values are imported by all three Sentry runtime configs:
 *   - `sentry.server.config.ts`   (Node.js runtime)
 *   - `sentry.edge.config.ts`     (Vercel Edge / Middleware runtime)
 *   - `src/instrumentation-client.ts` (browser)
 *
 * Change the value HERE and all three runtimes update together. Sample rates
 * directly translate to Sentry spend once a real DSN is set, so they must
 * always move in lockstep across runtimes.
 *
 * Production tuning lives behind the `NODE_ENV` switch in each config:
 * development uses 1.0 traces (full sampling for local debugging); all other
 * environments use the constants below.
 */

/**
 * Fraction of transactions sampled for performance tracing in non-dev envs.
 * 0.1 = 10% of transactions sent to Sentry.
 */
export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

/**
 * Fraction of user sessions recorded as Session Replays. Kept at 0 in stub
 * mode so flipping a DSN on never accidentally floods replay traffic. Tune up
 * deliberately when a real prod replay budget is set.
 */
export const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = 0;

/**
 * Fraction of sessions recorded as Session Replays specifically when an error
 * occurs. Kept at 0 for the same spend-safety reason as the session rate.
 */
export const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = 0;

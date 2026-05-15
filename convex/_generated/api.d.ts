/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as __smoke___cross_tenant from "../__smoke__/cross_tenant.js";
import type * as crons from "../crons.js";
import type * as functions_children from "../functions/children.js";
import type * as functions_goals from "../functions/goals.js";
import type * as functions_jobInstances from "../functions/jobInstances.js";
import type * as functions_jobs from "../functions/jobs.js";
import type * as functions_luckyChests from "../functions/luckyChests.js";
import type * as functions_scheduledJobs from "../functions/scheduledJobs.js";
import type * as functions_transactions from "../functions/transactions.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_wallets from "../functions/wallets.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cronMath from "../lib/cronMath.js";
import type * as lib_migrationDiff from "../lib/migrationDiff.js";
import type * as lib_rankMath from "../lib/rankMath.js";
import type * as lib_recurrence from "../lib/recurrence.js";
import type * as lib_walletMath from "../lib/walletMath.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "__smoke__/cross_tenant": typeof __smoke___cross_tenant;
  crons: typeof crons;
  "functions/children": typeof functions_children;
  "functions/goals": typeof functions_goals;
  "functions/jobInstances": typeof functions_jobInstances;
  "functions/jobs": typeof functions_jobs;
  "functions/luckyChests": typeof functions_luckyChests;
  "functions/scheduledJobs": typeof functions_scheduledJobs;
  "functions/transactions": typeof functions_transactions;
  "functions/users": typeof functions_users;
  "functions/wallets": typeof functions_wallets;
  "lib/auth": typeof lib_auth;
  "lib/cronMath": typeof lib_cronMath;
  "lib/migrationDiff": typeof lib_migrationDiff;
  "lib/rankMath": typeof lib_rankMath;
  "lib/recurrence": typeof lib_recurrence;
  "lib/walletMath": typeof lib_walletMath;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

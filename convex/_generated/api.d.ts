/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as careerAlgorithm from "../careerAlgorithm.js";
import type * as careerMap from "../careerMap.js";
import type * as counselor from "../counselor.js";
import type * as http from "../http.js";
import type * as linkup from "../linkup.js";
import type * as quiz from "../quiz.js";
import type * as reflections from "../reflections.js";
import type * as savedActivities from "../savedActivities.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  activities: typeof activities;
  admin: typeof admin;
  ai: typeof ai;
  auth: typeof auth;
  careerAlgorithm: typeof careerAlgorithm;
  careerMap: typeof careerMap;
  counselor: typeof counselor;
  http: typeof http;
  linkup: typeof linkup;
  quiz: typeof quiz;
  reflections: typeof reflections;
  savedActivities: typeof savedActivities;
  users: typeof users;
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

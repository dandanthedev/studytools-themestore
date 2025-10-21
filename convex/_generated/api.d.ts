/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as functions_admin from "../functions/admin.js";
import type * as functions_myThemes from "../functions/myThemes.js";
import type * as functions_themes from "../functions/themes.js";
import type * as functions_user from "../functions/user.js";
import type * as http from "../http.js";
import type * as otp from "../otp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "functions/admin": typeof functions_admin;
  "functions/myThemes": typeof functions_myThemes;
  "functions/themes": typeof functions_themes;
  "functions/user": typeof functions_user;
  http: typeof http;
  otp: typeof otp;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

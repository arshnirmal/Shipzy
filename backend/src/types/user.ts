// services/backend/src/types/user.ts

import type { z } from "zod";
import type { UserProfileResponse } from "../modules/users/users.zod.js";
import {
  AuthUserDbZ,
  RequestUserZ,
  UserProfileDbZ,
} from "../schemas/db.zod.js";

export type DbUser = z.infer<typeof UserProfileDbZ>;
export type AuthUser = z.infer<typeof AuthUserDbZ>;

// Canonical API user profile (camelCase, API response)
export type UserProfile = UserProfileResponse;

// Lightweight user object attached to request after authentication
export type RequestUser = z.infer<typeof RequestUserZ>;

export { AuthUserDbZ, RequestUserZ, UserProfileDbZ };

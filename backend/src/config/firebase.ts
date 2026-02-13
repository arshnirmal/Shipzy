// services/backend/src/config/firebase.ts
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./env.js";
import logger from "./logger.js";

// Initialize Firebase Admin SDK using service account key file
// eslint-disable-next-line import/no-mutable-exports
let firebaseApp: admin.app.App | undefined;
// eslint-disable-next-line import/no-mutable-exports
let firebaseAuth: admin.auth.Auth | undefined;

try {
  // Get the directory of the current file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Try multiple possible locations for the Firebase service account key file
  const possiblePaths = [
    // For Docker containers (file copied to /app)
    path.resolve(
      __dirname,
      "../../../shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json",
    ),
    // For Docker containers (file in backend directory)
    path.resolve(
      __dirname,
      "../../shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json",
    ),
    // For local development (file in project root)
    path.resolve(
      __dirname,
      "../../../../shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json",
    ),
    // Alternative path for local development
    path.resolve(
      process.cwd(),
      "shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json",
    ),
    // Another possible location
    path.resolve(
      __dirname,
      "../../shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json",
    ),
  ];

  let serviceAccount = null;

  // Check if Firebase credentials are provided via environment variables
  if (
    config.firebase.projectId &&
    config.firebase.clientEmail &&
    config.firebase.privateKey
  ) {
    logger.info("Initializing Firebase Admin SDK using environment variables");
    serviceAccount = {
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    };
  } else {
    // Try each possible path
    for (const testPath of possiblePaths) {
      logger.info(`Checking Firebase service account path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(testPath, "utf8"));
        logger.info(`Found Firebase service account at: ${testPath}`);
        break;
      }
    }
  }

  if (serviceAccount) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseAuth = admin.auth();
    logger.info(
      "Firebase Admin SDK initialized using service account key file",
    );
  } else {
    logger.warn(
      "Firebase service account key file not found - authentication features will be disabled",
    );
    logger.warn("Tried the following paths:");
    for (const path of possiblePaths) {
      logger.warn(`  - ${path}`);
    }
    logger.warn(`Current working directory: ${process.cwd()}`);
  }
} catch (error) {
  logger.error({
    msg: "Failed to initialize Firebase Admin SDK",
    error: (error as Error).message,
  });
  logger.warn("Authentication features will be disabled");
}

// Export firebaseAuth (may be undefined if not initialized)
export { firebaseAuth };

/**
 * Verify Firebase ID token
 * @param idToken - Firebase ID token
 * @returns Decoded token
 */
export const verifyFirebaseToken = async (
  idToken: string,
): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseAuth) {
    throw new Error("Firebase authentication is not available");
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error({
      msg: "Firebase token verification failed",
      error: (error as Error).message,
    });
    throw error;
  }
};

export default firebaseApp;

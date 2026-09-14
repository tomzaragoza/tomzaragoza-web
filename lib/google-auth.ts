import "server-only";

import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  authMongoClient?: MongoClient;
};

let auth: ReturnType<typeof betterAuth> | undefined;

export function getGoogleAuth() {
  if (auth) return auth;

  const uri = process.env.MONGODB_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!uri || !secret || !baseURL || !clientId || !clientSecret) {
    return null;
  }

  const client = globalForMongo.authMongoClient ?? new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });
  globalForMongo.authMongoClient = client;

  auth = betterAuth<BetterAuthOptions>({
    appName: "Tom Zaragoza",
    baseURL,
    secret,
    database: mongodbAdapter(client.db(process.env.MONGODB_DB || "tomzaragoza")),
    user: { modelName: "auth_users" },
    session: { modelName: "auth_sessions" },
    account: {
      modelName: "auth_accounts",
      encryptOAuthTokens: true
    },
    verification: { modelName: "auth_verifications" },
    socialProviders: {
      google: {
        clientId,
        clientSecret,
        accessType: "online",
        prompt: "select_account"
      }
    }
  });

  return auth;
}

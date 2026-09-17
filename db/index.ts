import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function getD1Binding() {
  const runtimeEnv = typeof env !== "undefined" ? env : undefined;
  return runtimeEnv?.DB ?? (typeof process !== "undefined" ? process.env.DB : undefined);
}

export function getDb() {
  const db = getD1Binding();
  if (!db) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Run `npm run db:setup` and restart the dev server before using the app."
    );
  }

  return drizzle(db, { schema });
}

export function database(){
 const db = getD1Binding();
 if(!db)throw new Error('Cloudflare D1 binding `DB` is unavailable. Run `npm run db:setup` and restart the dev server before using the app.');
 return db;
}

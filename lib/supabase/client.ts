"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Supabase client สำหรับ Client Component (ใช้เฉพาะการล็อกอิน/ออกจากระบบของ Admin) */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(env.url, env.key);
}

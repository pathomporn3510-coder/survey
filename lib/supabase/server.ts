import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client ฝั่ง Server ที่ผูกกับ Session ของผู้ใช้ (อ่าน/เขียน cookie)
 * ใช้ใน Server Component, Route Handler และ Server Action
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // ถูกเรียกจาก Server Component ซึ่งตั้ง cookie ไม่ได้ — proxy.ts จะรีเฟรช session ให้แทน
        }
      },
    },
  });
}

/**
 * Supabase client แบบไม่ผูก Session (สิทธิ์ anon) สำหรับบันทึกแบบประเมินจาก Route Handler
 * สิทธิ์ถูกจำกัดด้วย RLS: INSERT ได้อย่างเดียว อ่านข้อมูลไม่ได้
 */
export function createAnonClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  return createPlainClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

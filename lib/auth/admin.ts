import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminCheck =
  | { status: "not_configured" }
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null }
  | { status: "admin"; userId: string; email: string | null };

/**
 * ตรวจสอบสิทธิ์ Admin ฝั่ง Server (Data Access Layer)
 * - getUser() ยืนยัน token กับ Supabase Auth ทุกครั้ง (ไม่เชื่อ cookie อย่างเดียว)
 * - ตรวจว่ามี user_id ในตาราง admin_users (RLS อนุญาตให้อ่านเฉพาะแถวของตนเอง)
 * ทุกหน้า/Route Handler ที่อ่านผลประเมินต้องเรียกฟังก์ชันนี้ก่อนเสมอ
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured()) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { status: "anonymous" };

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) return { status: "forbidden", email: user.email ?? null };
  return { status: "admin", userId: user.id, email: user.email ?? null };
}

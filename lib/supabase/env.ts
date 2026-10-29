/**
 * อ่านค่าการเชื่อมต่อ Supabase จาก Environment Variables
 * รองรับทั้ง NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (รูปแบบใหม่) และ NEXT_PUBLIC_SUPABASE_ANON_KEY (รูปแบบเดิม)
 * ไม่ใช้ Service Role Key ในโปรเจกต์นี้ — สิทธิ์ทั้งหมดควบคุมด้วย RLS
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

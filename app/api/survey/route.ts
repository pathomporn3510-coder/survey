import { NextResponse, type NextRequest } from "next/server";
import { departmentFullName } from "@/lib/constants/departments";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAnonClient } from "@/lib/supabase/server";
import { surveySchema } from "@/lib/validation/survey";
import type { ApiResult } from "@/types/survey";

const MAX_BODY_BYTES = 16 * 1024;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function json(body: ApiResult, status = 200) {
  return NextResponse.json(body, { status });
}

/** บันทึกแบบประเมิน — ตรวจสอบข้อมูลซ้ำฝั่ง Server ทุกครั้ง ไม่เชื่อข้อมูลจาก Client */
export async function POST(request: NextRequest) {
  // ป้องกันการส่งข้ามโดเมน (CSRF เบื้องต้น)
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: "คำขอไม่ถูกต้อง" }, 403);
  }

  if (!rateLimit(`survey:${clientIp(request.headers)}`, 20, 60_000)) {
    return json(
      { ok: false, message: "มีการส่งแบบประเมินถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" },
      429,
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, message: "ข้อมูลมีขนาดใหญ่เกินกำหนด" }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" }, 400);
  }

  const parsed = surveySchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    // บอท (กรอก honeypot) — ตอบเหมือนสำเร็จแต่ไม่บันทึก
    if (fieldErrors.website) return json({ ok: true });
    return json(
      { ok: false, message: "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง", fieldErrors },
      400,
    );
  }

  if (!isSupabaseConfigured()) {
    console.error("[survey] Supabase environment variables are missing");
    return json(
      { ok: false, message: "ระบบยังไม่พร้อมรับแบบประเมิน กรุณาติดต่อผู้ดูแลระบบ" },
      503,
    );
  }

  const d = parsed.data;
  const record = {
    submission_id: d.submission_id,
    gender: d.gender,
    gender_other: d.gender_other,
    age_range: d.age_range,
    department_code: d.department_code,
    department_name: departmentFullName(d.department_code),
    d1: d.d1, d2: d.d2, d3: d.d3, d4: d.d4,
    q1: d.q1, q2: d.q2, q3: d.q3, q4: d.q4,
    u1: d.u1, u2: d.u2, u3: d.u3, u4: d.u4,
    b1: d.b1, b2: d.b2, b3: d.b3, b4: d.b4,
    favorite_feedback: d.favorite_feedback,
    improvement_feedback: d.improvement_feedback,
    other_feedback: d.other_feedback,
  };

  try {
    const supabase = createAnonClient();
    const { error } = await supabase.from("survey_responses").insert(record);

    if (error) {
      // submission_id ซ้ำ = เคยบันทึกสำเร็จแล้ว (เช่นกดส่งซ้ำ/ลองใหม่หลังเน็ตหลุด)
      if (error.code === "23505") return json({ ok: true });
      if (error.message?.includes("rate_limited")) {
        return json(
          { ok: false, message: "ขณะนี้มีผู้ส่งแบบประเมินจำนวนมาก กรุณาลองใหม่ในอีก 1 นาที" },
          429,
        );
      }
      console.error("[survey] insert failed", error.code, error.message);
      return json(
        { ok: false, message: "ไม่สามารถบันทึกแบบประเมินได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
        500,
      );
    }
    return json({ ok: true }, 201);
  } catch (e) {
    console.error("[survey] unexpected error", e);
    return json(
      { ok: false, message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
      503,
    );
  }
}

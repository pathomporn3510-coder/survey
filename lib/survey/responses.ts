import "server-only";
import { createClient } from "@/lib/supabase/server";
import { QUESTION_CODES } from "@/lib/survey/questions";
import type { SurveyResponseRow } from "@/types/survey";

const COLUMNS = [
  "id",
  "submission_id",
  "gender",
  "gender_other",
  "age_range",
  "department_code",
  "department_name",
  ...QUESTION_CODES,
  "favorite_feedback",
  "improvement_feedback",
  "other_feedback",
  "created_at",
].join(",");

const PAGE = 1000;

/**
 * ดึงผลประเมินทั้งหมดจากฐานข้อมูลจริง (แบ่งดึงทีละ 1,000 แถว)
 * ต้องเรียกหลัง checkAdmin() เท่านั้น — RLS จะคืนค่าว่างถ้าไม่ใช่ Admin อยู่แล้ว
 */
export async function fetchAllResponses(): Promise<SurveyResponseRow[]> {
  const supabase = await createClient();
  const rows: SurveyResponseRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("survey_responses")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch responses failed: ${error.code ?? ""}`);
    rows.push(...((data ?? []) as unknown as SurveyResponseRow[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

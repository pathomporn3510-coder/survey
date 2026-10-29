import type { CategoryAverages, SatisfactionLevel, Scores } from "@/types/survey";
import {
  CATEGORIES,
  QUESTION_CODES,
  QUESTIONS_BY_CATEGORY,
  type CategoryKey,
} from "./questions";

/**
 * สูตรคำนวณคะแนน — ใช้ร่วมกันทั้ง Dashboard, ตาราง และไฟล์ส่งออก
 *  - ค่าเฉลี่ยรายด้าน = ผลรวม 4 ข้อของด้านนั้น / 4
 *  - ค่าเฉลี่ยรวม    = ผลรวมทั้ง 16 ข้อ / 16
 */
export function categoryAverage(scores: Scores, key: CategoryKey): number {
  const codes = QUESTIONS_BY_CATEGORY[key];
  return codes.reduce((s, c) => s + scores[c], 0) / codes.length;
}

export function categoryAverages(scores: Scores): CategoryAverages {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c.key, categoryAverage(scores, c.key)]),
  ) as CategoryAverages;
}

export function overallAverage(scores: Scores): number {
  return QUESTION_CODES.reduce((s, c) => s + scores[c], 0) / QUESTION_CODES.length;
}

/**
 * การแปลผลคะแนนเฉลี่ย
 *  4.21–5.00 มากที่สุด | 3.41–4.20 มาก | 2.61–3.40 ปานกลาง | 1.81–2.60 น้อย | 1.00–1.80 น้อยที่สุด
 * ปัดเป็นทศนิยม 2 ตำแหน่งก่อนเทียบช่วง เพื่อให้ค่าที่แสดงกับระดับที่แปลผลตรงกันเสมอ
 */
export function interpretScore(avg: number): SatisfactionLevel {
  const v = round2(avg);
  if (v >= 4.21) return "มากที่สุด";
  if (v >= 3.41) return "มาก";
  if (v >= 2.61) return "ปานกลาง";
  if (v >= 1.81) return "น้อย";
  return "น้อยที่สุด";
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatScore(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "-";
  return round2(n).toFixed(2);
}

export type AggregateSummary = {
  count: number;
  overall: number | null;
  categories: Record<CategoryKey, number | null>;
  perQuestion: Record<string, number | null>;
};

/**
 * สรุปค่าเฉลี่ยจากหลายรายการ
 * ค่าเฉลี่ยรวม = ผลรวมคะแนนทุกข้อของทุกคน / (จำนวนคน × 16)
 * (เท่ากับค่าเฉลี่ยของค่าเฉลี่ยรายคน เพราะทุกคนตอบครบ 16 ข้อ)
 */
export function aggregate(rows: Scores[]): AggregateSummary {
  const count = rows.length;
  const perQuestion: Record<string, number | null> = {};
  for (const code of QUESTION_CODES) {
    perQuestion[code] = count ? rows.reduce((s, r) => s + r[code], 0) / count : null;
  }
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => {
      if (!count) return [c.key, null];
      const codes = QUESTIONS_BY_CATEGORY[c.key];
      return [c.key, codes.reduce((s, code) => s + (perQuestion[code] as number), 0) / codes.length];
    }),
  ) as Record<CategoryKey, number | null>;
  const overall = count
    ? QUESTION_CODES.reduce((s, code) => s + (perQuestion[code] as number), 0) / QUESTION_CODES.length
    : null;
  return { count, overall, categories, perQuestion };
}

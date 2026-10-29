import type { SurveyResponseRow } from "@/types/survey";

/** ตัวกรองที่ใช้ร่วมกันระหว่าง Dashboard (Client) และการส่งออก CSV (Server) */
export type ResponseFilters = {
  department?: string;
  age?: string;
  gender?: string;
  /** YYYY-MM-DD (เวลาไทย) */
  from?: string;
  to?: string;
  q?: string;
};

export const FILTER_KEYS = ["department", "age", "gender", "from", "to", "q"] as const;

/** แปลงเวลาเป็นวันที่ตามเขตเวลาไทย (YYYY-MM-DD) */
export function bangkokDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function applyFilters(
  rows: SurveyResponseRow[],
  f: ResponseFilters,
): SurveyResponseRow[] {
  const q = f.q?.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.department && r.department_code !== f.department) return false;
    if (f.age && r.age_range !== f.age) return false;
    if (f.gender && r.gender !== f.gender) return false;
    if (f.from || f.to) {
      const d = bangkokDate(r.created_at);
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
    }
    if (q) {
      const hay = [
        r.department_name,
        r.gender_other,
        r.favorite_feedback,
        r.improvement_feedback,
        r.other_feedback,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filtersFromSearchParams(sp: URLSearchParams): ResponseFilters {
  const out: ResponseFilters = {};
  for (const k of FILTER_KEYS) {
    const v = sp.get(k);
    if (v) out[k] = v.slice(0, 200);
  }
  return out;
}

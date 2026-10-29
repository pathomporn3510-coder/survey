import { NextResponse, type NextRequest } from "next/server";
import { checkAdmin } from "@/lib/auth/admin";
import { ageRangeLabel, genderLabel } from "@/lib/constants/demographics";
import { applyFilters, bangkokDate, filtersFromSearchParams } from "@/lib/survey/filters";
import { CATEGORIES, QUESTION_CODES } from "@/lib/survey/questions";
import { fetchAllResponses } from "@/lib/survey/responses";
import {
  categoryAverages,
  formatScore,
  interpretScore,
  overallAverage,
} from "@/lib/survey/scoring";

/** ป้องกัน CSV/Formula injection เมื่อเปิดใน Excel */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** ส่งออกผลประเมินเป็น CSV (UTF-8 BOM เพื่อให้ Excel แสดงภาษาไทยถูกต้อง) — เฉพาะ Admin */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin();
  if (auth.status !== "admin") {
    return NextResponse.json(
      { ok: false, message: "ไม่มีสิทธิ์เข้าถึงข้อมูล" },
      { status: auth.status === "anonymous" ? 401 : 403 },
    );
  }

  let rows;
  try {
    rows = await fetchAllResponses();
  } catch (e) {
    console.error("[export]", e);
    return NextResponse.json({ ok: false, message: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
  rows = applyFilters(rows, filtersFromSearchParams(request.nextUrl.searchParams));

  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const header = [
    "id",
    "วันที่ส่ง",
    "เวลา",
    "รหัสแผนก",
    "ชื่อแผนก",
    "เพศ",
    "เพศ (ระบุเพิ่มเติม)",
    "ช่วงอายุ",
    ...QUESTION_CODES.map((c) => c.toUpperCase()),
    ...CATEGORIES.map((c) => `เฉลี่ย${c.titleTh}`),
    "เฉลี่ยรวม",
    "ระดับความพึงพอใจ",
    "สิ่งที่ชอบมากที่สุด",
    "สิ่งที่ต้องการให้พัฒนา",
    "ข้อคิดเห็นอื่น ๆ",
  ];

  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    const cat = categoryAverages(r);
    const all = overallAverage(r);
    lines.push(
      [
        r.id,
        bangkokDate(r.created_at),
        timeFmt.format(new Date(r.created_at)),
        r.department_code,
        r.department_name,
        genderLabel(r.gender),
        r.gender_other,
        ageRangeLabel(r.age_range),
        ...QUESTION_CODES.map((c) => r[c]),
        ...CATEGORIES.map((c) => formatScore(cat[c.key])),
        formatScore(all),
        interpretScore(all),
        r.favorite_feedback,
        r.improvement_feedback,
        r.other_feedback,
      ]
        .map(cell)
        .join(","),
    );
  }

  const stamp = bangkokDate(new Date().toISOString());
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leave-survey-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

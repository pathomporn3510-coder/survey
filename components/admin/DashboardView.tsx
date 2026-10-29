"use client";

import { Download, FilterX } from "lucide-react";
import { useMemo, useState } from "react";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS } from "@/lib/constants/demographics";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { applyFilters, FILTER_KEYS, type ResponseFilters } from "@/lib/survey/filters";
import { aggregate } from "@/lib/survey/scoring";
import type { SurveyResponseRow } from "@/types/survey";
import { DashboardStats } from "./DashboardStats";
import { FeedbackList } from "./FeedbackList";
import { SurveyCharts } from "./SurveyCharts";
import { SurveyTable } from "./SurveyTable";

const control =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function DashboardView({ rows }: { rows: SurveyResponseRow[] }) {
  const [filters, setFilters] = useState<ResponseFilters>({});
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const summary = useMemo(() => aggregate(filtered), [filtered]);
  const active = FILTER_KEYS.some((k) => filters[k]);

  const set = (k: keyof ResponseFilters) => (v: string) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }));

  const exportHref = (() => {
    const sp = new URLSearchParams();
    for (const k of FILTER_KEYS) if (filters[k]) sp.set(k, filters[k] as string);
    const qs = sp.toString();
    return `/api/admin/export${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard สรุปผลการประเมิน</h1>
          <p className="mt-1 text-sm text-slate-500">
            คำนวณจากข้อมูลจริงในฐานข้อมูล
            {active ? ` · แสดง ${filtered.length} จาก ${rows.length} รายการตามตัวกรอง` : ` · ทั้งหมด ${rows.length} รายการ`}
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Download className="h-4 w-4" aria-hidden />
          ส่งออก CSV (เปิดด้วย Excel ได้)
        </a>
      </div>

      {/* ตัวกรอง — มีผลกับสรุป กราฟ ตาราง และข้อเสนอแนะทั้งหมด */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-500">ค้นหา (แผนก / ข้อเสนอแนะ)</span>
            <input type="search" value={filters.q ?? ""} onChange={(e) => set("q")(e.target.value)} placeholder="พิมพ์คำค้นหา..." className={control} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">แผนก</span>
            <select value={filters.department ?? ""} onChange={(e) => set("department")(e.target.value)} className={control}>
              <option value="">ทุกแผนก</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>{d.nameTh}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">ช่วงอายุ</span>
            <select value={filters.age ?? ""} onChange={(e) => set("age")(e.target.value)} className={control}>
              <option value="">ทุกช่วงอายุ</option>
              {AGE_RANGE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-500">เพศ</span>
            <select value={filters.gender ?? ""} onChange={(e) => set("gender")(e.target.value)} className={control}>
              <option value="">ทุกเพศ</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">ตั้งแต่</span>
              <input type="date" value={filters.from ?? ""} max={filters.to} onChange={(e) => set("from")(e.target.value)} className={control} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">ถึง</span>
              <input type="date" value={filters.to ?? ""} min={filters.from} onChange={(e) => set("to")(e.target.value)} className={control} />
            </label>
          </div>
        </div>
        {active ? (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-blue-700 hover:bg-sky-50"
          >
            <FilterX className="h-4 w-4" aria-hidden /> ล้างตัวกรอง
          </button>
        ) : null}
      </div>

      <section aria-labelledby="h-overview" className="space-y-4">
        <h2 id="h-overview" className="text-lg font-semibold text-slate-800">สรุปภาพรวม</h2>
        <DashboardStats summary={summary} />
        <p className="text-xs text-slate-500">
          เกณฑ์แปลผล: 4.21–5.00 มากที่สุด · 3.41–4.20 มาก · 2.61–3.40 ปานกลาง · 1.81–2.60 น้อย · 1.00–1.80 น้อยที่สุด
        </p>
      </section>

      <section aria-labelledby="h-charts" className="space-y-4">
        <h2 id="h-charts" className="text-lg font-semibold text-slate-800">กราฟ</h2>
        <SurveyCharts rows={filtered} summary={summary} />
      </section>

      <section aria-labelledby="h-table" className="space-y-4">
        <h2 id="h-table" className="text-lg font-semibold text-slate-800">ตารางผลการประเมิน</h2>
        <SurveyTable key={JSON.stringify(filters)} rows={filtered} />
      </section>

      <section aria-labelledby="h-feedback" className="space-y-4">
        <h2 id="h-feedback" className="text-lg font-semibold text-slate-800">ข้อเสนอแนะ</h2>
        <FeedbackList rows={filtered} />
      </section>
    </div>
  );
}

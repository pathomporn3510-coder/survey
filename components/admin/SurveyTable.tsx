"use client";

import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ageRangeLabel, genderLabel } from "@/lib/constants/demographics";
import { departmentShortName } from "@/lib/constants/departments";
import { formatDateTime } from "@/lib/survey/format";
import { CATEGORIES, FEEDBACK_FIELDS, RATING_LABELS } from "@/lib/survey/questions";
import {
  categoryAverages,
  formatScore,
  interpretScore,
  overallAverage,
} from "@/lib/survey/scoring";
import type { SurveyResponseRow } from "@/types/survey";

const PAGE_SIZE = 10;

export function SurveyTable({ rows }: { rows: SurveyResponseRow[] }) {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SurveyResponseRow | null>(null);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">วันที่ตอบ</th>
              <th className="px-4 py-3 font-medium">แผนก</th>
              <th className="px-4 py-3 font-medium">อายุ</th>
              <th className="px-4 py-3 font-medium">เพศ</th>
              {CATEGORIES.map((c) => (
                <th key={c.key} className="px-3 py-3 text-right font-medium">
                  {c.titleTh.replace("ด้าน", "")}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">เฉลี่ยรวม</th>
              <th className="px-4 py-3">
                <span className="sr-only">รายละเอียด</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                  ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              slice.map((r) => {
                const cat = categoryAverages(r);
                const all = overallAverage(r);
                return (
                  <tr key={r.id} className="hover:bg-sky-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3 text-slate-700">{departmentShortName(r.department_code)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{ageRangeLabel(r.age_range)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{genderLabel(r.gender)}</td>
                    {CATEGORIES.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-right tabular-nums text-slate-700">
                        {formatScore(cat[c.key])}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold tabular-nums text-slate-900">{formatScore(all)}</span>
                      <span className="block text-xs text-slate-500">{interpretScore(all)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(r)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-blue-700 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                        ดู
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
        <span>
          ทั้งหมด {rows.length.toLocaleString("th-TH")} รายการ · หน้า {current}/{pages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> ก่อนหน้า
          </button>
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current >= pages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
          >
            ถัดไป <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {detail ? <ResponseDetail row={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function ResponseDetail({ row, onClose }: { row: SurveyResponseRow; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  const cat = categoryAverages(row);
  const all = overallAverage(row);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="detail-title"
      className="m-auto w-[min(100%-2rem,48rem)] rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 id="detail-title" className="text-lg font-semibold text-slate-900">
              รายละเอียดคำตอบ
            </h2>
            <p className="text-sm text-slate-500">
              {formatDateTime(row.created_at)} · {row.department_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5 text-sm">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info label="เพศ" value={genderLabel(row.gender) + (row.gender_other ? ` (${row.gender_other})` : "")} />
            <Info label="อายุ" value={ageRangeLabel(row.age_range)} />
            <Info label="เฉลี่ยรวม" value={`${formatScore(all)} · ${interpretScore(all)}`} />
            <Info label="รหัสแผนก" value={row.department_code} />
          </dl>

          {CATEGORIES.map((c) => (
            <section key={c.key}>
              <h3 className="flex items-baseline justify-between font-semibold text-slate-800">
                {c.titleTh}
                <span className="text-sm font-normal text-slate-500">
                  เฉลี่ย {formatScore(cat[c.key])} · {interpretScore(cat[c.key])}
                </span>
              </h3>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {c.questions.map((q) => {
                  const s = row[q.code] as 1 | 2 | 3 | 4 | 5;
                  return (
                    <li key={q.code} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <span className="text-slate-700">
                        <b className="mr-2 text-blue-700">{q.label}</b>
                        {q.text}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-900">
                        <span className="text-amber-500" aria-hidden>★</span> {s} ({RATING_LABELS[s]})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section>
            <h3 className="font-semibold text-slate-800">ข้อเสนอแนะ</h3>
            <dl className="mt-2 space-y-3">
              {FEEDBACK_FIELDS.map((f) => (
                <div key={f.name} className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-medium text-slate-500">{f.label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-800">{row[f.name] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

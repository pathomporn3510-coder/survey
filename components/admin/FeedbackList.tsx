"use client";

import { MessageSquareText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/survey/format";
import { FEEDBACK_FIELDS, type FeedbackField } from "@/lib/survey/questions";
import type { SurveyResponseRow } from "@/types/survey";

const PAGE = 20;

/**
 * รายการข้อเสนอแนะ — แสดงเฉพาะข้อความและวันที่ (ไม่แสดงเพศ/อายุ/แผนก)
 * เพื่อลดโอกาสระบุตัวตนผู้ตอบจากข้อความ
 */
export function FeedbackList({ rows }: { rows: SurveyResponseRow[] }) {
  const [tab, setTab] = useState<FeedbackField>("favorite_feedback");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FEEDBACK_FIELDS.map((f) => [f.name, rows.filter((r) => r[f.name]).length]),
      ) as Record<FeedbackField, number>,
    [rows],
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r[tab])
      .filter((r) => !q || (r[tab] as string).toLowerCase().includes(q))
      .map((r) => ({ id: r.id, text: r[tab] as string, at: r.created_at }));
  }, [rows, tab, query]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="ประเภทข้อเสนอแนะ" className="flex flex-wrap gap-2">
          {FEEDBACK_FIELDS.map((f) => (
            <button
              key={f.name}
              type="button"
              role="tab"
              aria-selected={tab === f.name}
              onClick={() => {
                setTab(f.name);
                setLimit(PAGE);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === f.name ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.label.replace("?", "")} ({counts[f.name]})
            </button>
          ))}
        </div>
        <label className="relative block lg:w-72">
          <span className="sr-only">ค้นหาข้อเสนอแนะ</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="ค้นหาข้อความ..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-400">
          <MessageSquareText className="h-4 w-4" aria-hidden /> ไม่มีข้อเสนอแนะ
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.slice(0, limit).map((it) => (
            <li key={it.id} className="px-5 py-4">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{it.text}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(it.at)}</p>
            </li>
          ))}
        </ul>
      )}
      {items.length > limit ? (
        <div className="border-t border-slate-100 p-3 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-700 hover:bg-sky-50"
          >
            แสดงเพิ่ม ({items.length - limit} รายการ)
          </button>
        </div>
      ) : null}
    </div>
  );
}

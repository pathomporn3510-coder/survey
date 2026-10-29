import { Users } from "lucide-react";
import { CATEGORIES } from "@/lib/survey/questions";
import { formatScore, interpretScore, type AggregateSummary } from "@/lib/survey/scoring";

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? "border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-sm ${highlight ? "text-blue-100" : "text-slate-500"}`}>{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {sub ? (
        <p className={`mt-1 text-sm font-medium ${highlight ? "text-blue-100" : "text-slate-600"}`}>{sub}</p>
      ) : null}
    </div>
  );
}

export function DashboardStats({ summary }: { summary: AggregateSummary }) {
  const level = (n: number | null) => (n == null ? "ยังไม่มีข้อมูล" : `ระดับ${interpretScore(n)}`);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-blue-700">
          <Users className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm text-slate-500">จำนวนผู้ตอบแบบประเมิน</p>
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {summary.count.toLocaleString("th-TH")}
            <span className="ml-1 text-base font-normal text-slate-500">คน</span>
          </p>
        </div>
      </div>
      <StatCard
        highlight
        label="คะแนนเฉลี่ยรวม (16 ข้อ)"
        value={formatScore(summary.overall)}
        sub={level(summary.overall)}
      />
      {CATEGORIES.map((c) => (
        <StatCard
          key={c.key}
          label={`${c.titleTh} (${c.titleEn})`}
          value={formatScore(summary.categories[c.key])}
          sub={level(summary.categories[c.key])}
        />
      ))}
    </div>
  );
}

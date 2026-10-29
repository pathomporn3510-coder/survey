"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS } from "@/lib/constants/demographics";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { bangkokDate } from "@/lib/survey/filters";
import { formatDay } from "@/lib/survey/format";
import { CATEGORIES } from "@/lib/survey/questions";
import { formatScore, interpretScore, type AggregateSummary } from "@/lib/survey/scoring";
import type { SurveyResponseRow } from "@/types/survey";

/* ชุดสีจาก palette ที่ผ่านการตรวจสอบ (ชุดข้อมูลเดียว = น้ำเงิน slot 1) */
const SERIES = "#2a78d6";
const GRID = "#e5e7eb";
const AXIS = "#52514e";
const tick = { fill: AXIS, fontSize: 12 };

function ChartCard({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5">
      <figcaption>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {desc ? <p className="text-sm text-slate-500">{desc}</p> : null}
      </figcaption>
      <div className="mt-4">{children}</div>
    </figure>
  );
}

function Empty() {
  return <p className="flex h-56 items-center justify-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>;
}

type TipProps = {
  active?: boolean;
  payload?: { payload: Record<string, unknown> }[];
  render: (p: Record<string, unknown>) => ReactNode;
};
function Tip({ active, payload, render }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-md">
      {render(payload[0].payload)}
    </div>
  );
}

function countBy<T extends string>(
  rows: SurveyResponseRow[],
  key: (r: SurveyResponseRow) => T,
  options: readonly { value: T; label: string }[],
) {
  const total = rows.length || 1;
  return options.map((o) => {
    const count = rows.filter((r) => key(r) === o.value).length;
    return { name: o.label, count, pct: Math.round((count / total) * 1000) / 10 };
  });
}

/** จำนวนแบบประเมินรายวัน (หรือรายเดือนถ้าช่วงข้อมูลยาวเกิน 90 วัน) */
function timeline(rows: SurveyResponseRow[]) {
  if (!rows.length) return [];
  const days = rows.map((r) => bangkokDate(r.created_at)).sort();
  const first = new Date(`${days[0]}T00:00:00Z`);
  const last = new Date(`${days[days.length - 1]}T00:00:00Z`);
  const spanDays = Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1;
  const counts = new Map<string, number>();

  if (spanDays > 90) {
    for (const d of days) counts.set(d.slice(0, 7), (counts.get(d.slice(0, 7)) ?? 0) + 1);
    const out = [];
    const cur = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
    while (cur <= last) {
      const k = cur.toISOString().slice(0, 7);
      out.push({
        name: new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" }).format(cur),
        count: counts.get(k) ?? 0,
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return out;
  }

  for (const d of days) counts.set(d, (counts.get(d) ?? 0) + 1);
  const out = [];
  for (let t = first.getTime(); t <= last.getTime(); t += 86_400_000) {
    const k = new Date(t).toISOString().slice(0, 10);
    out.push({ name: formatDay(k), count: counts.get(k) ?? 0 });
  }
  return out;
}

export function SurveyCharts({
  rows,
  summary,
}: {
  rows: SurveyResponseRow[];
  summary: AggregateSummary;
}) {
  const empty = rows.length === 0;

  const categoryData = CATEGORIES.map((c) => ({
    name: c.titleTh.replace("ด้าน", ""),
    full: `${c.titleTh} (${c.titleEn})`,
    avg: summary.categories[c.key] ?? 0,
  }));

  const deptData = DEPARTMENTS.map((d) => ({
    name: d.nameTh.replace("ฝ่าย", ""),
    full: `${d.nameEn} (${d.nameTh})`,
    count: rows.filter((r) => r.department_code === d.code).length,
  }));

  const ageData = countBy(rows, (r) => r.age_range, AGE_RANGE_OPTIONS);
  const genderData = countBy(rows, (r) => r.gender, GENDER_OPTIONS);
  const timeData = timeline(rows);

  const shareChart = (data: { name: string; count: number; pct: number }[]) => (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={tick} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={<Tip render={(p) => <><b>{String(p.name)}</b>: {String(p.count)} คน ({String(p.pct)}%)</>} />}
        />
        <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false}>
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(v: unknown) => `${v}%`}
            style={{ fill: AXIS, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="คะแนนเฉลี่ยรายด้าน" desc="เปรียบเทียบคะแนนเฉลี่ยทั้ง 4 ด้าน (เต็ม 5)">
        {empty ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 24, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={tick} axisLine={{ stroke: GRID }} tickLine={false} interval={0} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={tick} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                content={
                  <Tip
                    render={(p) => (
                      <>
                        <b>{String(p.full)}</b>
                        <br />
                        {formatScore(p.avg as number)} · ระดับ{interpretScore(p.avg as number)}
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="avg" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                <LabelList
                  dataKey="avg"
                  position="top"
                  formatter={(v: unknown) => formatScore(Number(v))}
                  style={{ fill: "#0b0b0b", fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="จำนวนผู้ตอบแยกตามแผนก">
        {empty ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={deptData.length * 36 + 20}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={tick} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                content={<Tip render={(p) => <><b>{String(p.full)}</b>: {String(p.count)} คน</>} />}
              />
              <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                <LabelList dataKey="count" position="right" style={{ fill: AXIS, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="สัดส่วนผู้ตอบแยกตามช่วงอายุ">{empty ? <Empty /> : shareChart(ageData)}</ChartCard>
      <ChartCard title="สัดส่วนผู้ตอบแยกตามเพศ">{empty ? <Empty /> : shareChart(genderData)}</ChartCard>

      <div className="lg:col-span-2">
        <ChartCard title="จำนวนแบบประเมินตามช่วงเวลา" desc="นับตามวันที่ส่ง (เวลาประเทศไทย)">
          {empty ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timeData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="name" tick={tick} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }}
                  content={<Tip render={(p) => <><b>{String(p.name)}</b>: {String(p.count)} รายการ</>} />}
                />
                <Line
                  type="linear"
                  dataKey="count"
                  stroke={SERIES}
                  strokeWidth={2}
                  dot={timeData.length <= 31 ? { r: 4, fill: SERIES, stroke: "#fff", strokeWidth: 2 } : false}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

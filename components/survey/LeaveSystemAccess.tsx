"use client";

import { Check, Copy, ExternalLink, KeyRound, Link2 } from "lucide-react";
import { useState } from "react";

export type LeaveAccountView = { role: string; username: string; password: string };

type Props = {
  url: string | null;
  instructions: string | null;
  accounts: LeaveAccountView[];
};

/** ส่วนที่ 1: ลิงก์และบัญชีทดลองเข้าใช้งานระบบลา (แสดงผลอย่างเดียว ไม่บันทึกลงฐานข้อมูล) */
export function LeaveSystemAccess({ url, instructions, accounts }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <Link2 className="h-4 w-4 text-blue-600" aria-hidden />
            ลิงก์เข้าสู่ระบบลา
          </div>
          {url ? (
            <p className="mt-1 break-all text-sm text-slate-500">{url}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">รอเพิ่มลิงก์ระบบลา</p>
          )}
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            เปิดระบบลา
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center gap-2 font-medium text-slate-800">
          <KeyRound className="h-4 w-4 text-blue-600" aria-hidden />
          ชื่อผู้ใช้และรหัสผ่านสำหรับทดลองใช้งาน
        </div>
        {accounts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">รอเพิ่มคำแนะนำการเข้าสู่ระบบ</p>
        ) : (
          <>
            {instructions ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{instructions}</p>
            ) : null}
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {accounts.map((a, i) => (
                <li key={`${a.username}-${i}`} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{a.role}</p>
                  <dl className="mt-1.5 space-y-1 text-sm">
                    <CopyRow label="ชื่อผู้ใช้" value={a.username} />
                    <CopyRow label="รหัสผ่าน" value={a.password} />
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 text-xs text-slate-400">แบบประเมินนี้ไม่เก็บชื่อผู้ใช้หรือรหัสผ่านของระบบลา</p>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="w-16 shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 truncate font-mono text-[0.85rem] text-slate-800">{value}</dd>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* บางเบราว์เซอร์บน http ไม่อนุญาตคัดลอก — ผู้ใช้เลือกข้อความเองได้ */
          }
        }}
        aria-label={`คัดลอก${label}`}
        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

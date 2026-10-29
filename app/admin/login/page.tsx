import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-blue-700">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">สำหรับผู้ดูแลระบบ</h1>
              <p className="text-sm text-slate-500">เข้าสู่ระบบเพื่อดูผลการประเมิน</p>
            </div>
          </div>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
      </main>
    </>
  );
}

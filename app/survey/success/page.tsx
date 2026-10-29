import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "ส่งแบบประเมินสำเร็จ",
};

export default function SurveySuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" aria-hidden />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            ขอบคุณสำหรับการประเมินความพึงพอใจ
          </h1>
          <p className="mt-3 leading-relaxed text-slate-600">
            ระบบได้บันทึกแบบประเมินของท่านเรียบร้อยแล้ว ความคิดเห็นของท่านจะถูกนำไปใช้พัฒนาระบบลาให้ดียิ่งขึ้น
          </p>
          <Link
            href="/survey"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            กลับไปหน้าแบบประเมิน
          </Link>
        </div>
      </main>
    </>
  );
}

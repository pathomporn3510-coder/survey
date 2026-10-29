import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { getLeaveAccounts } from "@/lib/config/leave-accounts";

export const metadata: Metadata = {
  title: "แบบประเมินความพึงพอใจ",
};

export default function SurveyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-sky-100/70 to-transparent">
          <div className="mx-auto max-w-3xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
            <p className="text-sm font-semibold text-blue-700">
              Leave Management System Satisfaction Survey
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
              แบบประเมินความพึงพอใจผู้ใช้งานระบบลา
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
              แบบประเมินนี้มีทั้งหมด 7 ส่วน ใช้เวลาประมาณ 5 นาที คำตอบของท่านจะถูกนำไปใช้ปรับปรุงระบบลา
              โดยไม่ระบุตัวตน ข้อที่มีเครื่องหมาย <span className="text-red-500">*</span> จำเป็นต้องตอบ
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <SurveyForm leaveAccounts={getLeaveAccounts()} />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        แบบประเมินความพึงพอใจผู้ใช้งานระบบลา
      </footer>
    </>
  );
}

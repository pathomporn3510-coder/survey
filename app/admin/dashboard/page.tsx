import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertTriangle, Loader2, ShieldX } from "lucide-react";
import { DashboardView } from "@/components/admin/DashboardView";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { checkAdmin } from "@/lib/auth/admin";
import { fetchAllResponses } from "@/lib/survey/responses";

export const metadata: Metadata = {
  title: "Dashboard สรุปผลการประเมิน",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboard />
    </Suspense>
  );
}

/** อ่าน Session + ตรวจสิทธิ์ฝั่ง Server ก่อนดึงข้อมูลทุกครั้ง */
async function AdminDashboard() {
  // หน้านี้ขึ้นกับ Session ของผู้ใช้และเวลาปัจจุบัน (Supabase ตรวจวันหมดอายุของ token)
  // จึงต้องประมวลผลตอนมีคำขอเข้ามาเท่านั้น ไม่ให้ Next.js prerender ล่วงหน้า
  await connection();
  const auth = await checkAdmin();

  if (auth.status === "anonymous") redirect("/admin/login");

  if (auth.status === "not_configured") {
    return (
      <Shell>
        <Notice
          icon={<AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden />}
          title="ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase"
          body="กรุณากำหนด NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local แล้วรีสตาร์ทเซิร์ฟเวอร์"
        />
      </Shell>
    );
  }

  if (auth.status === "forbidden") {
    return (
      <Shell right={<LogoutButton />}>
        <Notice
          icon={<ShieldX className="h-6 w-6 text-red-600" aria-hidden />}
          title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
          body={`บัญชี ${auth.email ?? ""} ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลเพื่อขอสิทธิ์`}
        />
      </Shell>
    );
  }

  let rows;
  try {
    rows = await fetchAllResponses();
  } catch (e) {
    console.error("[dashboard]", e);
    return (
      <Shell right={<LogoutButton />}>
        <Notice
          icon={<AlertTriangle className="h-6 w-6 text-red-600" aria-hidden />}
          title="ไม่สามารถดึงข้อมูลผลการประเมินได้"
          body="กรุณาลองรีเฟรชหน้าอีกครั้ง หากยังพบปัญหาให้ตรวจสอบการเชื่อมต่อฐานข้อมูล"
        />
      </Shell>
    );
  }

  return (
    <Shell
      right={
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{auth.email}</span>
          <LogoutButton />
        </div>
      }
    >
      <DashboardView rows={rows} />
    </Shell>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <>
      <SiteHeader href="/admin/dashboard" right={right} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}

function Notice({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">{icon}</div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <>
      <SiteHeader href="/admin/dashboard" />
      <main className="flex flex-1 items-center justify-center py-24 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        กำลังโหลดข้อมูล...
      </main>
    </>
  );
}

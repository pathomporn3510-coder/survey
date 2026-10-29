import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { ReactNode } from "react";
import { surveyConfig } from "@/lib/config/survey-config";

/** ส่วนหัวของเว็บไซต์ — รองรับโลโก้บริษัท (ตั้งค่าที่ lib/config/survey-config.ts) */
export function SiteHeader({ right, href = "/survey" }: { right?: ReactNode; href?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={href} className="flex min-w-0 items-center gap-3">
          {surveyConfig.logo ? (
            <Image
              src={surveyConfig.logo}
              alt={surveyConfig.organizationName}
              width={120}
              height={40}
              className="h-9 w-auto"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </span>
          )}
          <span className="truncate text-sm font-semibold text-slate-800 sm:text-base">
            Leave System Survey
          </span>
        </Link>
        {right}
      </div>
    </header>
  );
}

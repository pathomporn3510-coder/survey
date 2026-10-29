import type { ReactNode } from "react";
import type { SectionImage } from "@/lib/config/survey-config";
import { SystemImagePlaceholder } from "./SystemImagePlaceholder";

type Props = {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  description?: string;
  image?: SectionImage;
  children: ReactNode;
};

/** Card สำหรับแต่ละส่วนของแบบประเมิน */
export function SurveySection({
  id,
  number,
  title,
  subtitle,
  description,
  image,
  children,
}: Props) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-8">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white"
          aria-hidden
        >
          {number}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            ส่วนที่ {number}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
          <h2 id={headingId} className="mt-0.5 text-xl font-semibold text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-6 px-5 py-6 sm:px-8">
        {image ? <SystemImagePlaceholder image={image} /> : null}
        {children}
      </div>
    </section>
  );
}

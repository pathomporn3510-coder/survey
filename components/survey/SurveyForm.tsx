"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { surveyConfig } from "@/lib/config/survey-config";
import {
  AGE_RANGE_OPTIONS,
  FEEDBACK_MAX_LENGTH,
  GENDER_OPTIONS,
  GENDER_OTHER_MAX_LENGTH,
} from "@/lib/constants/demographics";
import { DEPARTMENTS } from "@/lib/constants/departments";
import {
  CATEGORIES,
  FEEDBACK_FIELDS,
  QUESTION_CODES,
  RATING_LABELS,
} from "@/lib/survey/questions";
import {
  surveySchema,
  type SurveyFormValues,
  type SurveyPayload,
} from "@/lib/validation/survey";
import type { ApiResult } from "@/types/survey";
import { LeaveSystemAccess, type LeaveAccountView } from "./LeaveSystemAccess";
import { RatingStars } from "./RatingStars";
import { SurveySection } from "./SurveySection";

const REQUIRED_FIELDS = ["gender", "age_range", "department_code", ...QUESTION_CODES] as const;

/** ลำดับฟิลด์ตามหน้าจอ ใช้เลื่อนไปยังข้อแรกที่ยังไม่ได้กรอก */
const FIELD_ORDER = [
  ...REQUIRED_FIELDS,
  "gender_other",
  ...FEEDBACK_FIELDS.map((f) => f.name),
] as const;

const emptyValues: SurveyFormValues = {
  submission_id: "",
  gender: "",
  gender_other: "",
  age_range: "",
  department_code: "",
  ...(Object.fromEntries(QUESTION_CODES.map((c) => [c, null])) as Record<
    (typeof QUESTION_CODES)[number],
    null
  >),
  favorite_feedback: "",
  improvement_feedback: "",
  other_feedback: "",
  website: "",
};

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // สำรองสำหรับกรณีเปิดผ่าน http ที่ไม่ใช่ secure context
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function SurveyForm({ leaveAccounts = [] }: { leaveAccounts?: LeaveAccountView[] }) {
  const router = useRouter();
  const submissionIdRef = useRef<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SurveyFormValues, unknown, SurveyPayload>({
    defaultValues: emptyValues,
    resolver: zodResolver(surveySchema) as unknown as Resolver<
      SurveyFormValues,
      unknown,
      SurveyPayload
    >,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const watched = useWatch({ control });
  const answered = REQUIRED_FIELDS.filter((f) => {
    const v = watched[f];
    return v !== null && v !== undefined && v !== "";
  }).length;
  const total = REQUIRED_FIELDS.length;
  const percent = Math.round((answered / total) * 100);
  const missingCount = REQUIRED_FIELDS.filter((f) => errors[f]).length;

  const scrollToField = (name: string) => {
    const el = document.getElementById(`field-${name}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = el.querySelector<HTMLElement>(
      'input:not([type=hidden]), select, textarea, [role="radio"][tabindex="0"]',
    );
    focusable?.focus({ preventScroll: true });
  };

  const onInvalid = (errs: FieldErrors<SurveyFormValues>) => {
    setShowSummary(true);
    setServerError(null);
    const first = FIELD_ORDER.find((f) => errs[f as keyof SurveyFormValues]);
    if (first) scrollToField(first);
  };

  const onValid = async (data: SurveyPayload) => {
    setServerError(null);
    setShowSummary(false);
    // ใช้รหัสเดิมเมื่อกดลองใหม่ เพื่อไม่ให้บันทึกซ้ำ
    submissionIdRef.current ??= newSubmissionId();
    const payload = { ...data, submission_id: submissionIdRef.current };

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json().catch(() => null)) as ApiResult | null;
      if (!res.ok || !result?.ok) {
        setServerError(
          (result && !result.ok && result.message) ||
            "ไม่สามารถบันทึกแบบประเมินได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
        );
        return;
      }
      submissionIdRef.current = null;
      reset(emptyValues);
      router.push("/survey/success");
    } catch {
      setServerError(
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองส่งอีกครั้ง",
      );
    }
  };

  // ส่ง submission_id ชั่วคราวให้ผ่านการตรวจสอบฝั่ง Client (ค่าจริงถูกกำหนดตอนส่ง)
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!submissionIdRef.current) submissionIdRef.current = newSubmissionId();
    setValue("submission_id", submissionIdRef.current);
    return handleSubmit(onValid, onInvalid)(e);
  };

  const gender = watched.gender;
  const leave = surveyConfig.leaveSystem;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {/* แถบความคืบหน้า */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-6 sm:shadow-sm">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">ความคืบหน้าแบบประเมิน</span>
          <span className="tabular-nums text-slate-600">
            {answered}/{total} ข้อบังคับ · <span className="font-semibold text-blue-700">{percent}%</span>
          </span>
        </div>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="ความคืบหน้าแบบประเมิน"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ส่วนที่ 1 */}
      <SurveySection
        id="section-1"
        number={1}
        title="ข้อมูลระบบ"
        description={leave.description}
        image={surveyConfig.images.systemInfo}
      >
        <LeaveSystemAccess
          url={leave.url}
          instructions={leave.loginInstructions}
          accounts={leaveAccounts}
        />

        <div>
          <h3 className="font-medium text-slate-800">เกณฑ์การให้คะแนนความพึงพอใจ</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-5">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <li
                key={n}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:flex-col sm:justify-center sm:py-3"
              >
                <span className="font-semibold tracking-wider text-amber-500" aria-label={`${n} ดาว`}>
                  {"★".repeat(n)}
                </span>
                <span className="text-slate-700">{RATING_LABELS[n]}</span>
              </li>
            ))}
          </ul>
        </div>
      </SurveySection>

      {/* ส่วนที่ 2 */}
      <SurveySection
        id="section-2"
        number={2}
        title="ข้อมูลทั่วไป"
        description="ข้อมูลนี้ใช้เพื่อสรุปผลภาพรวมเท่านั้น ไม่ระบุตัวตนผู้ตอบ"
      >
        <fieldset id="field-gender" className="scroll-mt-32">
          <legend className="font-medium text-slate-800">
            1. เพศ <span className="text-red-500">*</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="เพศ"
            aria-required
            aria-invalid={!!errors.gender || undefined}
            aria-describedby={errors.gender ? "err-gender" : undefined}
            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {GENDER_OPTIONS.map((g) => (
              <label
                key={g.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-sky-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500/30"
              >
                <input
                  type="radio"
                  value={g.value}
                  {...register("gender")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-slate-800">{g.label}</span>
              </label>
            ))}
          </div>
          <FieldError id="err-gender" message={errors.gender?.message} />
          {gender === "other" ? (
            <div id="field-gender_other" className="mt-3">
              <label htmlFor="gender_other" className="text-sm text-slate-600">
                โปรดระบุ (ไม่บังคับ)
              </label>
              <input
                id="gender_other"
                type="text"
                maxLength={GENDER_OTHER_MAX_LENGTH}
                {...register("gender_other")}
                className={`${inputBase} mt-1 border-slate-300`}
              />
              <FieldError message={errors.gender_other?.message} />
            </div>
          ) : null}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div id="field-age_range" className="scroll-mt-32">
            <label htmlFor="age_range" className="font-medium text-slate-800">
              2. อายุ <span className="text-red-500">*</span>
            </label>
            <select
              id="age_range"
              {...register("age_range")}
              aria-invalid={!!errors.age_range || undefined}
              aria-describedby={errors.age_range ? "err-age_range" : undefined}
              className={`${inputBase} mt-2 ${errors.age_range ? "border-red-400" : "border-slate-300"}`}
            >
              <option value="">— เลือกช่วงอายุ —</option>
              {AGE_RANGE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <FieldError id="err-age_range" message={errors.age_range?.message} />
          </div>

          <div id="field-department_code" className="scroll-mt-32">
            <label htmlFor="department_code" className="font-medium text-slate-800">
              3. ตำแหน่ง/แผนก <span className="text-red-500">*</span>
            </label>
            <select
              id="department_code"
              {...register("department_code")}
              aria-invalid={!!errors.department_code || undefined}
              aria-describedby={errors.department_code ? "err-department_code" : undefined}
              className={`${inputBase} mt-2 ${errors.department_code ? "border-red-400" : "border-slate-300"}`}
            >
              <option value="">— เลือกแผนก —</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.nameEn} ({d.nameTh})
                </option>
              ))}
            </select>
            <FieldError id="err-department_code" message={errors.department_code?.message} />
          </div>
        </div>
      </SurveySection>

      {/* ส่วนที่ 3–6 */}
      {CATEGORIES.map((cat) => (
        <SurveySection
          key={cat.key}
          id={`section-${cat.sectionNo}`}
          number={cat.sectionNo}
          title={cat.titleTh}
          subtitle={cat.titleEn}
          description={cat.description}
          image={surveyConfig.images[cat.key]}
        >
          <ol className="divide-y divide-slate-100">
            {cat.questions.map((q) => {
              const err = errors[q.code]?.message;
              const textId = `q-${q.code}-text`;
              const errId = `err-${q.code}`;
              return (
                <li
                  key={q.code}
                  id={`field-${q.code}`}
                  className="scroll-mt-32 py-4 first:pt-0 last:pb-0"
                >
                  <p id={textId} className="flex gap-3 leading-relaxed text-slate-800">
                    <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-md bg-sky-100 px-2 text-xs font-semibold text-blue-700">
                      {q.label}
                    </span>
                    <span>
                      {q.text} <span className="text-red-500" aria-hidden>*</span>
                    </span>
                  </p>
                  <div className="mt-3 sm:pl-12">
                    <Controller
                      control={control}
                      name={q.code}
                      render={({ field }) => (
                        <RatingStars
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          labelledBy={textId}
                          invalid={!!err}
                          errorId={errId}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    <FieldError id={errId} message={err} />
                  </div>
                </li>
              );
            })}
          </ol>
        </SurveySection>
      ))}

      {/* ส่วนที่ 7 */}
      <SurveySection
        id="section-7"
        number={7}
        title="ข้อเสนอแนะเพิ่มเติม"
        description="ไม่บังคับกรอก ความคิดเห็นของท่านจะนำไปใช้ปรับปรุงระบบลาต่อไป"
        // แสดงรูปเฉพาะเมื่อกำหนด src ใน survey-config (ไม่แสดงกรอบ placeholder)
        image={surveyConfig.images.feedback.src ? surveyConfig.images.feedback : undefined}
      >
        {FEEDBACK_FIELDS.map((f, i) => {
          const len = (watched[f.name] ?? "").length;
          return (
            <div key={f.name} id={`field-${f.name}`}>
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={f.name} className="font-medium text-slate-800">
                  {i + 1}. {f.label}
                </label>
                <span
                  className={`shrink-0 text-xs tabular-nums ${len > FEEDBACK_MAX_LENGTH * 0.9 ? "text-amber-600" : "text-slate-400"}`}
                >
                  {len}/{FEEDBACK_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id={f.name}
                rows={4}
                maxLength={FEEDBACK_MAX_LENGTH}
                placeholder="พิมพ์ความคิดเห็นของท่าน (ถ้ามี)"
                {...register(f.name)}
                className={`${inputBase} mt-2 resize-y border-slate-300 leading-relaxed`}
              />
              <FieldError message={errors[f.name]?.message} />
            </div>
          );
        })}
      </SurveySection>

      {/* honeypot กันบอท — ผู้ใช้จริงมองไม่เห็น */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {/* สรุปข้อผิดพลาด + ปุ่มส่ง */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div aria-live="assertive" className="space-y-3">
          {showSummary && missingCount > 0 ? (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">กรุณากรอกข้อมูลให้ครบถ้วน</p>
                <p className="text-sm">ยังมีข้อบังคับที่ยังไม่ได้ตอบ {missingCount} ข้อ (ไฮไลต์สีแดงด้านบน)</p>
              </div>
            </div>
          ) : null}
          {serverError ? (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">ส่งแบบประเมินไม่สำเร็จ</p>
                <p className="text-sm">{serverError}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
            ตอบแล้ว {answered} จาก {total} ข้อบังคับ
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden />
                ส่งแบบประเมิน
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

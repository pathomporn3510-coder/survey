import { z } from "zod";
import {
  AGE_RANGE_VALUES,
  FEEDBACK_MAX_LENGTH,
  GENDER_OTHER_MAX_LENGTH,
  GENDER_VALUES,
} from "@/lib/constants/demographics";
import { DEPARTMENT_CODES } from "@/lib/constants/departments";
import { QUESTION_CODES, type QuestionCode } from "@/lib/survey/questions";

/** คะแนน 1–5 แบบจำนวนเต็ม — ห้ามเป็น null */
const scoreSchema = z
  .number({ error: "กรุณาให้คะแนนข้อนี้" })
  .int({ error: "คะแนนต้องเป็นจำนวนเต็ม" })
  .min(1, { error: "คะแนนต้องอยู่ระหว่าง 1–5" })
  .max(5, { error: "คะแนนต้องอยู่ระหว่าง 1–5" });

const optionalText = (max: number) =>
  z
    .string()
    .max(max, { error: `ข้อความต้องไม่เกิน ${max} ตัวอักษร` })
    .optional()
    .nullable()
    .transform((v) => {
      const t = (v ?? "").trim();
      return t.length > 0 ? t : null;
    });

const scoreShape = Object.fromEntries(
  QUESTION_CODES.map((code) => [code, scoreSchema]),
) as Record<QuestionCode, typeof scoreSchema>;

export const surveySchema = z
  .object({
    submission_id: z.uuid({ error: "รหัสการส่งไม่ถูกต้อง" }),
    gender: z.enum(GENDER_VALUES, { error: "กรุณาเลือกเพศ" }),
    gender_other: optionalText(GENDER_OTHER_MAX_LENGTH),
    age_range: z.enum(AGE_RANGE_VALUES, { error: "กรุณาเลือกช่วงอายุ" }),
    department_code: z.enum(DEPARTMENT_CODES, { error: "กรุณาเลือกตำแหน่ง/แผนก" }),
    ...scoreShape,
    favorite_feedback: optionalText(FEEDBACK_MAX_LENGTH),
    improvement_feedback: optionalText(FEEDBACK_MAX_LENGTH),
    other_feedback: optionalText(FEEDBACK_MAX_LENGTH),
    /** ช่องดักบอท (honeypot) — ผู้ใช้จริงมองไม่เห็นและต้องเว้นว่าง */
    website: z.string().max(0).optional(),
  })
  .strict()
  .transform((data) => ({
    ...data,
    // เก็บรายละเอียด "อื่น ๆ" เฉพาะเมื่อเลือกเพศ "อื่น ๆ"
    gender_other: data.gender === "other" ? data.gender_other : null,
  }));

export type SurveyInput = z.input<typeof surveySchema>;
export type SurveyPayload = z.output<typeof surveySchema>;

/**
 * Schema สำหรับฟอร์มฝั่ง Client — คะแนนเริ่มต้นเป็น null (ยังไม่เลือก)
 * แต่ตอนส่งต้องผ่าน surveySchema (ไม่อนุญาต null)
 */
export type SurveyFormValues = Omit<SurveyInput, QuestionCode | "gender" | "age_range" | "department_code"> & {
  gender: SurveyInput["gender"] | "";
  age_range: SurveyInput["age_range"] | "";
  department_code: SurveyInput["department_code"] | "";
} & Record<QuestionCode, number | null>;

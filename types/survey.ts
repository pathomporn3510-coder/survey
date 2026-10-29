import type { AgeRange, Gender } from "@/lib/constants/demographics";
import type { DepartmentCode } from "@/lib/constants/departments";
import type { CategoryKey, QuestionCode } from "@/lib/survey/questions";

export type Score = 1 | 2 | 3 | 4 | 5;

export type Scores = Record<QuestionCode, number>;

/** แถวข้อมูลในตาราง survey_responses */
export type SurveyResponseRow = Scores & {
  id: string;
  submission_id: string;
  gender: Gender;
  gender_other: string | null;
  age_range: AgeRange;
  department_code: DepartmentCode;
  department_name: string;
  favorite_feedback: string | null;
  improvement_feedback: string | null;
  other_feedback: string | null;
  created_at: string;
};

export type CategoryAverages = Record<CategoryKey, number>;

export type SatisfactionLevel =
  | "มากที่สุด"
  | "มาก"
  | "ปานกลาง"
  | "น้อย"
  | "น้อยที่สุด";

export type ApiResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

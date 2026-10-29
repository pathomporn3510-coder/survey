/** ตัวเลือกเพศ — ค่า value ตรงกับ CHECK constraint ใน supabase/schema.sql */
export const GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "prefer_not_to_say", label: "ไม่ประสงค์ระบุ" },
  { value: "other", label: "อื่น ๆ" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];
export const GENDER_VALUES = GENDER_OPTIONS.map((g) => g.value) as [Gender, ...Gender[]];

/** ตัวเลือกช่วงอายุ — ค่า value ตรงกับ CHECK constraint ใน supabase/schema.sql */
export const AGE_RANGE_OPTIONS = [
  { value: "under_20", label: "ต่ำกว่า 20 ปี" },
  { value: "20_29", label: "20–29 ปี" },
  { value: "30_39", label: "30–39 ปี" },
  { value: "40_49", label: "40–49 ปี" },
  { value: "50_plus", label: "50 ปีขึ้นไป" },
  { value: "prefer_not_to_say", label: "ไม่ประสงค์ระบุ" },
] as const;

export type AgeRange = (typeof AGE_RANGE_OPTIONS)[number]["value"];
export const AGE_RANGE_VALUES = AGE_RANGE_OPTIONS.map((a) => a.value) as [
  AgeRange,
  ...AgeRange[],
];

export function genderLabel(value: string): string {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;
}

export function ageRangeLabel(value: string): string {
  return AGE_RANGE_OPTIONS.find((a) => a.value === value)?.label ?? value;
}

/** ความยาวสูงสุดของช่องข้อความ (ต้องตรงกับ CHECK constraint ในฐานข้อมูล) */
export const FEEDBACK_MAX_LENGTH = 1000;
export const GENDER_OTHER_MAX_LENGTH = 100;

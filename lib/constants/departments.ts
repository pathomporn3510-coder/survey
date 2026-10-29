/**
 * รายชื่อแผนก — ใช้ร่วมกันทั้งฟอร์ม, การตรวจสอบข้อมูล, Dashboard และ SQL CHECK constraint
 * หากเพิ่ม/แก้ไขแผนก ต้องแก้ไขใน supabase/schema.sql (constraint survey_responses_department_check) ให้ตรงกันด้วย
 */
export const DEPARTMENTS = [
  { code: "ADM", nameEn: "Administration Department", nameTh: "ฝ่ายธุรการและสนับสนุนองค์กร" },
  { code: "ACC", nameEn: "Account & Finance Department", nameTh: "ฝ่ายบัญชีและการเงิน" },
  { code: "HR", nameEn: "Human Resource Department", nameTh: "ฝ่ายทรัพยากรบุคคล" },
  { code: "SAL", nameEn: "Sales & Marketing Department", nameTh: "ฝ่ายขายและการตลาด" },
  { code: "SWD", nameEn: "Software Development Department", nameTh: "ฝ่ายพัฒนาซอฟต์แวร์" },
  { code: "RND", nameEn: "Research & Development (R&D) Department", nameTh: "ฝ่ายวิจัยและพัฒนา" },
  { code: "PRJ", nameEn: "Project Department", nameTh: "ฝ่ายโครงการ" },
] as const;

export type DepartmentCode = (typeof DEPARTMENTS)[number]["code"];

export const DEPARTMENT_CODES = DEPARTMENTS.map((d) => d.code) as [
  DepartmentCode,
  ...DepartmentCode[],
];

/** ชื่อแผนกที่บันทึกลงฐานข้อมูล (รูปแบบเดียวกันทุกรายการ) */
export function departmentFullName(code: DepartmentCode): string {
  const d = DEPARTMENTS.find((x) => x.code === code);
  return d ? `${d.nameEn} (${d.nameTh})` : code;
}

export function departmentShortName(code: string): string {
  const d = DEPARTMENTS.find((x) => x.code === code);
  return d ? d.nameTh : code;
}

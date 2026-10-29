import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/** บัญชีทดลองใช้งานระบบลา ที่แสดงในส่วนที่ 1 ของแบบประเมิน */
export type LeaveAccount = {
  role: string;
  username: string;
  password: string;
};

/**
 * อ่านบัญชีทดลองจาก config/leave-accounts.local.json
 * - ไฟล์นี้ถูก .gitignore ไว้ รหัสผ่านจึงไม่อยู่ใน Source Code / Git
 * - ถ้าไม่มีไฟล์ จะคืนค่าว่าง และหน้าแบบประเมินแสดง "รอเพิ่มคำแนะนำการเข้าสู่ระบบ"
 * - ไม่มีการบันทึกข้อมูลเหล่านี้ลงฐานข้อมูล
 */
export function getLeaveAccounts(): LeaveAccount[] {
  try {
    const file = path.join(process.cwd(), "config", "leave-accounts.local.json");
    const data: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (a): a is LeaveAccount =>
          !!a &&
          typeof a.role === "string" &&
          typeof a.username === "string" &&
          typeof a.password === "string",
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

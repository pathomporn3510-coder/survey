/**
 * การตั้งค่าเนื้อหาแบบประเมินที่แก้ไขได้ภายหลัง (ลิงก์ระบบลา, รูปภาพประกอบ, โลโก้, คำแนะนำการเข้าระบบ)
 *
 * วิธีเพิ่มรูปภาพ: วางไฟล์ไว้ที่ public/images/survey/ แล้วใส่ path เช่น "/images/survey/design.png"
 *                หรือใส่ URL เต็ม (เช่นจาก Supabase Storage) — ถ้าเป็นโดเมนภายนอกต้องเพิ่มใน next.config.ts > images.remotePatterns
 * ถ้าเว้นเป็น null ระบบจะแสดง Placeholder "รอเพิ่มรูปภาพระบบ"
 *
 * ห้ามใส่ชื่อผู้ใช้หรือรหัสผ่านจริงในไฟล์นี้ — ใช้ข้อความคำแนะนำเท่านั้น
 */
export type SectionImage = {
  src: string | null;
  alt: string;
  /** อัตราส่วนภาพ (กว้าง/สูง) ใช้กันเลย์เอาต์กระโดด */
  aspectRatio?: number;
};

export const surveyConfig = {
  organizationName: "บริษัทของคุณ",
  /** โลโก้บริษัท (เช่น "/images/logo.png") — null = แสดงไอคอนเริ่มต้น */
  logo: null as string | null,

  leaveSystem: {
    name: "ระบบลา (Leave Management System)",
    /** ลิงก์เข้าสู่ระบบลา — ตั้งค่าผ่าน env NEXT_PUBLIC_LEAVE_SYSTEM_URL หรือแก้ที่นี่ */
    url: process.env.NEXT_PUBLIC_LEAVE_SYSTEM_URL || "http://192.168.28.7:3000/login",
    description:
      "ระบบสำหรับยื่นคำขอลา ตรวจสอบสิทธิ์วันลาคงเหลือ และติดตามสถานะการอนุมัติการลาของพนักงาน",
    /**
     * คำแนะนำการเข้าสู่ระบบ (แสดงเป็นข้อความเท่านั้น)
     * บัญชีทดลองใช้งาน (ชื่อผู้ใช้/รหัสผ่าน) ไม่ได้อยู่ในไฟล์นี้ — อ่านจาก config/leave-accounts.local.json
     * ซึ่งถูก .gitignore ไว้ (ดู config/leave-accounts.example.json)
     */
    loginInstructions:
      "เข้าระบบลาด้วยบัญชีทดลองด้านล่าง (ใช้ได้เฉพาะในเครือข่ายของบริษัท) เพื่อทดลองใช้งานก่อนตอบแบบประเมิน" as string | null,
  },

  images: {
    systemInfo: { src: "/images/survey/system-dashboard.webp", alt: "หน้า Dashboard ของระบบลา", aspectRatio: 1918 / 862 },
    design: { src: "/images/survey/leave-request-form.webp", alt: "หน้าสร้างคำขอลา", aspectRatio: 1918 / 862 },
    quality: { src: "/images/survey/approval-list.webp", alt: "หน้ารายการคำขอรออนุมัติของหัวหน้าแผนก", aspectRatio: 1918 / 862 },
    usability: { src: "/images/survey/hr-review.webp", alt: "หน้าตรวจสอบคำขอลาของฝ่ายบุคคล", aspectRatio: 1918 / 862 },
    usefulness: { src: "/images/survey/leave-status.webp", alt: "หน้าติดตามสถานะการลา", aspectRatio: 1918 / 862 },
    feedback: { src: null, alt: "ภาพประกอบข้อเสนอแนะเพิ่มเติม", aspectRatio: 16 / 9 },
  } satisfies Record<string, SectionImage>,
};

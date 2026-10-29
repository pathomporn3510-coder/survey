# แบบประเมินความพึงพอใจผู้ใช้งานระบบลา

Leave Management System Satisfaction Survey — Next.js 16 (App Router) + Supabase

| หน้า | Path | สิทธิ์ |
|---|---|---|
| แบบประเมิน 7 ส่วน | `/survey` (หน้าแรก `/` พามาที่นี่) | ทุกคน |
| หน้าส่งสำเร็จ | `/survey/success` | ทุกคน |
| เข้าสู่ระบบผู้ดูแล | `/admin/login` | ทุกคน |
| Dashboard | `/admin/dashboard` | เฉพาะ Admin |
| API บันทึกแบบประเมิน | `POST /api/survey` | ทุกคน (ตรวจข้อมูลฝั่ง Server) |
| API ส่งออก CSV | `GET /api/admin/export` | เฉพาะ Admin |

---

## 1. ตั้งค่า Supabase (ตั้งแต่สร้างโปรเจกต์)

1. ไปที่ <https://supabase.com/dashboard> → **New project** → ตั้งชื่อ, รหัสผ่านฐานข้อมูล, เลือก Region (แนะนำ Southeast Asia (Singapore))
2. รอโปรเจกต์สร้างเสร็จ แล้วไปที่ **SQL Editor → New query**
3. เปิดไฟล์ `supabase/schema.sql` คัดลอกทั้งไฟล์ไปวาง แล้วกด **Run**
   - สร้างตาราง `survey_responses`, `admin_users`, CHECK constraints, Index, Trigger กันสแปม, RLS และ Policies
   - รันซ้ำได้ ไม่ทำให้ข้อมูลเดิมหาย
4. ปิดการสมัครสมาชิกเอง: **Authentication → Sign In / Providers** → ปิด *Allow new users to sign up* (Admin จะถูกสร้างโดยผู้ดูแลเท่านั้น)
5. คัดลอกค่าการเชื่อมต่อ: **Project Settings → API** (หรือปุ่ม **Connect** ด้านบน)
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` (หรือ `anon` key แบบเดิม) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (หรือ `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **ไม่ต้องใช้** `service_role` / Secret key ในโปรเจกต์นี้

### สิทธิ์ที่ตั้งไว้ใน schema.sql

| ผู้ใช้ | INSERT แบบประเมิน | อ่านคำตอบ | แก้ไข/ลบ |
|---|---|---|---|
| ผู้ตอบทั่วไป (anon) | ได้ (เฉพาะคอลัมน์คำตอบ, ห้ามกำหนด `id`/`created_at`) | ไม่ได้ | ไม่ได้ |
| ผู้ใช้ที่ล็อกอินแต่ไม่ใช่ Admin | ได้ | ไม่ได้ (RLS คืนค่าว่าง) | ไม่ได้ |
| Admin (มีชื่อใน `admin_users`) | ได้ | ได้ | ไม่ได้ (ทำได้ใน SQL Editor เท่านั้น) |

ป้องกันข้อมูลผิด/สแปมหลายชั้น: Zod ฝั่ง Client + Server → CHECK constraint ในฐานข้อมูล → `submission_id` UNIQUE (กันส่งซ้ำ) → honeypot กันบอท → จำกัด 20 ครั้ง/นาที/IP ที่ API → Trigger จำกัด 60 ครั้ง/นาทีทั้งระบบ (ปรับเลขได้ใน `schema.sql`)

---

## 2. รันโปรเจกต์ในเครื่อง

ต้องมี Node.js 20.9 ขึ้นไป

```bash
npm install
copy .env.example .env.local      # Windows (macOS/Linux ใช้ cp)
# แก้ .env.local ใส่ค่าจาก Supabase
npm run dev
```

เปิด <http://localhost:3000/survey>

คำสั่งตรวจสอบ: `npm run lint` · `npx tsc --noEmit` · `npm run build` · `npm start`

> ถ้ายังไม่ได้ตั้งค่า `.env.local` หน้าแบบประเมินยังเปิดได้ แต่กดส่งจะแจ้ง "ระบบยังไม่พร้อมรับแบบประเมิน" (ไม่แสดงว่าส่งสำเร็จ)

---

## 3. สร้างบัญชี Admin อย่างปลอดภัย

1. Supabase Dashboard → **Authentication → Users → Add user → Create new user**
   ใส่อีเมลและรหัสผ่านที่คาดเดายาก (12 ตัวขึ้นไป) และติ๊ก *Auto Confirm User*
2. **SQL Editor** รันคำสั่ง (เปลี่ยนอีเมล):
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@yourcompany.com'
   on conflict (user_id) do nothing;
   ```
3. เข้า `/admin/login` ด้วยอีเมล/รหัสผ่านนั้น

ถอนสิทธิ์: `delete from public.admin_users where email = 'admin@yourcompany.com';`
ดูรายชื่อ Admin: `select * from public.admin_users;`

การตรวจสิทธิ์ทำที่ Server ทุกครั้ง (`lib/auth/admin.ts` ใช้ `getUser()` ยืนยัน token กับ Supabase แล้วตรวจตาราง `admin_users`) และ RLS ในฐานข้อมูลบังคับซ้ำอีกชั้น — ไม่ได้พึ่งการซ่อนปุ่มในหน้าเว็บ

แนะนำเพิ่ม: เปิด MFA ให้บัญชี Admin, ใช้อีเมลบริษัท, จำกัดจำนวน Admin ให้น้อยที่สุด

---

## 4. เพิ่มรูปภาพ ลิงก์ระบบลา และโลโก้ภายหลัง

แก้ที่ไฟล์เดียว: **`lib/config/survey-config.ts`**

| ต้องการ | วิธี |
|---|---|
| ลิงก์ระบบลา | ใส่ `NEXT_PUBLIC_LEAVE_SYSTEM_URL` ใน `.env.local` / ค่า Environment บนเซิร์ฟเวอร์ หรือแก้ `leaveSystem.url` |
| คำแนะนำการเข้าระบบ | แก้ข้อความ `leaveSystem.loginInstructions` |
| บัญชีทดลองระบบลา (ชื่อผู้ใช้/รหัสผ่าน) | แก้ไฟล์ `config/leave-accounts.local.json` (รูปแบบดู `config/leave-accounts.example.json`) — ไฟล์นี้ถูก `.gitignore` ไว้ รหัสผ่านจึงไม่ขึ้น Git; โหมด `npm run dev` เห็นผลทันที, โหมด production ต้อง `npm run build` ใหม่ · ถ้าลบไฟล์ทิ้งจะแสดง "รอเพิ่มคำแนะนำการเข้าสู่ระบบ" |
| รูปภาพส่วนที่ 1, 3–7 | วางไฟล์ใน `public/images/survey/` แล้วแก้ `images.systemInfo.src = "/images/survey/system.png"` (คีย์: `systemInfo`, `design`, `quality`, `usability`, `usefulness`, `feedback`) |
| อัตราส่วนภาพ | แก้ `aspectRatio` เช่น `4 / 3` |
| โลโก้บริษัท | วางไฟล์ใน `public/images/` แล้วแก้ `logo: "/images/logo.png"` |
| รูปจาก URL ภายนอก / Supabase Storage | ใส่ URL เต็มใน `src` และเพิ่มโดเมนใน `next.config.ts` → `images.remotePatterns` |

ถ้าใช้ Supabase Storage: สร้าง Bucket แยก เช่น `survey-images` ตั้งเป็น **Public (read-only)** และอัปโหลดผ่าน Dashboard เท่านั้น ห้ามเปิดสิทธิ์อัปโหลดให้ anon

---

## 5. Deploy ขึ้นใช้งานจริง

### Vercel (ง่ายที่สุด)
1. Push โค้ดขึ้น GitHub (ไฟล์ `.env.local` ถูก `.gitignore` ไว้แล้ว)
2. <https://vercel.com/new> → Import repository
3. **Environment Variables** ใส่ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (หรือ `..._ANON_KEY`), `NEXT_PUBLIC_LEAVE_SYSTEM_URL`
4. Deploy
5. Supabase → **Authentication → URL Configuration** → ตั้ง *Site URL* เป็นโดเมนจริง

### เซิร์ฟเวอร์ภายในองค์กร (Node.js / Windows Server / Linux)
```bash
npm ci
npm run build      # ตัวแปร NEXT_PUBLIC_* ต้องมีตอน build
npm start          # พอร์ต 3000 (เปลี่ยนด้วย -p 8080)
```
แนะนำรันผ่าน PM2 (`pm2 start npm --name leave-survey -- start`) และวางหลัง reverse proxy (IIS/Nginx) ที่เปิด HTTPS

> ฟอนต์ภาษาไทย (IBM Plex Sans Thai) ติดตั้งผ่าน npm แบบ self-host จึง build ได้แม้เครือข่ายภายในบล็อก Google Fonts

---

## 6. โครงสร้างไฟล์

```
app/
  page.tsx                      → redirect ไป /survey
  layout.tsx, globals.css       → ฟอนต์ไทย, โทนสี
  survey/page.tsx               → หน้าแบบประเมิน
  survey/success/page.tsx       → หน้าส่งสำเร็จ
  admin/login/                  → หน้าล็อกอิน Admin
  admin/dashboard/page.tsx      → Dashboard (ตรวจสิทธิ์ฝั่ง Server)
  api/survey/route.ts           → บันทึกแบบประเมิน
  api/admin/export/route.ts     → ส่งออก CSV
components/
  survey/  SurveyForm, RatingStars, SurveySection, SystemImagePlaceholder
  admin/   DashboardView, DashboardStats, SurveyCharts, SurveyTable, FeedbackList, LogoutButton
  layout/  SiteHeader
lib/
  config/survey-config.ts       → ลิงก์/รูปภาพ/โลโก้ (แก้ไขภายหลัง)
  constants/                    → แผนก, เพศ, ช่วงอายุ
  survey/questions.ts           → รหัสคำถาม 16 ข้อ (d1..b4)
  survey/scoring.ts             → สูตรคะแนนและการแปลผล
  survey/filters.ts, responses.ts, format.ts
  validation/survey.ts          → Zod schema (ใช้ทั้ง Client และ Server)
  supabase/client.ts, server.ts, env.ts
  auth/admin.ts                 → ตรวจสิทธิ์ Admin
  security/rate-limit.ts
proxy.ts                        → รีเฟรช Session (Next.js 16 ใช้ชื่อ proxy แทน middleware)
supabase/schema.sql             → ตาราง + RLS + Policies
types/survey.ts
```

### สูตรคำนวณ (`lib/survey/scoring.ts`)
- ค่าเฉลี่ยรายด้าน = ผลรวม 4 ข้อ / 4 · ค่าเฉลี่ยรวม = ผลรวม 16 ข้อ / 16
- แปลผล: 4.21–5.00 มากที่สุด · 3.41–4.20 มาก · 2.61–3.40 ปานกลาง · 1.81–2.60 น้อย · 1.00–1.80 น้อยที่สุด (ปัดทศนิยม 2 ตำแหน่งก่อนเทียบช่วง)
- Dashboard, ตาราง และไฟล์ CSV ใช้ฟังก์ชันชุดเดียวกัน และคำนวณจากข้อมูลจริงในฐานข้อมูลเท่านั้น

### หากต้องการเพิ่ม/แก้แผนก
แก้ `lib/constants/departments.ts` และ constraint `survey_responses_department_check` ใน `supabase/schema.sql` ให้ตรงกัน แล้วรัน SQL ส่วน constraint ใหม่ (`alter table ... drop constraint ... ; alter table ... add constraint ...`)

---

## 7. ผลการทดสอบ

ทดสอบกับ PostgreSQL 16 + PostgREST + Supabase Auth (GoTrue) จริงในเครื่อง และ Chromium (Playwright)

| # | กรณี | ผล |
|---|---|---|
| 1 | กรอกครบและส่ง | ✅ บันทึกลงฐานข้อมูล ไปหน้าสำเร็จ |
| 2 | ไม่ให้คะแนนบางข้อ / ส่ง null | ✅ ถูกปฏิเสธทั้ง Client (ไฮไลต์ + เลื่อนไปข้อแรก) และ Server (400) |
| 3 | คะแนน 0, 6, 2.5, "5" | ✅ ถูกปฏิเสธทั้ง API และ CHECK constraint |
| 4 | ไม่กรอกข้อเสนอแนะ | ✅ บันทึกได้ เก็บเป็น NULL |
| 5 | กดส่งหลายครั้ง / ส่งพร้อมกัน 3 ครั้ง | ✅ ส่ง request เดียว; ถ้าซ้ำ บันทึกเพียง 1 แถว |
| 6 | Supabase เชื่อมต่อไม่ได้ | ✅ แจ้งข้อความเข้าใจง่าย ไม่แสดงว่าสำเร็จ ลองใหม่ได้ |
| 7 | ผู้ไม่มีสิทธิ์เข้า Admin | ✅ ไม่ล็อกอิน → ไป /admin/login; ล็อกอินแต่ไม่ใช่ Admin → "ไม่มีสิทธิ์" |
| 8 | ผู้ใช้ทั่วไปอ่านข้อมูลทั้งหมด | ✅ anon: permission denied; ผู้ใช้ไม่ใช่ Admin: ได้ผลว่าง; ตั้งตัวเองเป็น Admin/ลบข้อมูล: ปฏิเสธ |
| 9 | Responsive มือถือ 390px / Desktop | ✅ ไม่มี horizontal scroll, ดาวขนาดใหญ่กดง่าย |
| 10 | การคำนวณและแปลผล | ✅ ตรงกับ SQL `avg()` ทุกด้าน; ขอบเขตแปลผล 13/13 |
| 11 | กรอง Dashboard | ✅ สรุป/กราฟ/ตาราง/ข้อเสนอแนะ เปลี่ยนตามตัวกรอง |
| 12 | ส่งออก CSV และสิทธิ์ | ✅ Admin ดาวน์โหลดได้ (ตามตัวกรอง, ภาษาไทยใน Excel ถูกต้อง); ไม่ล็อกอิน 401; ไม่ใช่ Admin 403 |

`npm run lint`, `npx tsc --noEmit`, `npm run build` ผ่านทั้งหมด

### ข้อจำกัดที่ยังเหลือ
- Rate limit ต่อ IP ที่ API เก็บในหน่วยความจำ — บน Serverless แต่ละ instance แยกกัน และค่า IP อ่านจาก `x-forwarded-for` (ปลอมได้ถ้าไม่ได้อยู่หลัง proxy ที่เชื่อถือได้) ชั้นป้องกันหลักคือ Trigger ในฐานข้อมูล
- ไม่ได้บังคับ "1 คน 1 ครั้ง" เพราะแบบประเมินไม่ระบุตัวตน — กันได้เฉพาะการส่งซ้ำจากการกรอกครั้งเดียวกัน หากต้องการต้องเพิ่มการยืนยันตัวตนพนักงาน
- Dashboard ดึงข้อมูลทั้งหมดมาคำนวณ (เหมาะกับหลักพัน–หมื่นรายการ) หากข้อมูลมากกว่านั้นควรย้ายการสรุปไปเป็น SQL View/RPC
- ส่งออกเป็น CSV (UTF-8 BOM) ซึ่งเปิดใน Excel ได้ทันที ยังไม่มีไฟล์ .xlsx
- การจัดการรูปภาพ/ลิงก์ทำผ่านไฟล์ Configuration (ยังไม่มีหน้า Admin สำหรับแก้ไข)

-- =====================================================================
--  Leave Management System Satisfaction Survey — Supabase schema
--  วิธีใช้: เปิด Supabase Dashboard > SQL Editor > New query
--          วางไฟล์นี้ทั้งไฟล์แล้วกด Run (รันซ้ำได้ ไม่ทำให้ข้อมูลเดิมหาย)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ตารางผลการประเมิน
--    คำถามเป็นชุดตายตัว 16 ข้อ จึงเก็บเป็นคอลัมน์ (d1..d4, q1..q4, u1..u4, b1..b4)
--    รหัสคำถามทั้งหมดนิยามไว้ที่ lib/survey/questions.ts
-- ---------------------------------------------------------------------
create table if not exists public.survey_responses (
  id                    uuid primary key default gen_random_uuid(),
  -- รหัสที่ฝั่ง Client สร้างต่อการกรอก 1 ครั้ง ใช้กันการบันทึกซ้ำ (กดส่งซ้ำ / ลองใหม่)
  submission_id         uuid not null unique,

  gender                text not null,
  gender_other          text,
  age_range             text not null,
  department_code       text not null,
  department_name       text not null,

  d1 smallint not null, d2 smallint not null, d3 smallint not null, d4 smallint not null,
  q1 smallint not null, q2 smallint not null, q3 smallint not null, q4 smallint not null,
  u1 smallint not null, u2 smallint not null, u3 smallint not null, u4 smallint not null,
  b1 smallint not null, b2 smallint not null, b3 smallint not null, b4 smallint not null,

  favorite_feedback     text,
  improvement_feedback  text,
  other_feedback        text,

  created_at            timestamptz not null default now(),

  constraint survey_responses_gender_check
    check (gender in ('male', 'female', 'prefer_not_to_say', 'other')),
  constraint survey_responses_gender_other_check
    check (gender_other is null or (gender = 'other' and char_length(gender_other) <= 100)),
  constraint survey_responses_age_range_check
    check (age_range in ('under_20', '20_29', '30_39', '40_49', '50_plus', 'prefer_not_to_say')),
  -- รหัสแผนกและชื่อแผนกต้องเป็นคู่ที่ถูกต้องเสมอ (ตรงกับ lib/constants/departments.ts)
  constraint survey_responses_department_check
    check ((department_code, department_name) in (
      ('ADM', 'Administration Department (ฝ่ายธุรการและสนับสนุนองค์กร)'),
      ('ACC', 'Account & Finance Department (ฝ่ายบัญชีและการเงิน)'),
      ('HR',  'Human Resource Department (ฝ่ายทรัพยากรบุคคล)'),
      ('SAL', 'Sales & Marketing Department (ฝ่ายขายและการตลาด)'),
      ('SWD', 'Software Development Department (ฝ่ายพัฒนาซอฟต์แวร์)'),
      ('RND', 'Research & Development (R&D) Department (ฝ่ายวิจัยและพัฒนา)'),
      ('PRJ', 'Project Department (ฝ่ายโครงการ)')
    )),

  constraint survey_responses_scores_check check (
    d1 between 1 and 5 and d2 between 1 and 5 and d3 between 1 and 5 and d4 between 1 and 5 and
    q1 between 1 and 5 and q2 between 1 and 5 and q3 between 1 and 5 and q4 between 1 and 5 and
    u1 between 1 and 5 and u2 between 1 and 5 and u3 between 1 and 5 and u4 between 1 and 5 and
    b1 between 1 and 5 and b2 between 1 and 5 and b3 between 1 and 5 and b4 between 1 and 5
  ),

  constraint survey_responses_feedback_length_check check (
    (favorite_feedback    is null or char_length(favorite_feedback)    <= 1000) and
    (improvement_feedback is null or char_length(improvement_feedback) <= 1000) and
    (other_feedback       is null or char_length(other_feedback)       <= 1000)
  )
);

comment on table public.survey_responses is
  'ผลแบบประเมินความพึงพอใจผู้ใช้งานระบบลา (ไม่เก็บชื่อผู้ใช้/รหัสผ่านของระบบลา)';

create index if not exists survey_responses_created_at_idx
  on public.survey_responses (created_at desc);
create index if not exists survey_responses_department_code_idx
  on public.survey_responses (department_code);

-- ---------------------------------------------------------------------
-- 2) ตารางผู้ดูแลระบบ (Admin)
--    ผู้ใช้ Supabase Auth จะอ่านผลประเมินได้ก็ต่อเมื่อมี user_id อยู่ในตารางนี้
--    การเพิ่ม Admin ทำผ่าน SQL Editor เท่านั้น (ดู docs/ADMIN_SETUP.md)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

-- ฟังก์ชันตรวจสอบสิทธิ์ Admin (security definer เพื่อให้ใช้ใน RLS ได้โดยไม่วนซ้ำ)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) ป้องกันสแปม: จำกัดจำนวนการส่งแบบประเมินทั้งระบบต่อนาที
--    (เป็นชั้นป้องกันสุดท้ายกรณีมีผู้ยิง API ตรง ๆ ด้วย anon key)
--    ปรับตัวเลข 60 ได้ตามขนาดองค์กร
-- ---------------------------------------------------------------------
create or replace function public.survey_responses_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  -- บังคับเวลาบันทึกจากฝั่งฐานข้อมูลเสมอ
  new.created_at := now();

  select count(*) into recent_count
  from public.survey_responses
  where created_at > now() - interval '1 minute';

  if recent_count >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists survey_responses_rate_limit on public.survey_responses;
create trigger survey_responses_rate_limit
  before insert on public.survey_responses
  for each row execute function public.survey_responses_rate_limit();

-- ---------------------------------------------------------------------
-- 4) Row Level Security & สิทธิ์ระดับคอลัมน์
-- ---------------------------------------------------------------------
alter table public.survey_responses enable row level security;
alter table public.admin_users      enable row level security;

-- ล้างสิทธิ์เดิม แล้วให้เฉพาะที่จำเป็น
revoke all on public.survey_responses from anon, authenticated;
revoke all on public.admin_users      from anon, authenticated;

-- ผู้ตอบแบบประเมิน (anon) เพิ่มข้อมูลได้เฉพาะคอลัมน์คำตอบ
-- ไม่สามารถกำหนด id หรือ created_at เอง และไม่มีสิทธิ์ SELECT / UPDATE / DELETE
grant insert (
  submission_id, gender, gender_other, age_range, department_code, department_name,
  d1, d2, d3, d4, q1, q2, q3, q4, u1, u2, u3, u4, b1, b2, b3, b4,
  favorite_feedback, improvement_feedback, other_feedback
) on public.survey_responses to anon, authenticated;

-- ผู้ใช้ที่ล็อกอิน มีสิทธิ์ SELECT ในระดับตาราง แต่ RLS จะคัดให้เห็นเฉพาะ Admin
grant select on public.survey_responses to authenticated;
grant select on public.admin_users      to authenticated;

drop policy if exists "survey_insert_public"  on public.survey_responses;
drop policy if exists "survey_select_admin"   on public.survey_responses;
drop policy if exists "admin_users_self_read" on public.admin_users;

-- ใครก็ส่งแบบประเมินได้ (ค่าที่ไม่ถูกต้องจะถูก CHECK constraint ปฏิเสธ)
create policy "survey_insert_public"
  on public.survey_responses
  for insert
  to anon, authenticated
  with check (true);

-- อ่านผลประเมินได้เฉพาะ Admin
create policy "survey_select_admin"
  on public.survey_responses
  for select
  to authenticated
  using (public.is_admin());

-- ผู้ใช้ที่ล็อกอินเห็นเฉพาะแถวของตัวเองในตาราง admin_users (ใช้ตรวจว่าตนเป็น Admin หรือไม่)
create policy "admin_users_self_read"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- ไม่มี policy สำหรับ UPDATE / DELETE => ทำไม่ได้ผ่าน API (ทำได้ผ่าน SQL Editor เท่านั้น)

-- =====================================================================
--  เพิ่ม Admin (รันแยกหลังจากสร้างผู้ใช้ใน Authentication > Users แล้ว)
--  insert into public.admin_users (user_id, email)
--  select id, email from auth.users where email = 'admin@yourcompany.com'
--  on conflict (user_id) do nothing;
-- =====================================================================

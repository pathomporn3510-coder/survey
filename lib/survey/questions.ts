/**
 * นิยามคำถามประเมินทั้ง 16 ข้อ — รหัสคำถาม (d1..b4) ตรงกับชื่อคอลัมน์ใน survey_responses
 * คำถามเป็นชุดตายตัว จึงเก็บแบบคอลัมน์ แต่ทุกส่วนของโค้ดอ้างอิงรหัสจากไฟล์นี้ที่เดียว
 */
export const CATEGORIES = [
  {
    key: "design",
    sectionNo: 3,
    titleTh: "ด้านการออกแบบ",
    titleEn: "Design Aspect",
    description: "ประเมินความสวยงาม การจัดวาง และความเหมาะสมของหน้าจอระบบลา",
    questions: [
      { code: "d1", label: "D1", text: "รูปแบบหน้าจอของระบบมีความสวยงามและทันสมัย" },
      { code: "d2", label: "D2", text: "การจัดวางองค์ประกอบบนหน้าจอมีความเหมาะสม" },
      { code: "d3", label: "D3", text: "สีและตัวอักษรของระบบมีความเหมาะสม อ่านง่าย" },
      { code: "d4", label: "D4", text: "การออกแบบโดยรวมช่วยให้ใช้งานระบบได้สะดวก" },
    ],
  },
  {
    key: "quality",
    sectionNo: 4,
    titleTh: "ด้านคุณภาพระบบ",
    titleEn: "System Quality",
    description: "ประเมินความถูกต้อง ความเร็ว และความเสถียรของระบบลา",
    questions: [
      { code: "q1", label: "Q1", text: "ระบบทำงานได้ถูกต้องตามที่ออกแบบไว้" },
      { code: "q2", label: "Q2", text: "ระบบมีความรวดเร็วในการประมวลผล" },
      { code: "q3", label: "Q3", text: "ระบบมีความเสถียรและไม่เกิดข้อผิดพลาด" },
      { code: "q4", label: "Q4", text: "ระบบสามารถใช้งานได้อย่างต่อเนื่อง" },
    ],
  },
  {
    key: "usability",
    sectionNo: 5,
    titleTh: "ด้านการใช้งาน",
    titleEn: "Usability",
    description: "ประเมินความง่ายและความชัดเจนในการใช้งานระบบลา",
    questions: [
      { code: "u1", label: "U1", text: "ระบบใช้งานง่ายและไม่ซับซ้อน" },
      { code: "u2", label: "U2", text: "ผู้ใช้สามารถเรียนรู้การใช้งานระบบได้รวดเร็ว" },
      { code: "u3", label: "U3", text: "ขั้นตอนการใช้งานมีความชัดเจน" },
      { code: "u4", label: "U4", text: "ระบบช่วยลดขั้นตอนและเวลาในการทำงาน" },
    ],
  },
  {
    key: "usefulness",
    sectionNo: 6,
    titleTh: "ด้านประโยชน์ที่ได้รับ",
    titleEn: "Usefulness",
    description: "ประเมินประโยชน์ที่ได้รับจากการใช้ระบบลาในการทำงานจริง",
    questions: [
      { code: "b1", label: "B1", text: "ระบบช่วยเพิ่มประสิทธิภาพในการทำงาน" },
      { code: "b2", label: "B2", text: "ระบบช่วยลดความผิดพลาดในการทำงาน" },
      { code: "b3", label: "B3", text: "ระบบสามารถตอบสนองต่อความต้องการของผู้ใช้งานได้ดี" },
      { code: "b4", label: "B4", text: "ผู้ใช้มีความพึงพอใจในการนำระบบไปใช้งานจริง" },
    ],
  },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryKey = Category["key"];
export type QuestionCode = Category["questions"][number]["code"];

export const QUESTION_CODES = CATEGORIES.flatMap((c) =>
  c.questions.map((q) => q.code),
) as QuestionCode[];

export const QUESTIONS_BY_CATEGORY: Record<CategoryKey, QuestionCode[]> =
  Object.fromEntries(
    CATEGORIES.map((c) => [c.key, c.questions.map((q) => q.code)]),
  ) as Record<CategoryKey, QuestionCode[]>;

/** ข้อความกำกับระดับคะแนน (ดาว) */
export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  5: "มากที่สุด",
  4: "มาก",
  3: "ปานกลาง",
  2: "น้อย",
  1: "น้อยที่สุด",
};

export const FEEDBACK_FIELDS = [
  { name: "favorite_feedback", label: "สิ่งที่ผู้ใช้ชอบมากที่สุดในระบบคืออะไร?" },
  { name: "improvement_feedback", label: "สิ่งที่ต้องการให้พัฒนาเพิ่มเติมหรือแก้ไขคืออะไร?" },
  { name: "other_feedback", label: "ข้อคิดเห็นอื่น ๆ" },
] as const;

export type FeedbackField = (typeof FEEDBACK_FIELDS)[number]["name"];

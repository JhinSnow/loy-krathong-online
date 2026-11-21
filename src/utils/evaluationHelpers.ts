// src/utils/evaluationHelpers.ts
// โมดูลจัดการข้อมูลแบบประเมินมาตรฐานกลาง ม.อ. (โครงการลอยกระทงบุฟเฟต์) และการคำนวณสถิติสำหรับเล่มรายงานสรุปโครงการ

export interface EvaluationDimension {
  id: string;
  label: string;
  shortLabel: string;
  sectionGroup: string;
}

export interface EvaluationQuestion {
  id: number;
  dimensionId: string;
  subGroupLabel?: string;
  shortLabel: string;
  title: string;
  kpiKey?: 'tradition_eco' | 'relationship' | 'overall';
}

export interface SdgEvaluationItem {
  code: number;
  key: string;
  nameEn: string;
  nameTh: string;
  description: string;
  colorHex: string;
}

export const PDPA_CONSENT_PARAGRAPHS: readonly string[] = [
  'แบบประเมินฉบับนี้จัดทำขึ้นเพื่อประเมินผลการดำเนินงานโครงการลอยกระทงบุฟเฟต์ (Loy Krathong Buffet) และใช้เป็นข้อมูลสำหรับการสรุปผล รายงานผลการดำเนินงาน และการพัฒนาโครงการในอนาคต',
  'ข้อมูลที่ท่านให้จะถูกเก็บรักษาเป็นความลับ ใช้เพื่อวัตถุประสงค์ในการประเมินผลและการจัดทำรายงานของโครงการเท่านั้น โดยจะนำเสนอผลในภาพรวมและจะไม่เปิดเผยข้อมูลส่วนบุคคลของผู้ตอบ เว้นแต่ได้รับความยินยอมจากเจ้าของข้อมูล หรือเป็นกรณีที่กฎหมายกำหนด',
  'การตอบแบบประเมินนี้ถือว่าท่านรับทราบและยินยอมให้ผู้จัดโครงการเก็บรวบรวม ใช้ และประมวลผลข้อมูลตามวัตถุประสงค์ดังกล่าว'
];

export const PDPA_CONSENT_CHECK_LABEL =
  'ข้าพเจ้ารับทราบคำชี้แจงและยินยอมให้เก็บรวบรวมและใช้ข้อมูลเพื่อการประเมินผลและจัดทำรายงานโครงการตามวัตถุประสงค์ที่กำหนด';

export const STUDENT_YEAR_OPTIONS: readonly { code: string; label: string }[] = [
  { code: '1', label: 'ชั้นปีที่ 1' },
  { code: '2', label: 'ชั้นปีที่ 2' },
  { code: '3', label: 'ชั้นปีที่ 3' },
  { code: '4', label: 'ชั้นปีที่ 4' },
  { code: 'm', label: 'ปริญญาโท' }
];

const YEAR_CODE_TO_LABEL: Record<string, string> = {
  '1': 'ชั้นปีที่ 1',
  '2': 'ชั้นปีที่ 2',
  '3': 'ชั้นปีที่ 3',
  '4': 'ชั้นปีที่ 4',
  m: 'ปริญญาโท'
};

export function formatYearLevel(codeOrLabel: string): string {
  const clean = (codeOrLabel || '').trim();
  if (!clean) return '';
  if (YEAR_CODE_TO_LABEL[clean]) return YEAR_CODE_TO_LABEL[clean];
  return clean;
}

export function normalizeYearCode(codeOrLabel: string): string {
  const clean = (codeOrLabel || '').trim();
  if (clean in YEAR_CODE_TO_LABEL) return clean;
  const matched = STUDENT_YEAR_OPTIONS.find((opt) => opt.label === clean);
  return matched ? matched.code : '';
}

export const COMMUNITY_ROLE_OPTIONS: readonly string[] = [
  'ผู้ปกครอง',
  'ผู้นำชุมชน',
  'ประชาชนในพื้นที่',
  'ภาคีเครือข่าย',
  'อื่นๆ'
];

export const EVALUATION_DIMENSIONS: readonly EvaluationDimension[] = [
  {
    id: 'quality',
    label: '1. คุณภาพของกิจกรรม',
    shortLabel: '1. คุณภาพกิจกรรม',
    sectionGroup: 'วัตถุประสงค์เฉพาะของโครงการ'
  },
  {
    id: 'management',
    label: '2. การบริหารจัดการ',
    shortLabel: '2. การบริหารจัดการ',
    sectionGroup: 'วัตถุประสงค์เฉพาะของโครงการ'
  },
  {
    id: 'learning',
    label: '3. การเรียนรู้และพัฒนาตนเอง (Learning & Personal Development)',
    shortLabel: '3. การเรียนรู้และพัฒนา',
    sectionGroup: 'วัตถุประสงค์เฉพาะของโครงการ'
  },
  {
    id: 'project_kpi',
    label: '4. ผลลัพธ์ตามวัตถุประสงค์และตัวชี้วัดโครงการ',
    shortLabel: '4. ตัวชี้วัดโครงการ',
    sectionGroup: 'วัตถุประสงค์เฉพาะของโครงการ'
  },
  {
    id: 'type_volunteer',
    label: '5. ประเภทบำเพ็ญประโยชน์รักษาสิ่งแวดล้อม',
    shortLabel: '5. บำเพ็ญประโยชน์/รักษ์โลก',
    sectionGroup: 'แบบประเมินตามประเภทโครงการ (1, 3, 7)'
  },
  {
    id: 'type_culture',
    label: '6. ประเภทศิลปวัฒนธรรม',
    shortLabel: '6. ศิลปวัฒนธรรม',
    sectionGroup: 'แบบประเมินตามประเภทโครงการ (1, 3, 7)'
  },
  {
    id: 'type_ethics',
    label: '7. ประเภทคุณธรรม จริยธรรมและความเป็นไทย',
    shortLabel: '7. คุณธรรม/ความเป็นไทย',
    sectionGroup: 'แบบประเมินตามประเภทโครงการ (1, 3, 7)'
  },
  {
    id: 'psu_5hs',
    label: '8. คุณลักษณะบัณฑิต PSU Style และสมรรถนะ 5Hs [4, 5]',
    shortLabel: '8. PSU Style & 5Hs',
    sectionGroup: 'คุณลักษณะบัณฑิตและสมรรถนะ 5Hs'
  },
  {
    id: 'community_impact',
    label: '9. ผลลัพธ์ด้านชุมชน สังคม และความเท่าเทียม',
    shortLabel: '9. ชุมชนและความเท่าเทียม',
    sectionGroup: 'ผลลัพธ์ด้านชุมชน สังคม และความเท่าเทียม'
  }
];

export const EVALUATION_QUESTIONS: readonly EvaluationQuestion[] = [
  // หมวด 1: คุณภาพของกิจกรรม (Q1-Q5)
  {
    id: 1,
    dimensionId: 'quality',
    shortLabel: '1.1 ความน่าสนใจของกิจกรรม',
    title: 'กิจกรรมมีความน่าสนใจ และเหมาะสมกับกลุ่มผู้เข้าร่วม'
  },
  {
    id: 2,
    dimensionId: 'quality',
    shortLabel: '1.2 รูปแบบและกระบวนการจัดงาน',
    title: 'รูปแบบและกระบวนการดำเนินกิจกรรมมีความเหมาะสม'
  },
  {
    id: 3,
    dimensionId: 'quality',
    shortLabel: '1.3 ความชัดเจนในการสื่อสาร',
    title: 'การสื่อสารหรือการอธิบายเนื้อหา/กิจกรรมมีความชัดเจนและเข้าใจง่าย'
  },
  {
    id: 4,
    dimensionId: 'quality',
    shortLabel: '1.4 การดูแลและอำนวยความสะดวก',
    title: 'ทีมงานดูแล ให้คำแนะนำ และอำนวยความสะดวกได้อย่างเหมาะสม'
  },
  {
    id: 5,
    dimensionId: 'quality',
    shortLabel: '1.5 ความปลอดภัยในการจัดกิจกรรม',
    title: 'การดำเนินกิจกรรมคำนึงถึงความปลอดภัยของผู้เข้าร่วมอย่างเหมาะสม'
  },

  // หมวด 2: การบริหารจัดการ (Q6-Q8)
  {
    id: 6,
    dimensionId: 'management',
    shortLabel: '2.1 วัน เวลา และระยะเวลา',
    title: 'วัน เวลา และระยะเวลาในการจัดกิจกรรมมีความเหมาะสม'
  },
  {
    id: 7,
    dimensionId: 'management',
    shortLabel: '2.2 สถานที่และช่องทางจัดงาน',
    title: 'สถานที่หรือช่องทางการจัดกิจกรรมมีความเหมาะสม'
  },
  {
    id: 8,
    dimensionId: 'management',
    shortLabel: '2.3 สิ่งอำนวยความสะดวกและอุปกรณ์',
    title: 'สิ่งอำนวยความสะดวก อุปกรณ์ หรือทรัพยากรที่ใช้ในการจัดกิจกรรมมีความเหมาะสม'
  },

  // หมวด 3: Learning & Personal Development (Q9-Q12)
  {
    id: 9,
    dimensionId: 'learning',
    shortLabel: '3.1 ความรู้ ทักษะ และประสบการณ์ใหม่',
    title: 'ข้าพเจ้าได้รับความรู้ ทักษะ หรือประสบการณ์ใหม่จากการเข้าร่วมกิจกรรม'
  },
  {
    id: 10,
    dimensionId: 'learning',
    shortLabel: '3.2 การนำไปประยุกต์ใช้',
    title: 'สิ่งที่ได้รับจากกิจกรรมสามารถนำไปประยุกต์ใช้ในการเรียน การทำงาน หรือชีวิตประจำวันได้'
  },
  {
    id: 11,
    dimensionId: 'learning',
    shortLabel: '3.3 กระตุ้นการเรียนรู้เพิ่มเติม',
    title: 'กิจกรรมกระตุ้นให้ข้าพเจ้าเกิดความสนใจหรืออยากเรียนรู้เพิ่มเติม'
  },
  {
    id: 12,
    dimensionId: 'learning',
    shortLabel: '3.4 การคิดวิเคราะห์และลงมือปฏิบัติ',
    title: 'กิจกรรมส่งเสริมให้ข้าพเจ้าได้คิด วิเคราะห์ ลงมือปฏิบัติ หรือแก้ปัญหาด้วยตนเอง'
  },

  // หมวด 4: ผลลัพธ์ตามวัตถุประสงค์และตัวชี้วัดโครงการ (Q13-Q15 -> KPI หน้า 5)
  {
    id: 13,
    dimensionId: 'project_kpi',
    kpiKey: 'tradition_eco',
    shortLabel: '4.1 รับรู้คุณค่าประเพณีและลดขยะ',
    title: 'ข้าพเจ้ารับรู้คุณค่าของประเพณีลอยกระทงไทย และแนวคิดการอนุรักษ์สิ่งแวดล้อม/ลดขยะผ่านกิจกรรม (เช่น 1 ครอบครัว 1 กระทง และลอยกระทงออนไลน์)'
  },
  {
    id: 14,
    dimensionId: 'project_kpi',
    kpiKey: 'relationship',
    shortLabel: '4.2 สร้างความสัมพันธ์และความสามัคคี',
    title: 'กิจกรรมช่วยสร้างความสัมพันธ์อันดี ความสามัคคี และความทรงจำร่วมกันระหว่างผู้เข้าร่วมกิจกรรม'
  },
  {
    id: 15,
    dimensionId: 'project_kpi',
    kpiKey: 'overall',
    shortLabel: '4.3 ความพึงพอใจภาพรวมโครงการ',
    title: 'ความพึงพอใจในภาพรวมต่อการจัดโครงการลอยกระทงบุฟเฟต์ทั้งหมด'
  },

  // หมวด 5: ประเภทบำเพ็ญประโยชน์รักษาสิ่งแวดล้อม (ประเภทโครงการ 1) (Q16-Q18)
  {
    id: 16,
    dimensionId: 'type_volunteer',
    shortLabel: '5.1 เห็นผลการอนุรักษ์เป็นรูปธรรม',
    title: 'ข้าพเจ้าเห็นผลการอนุรักษ์สิ่งแวดล้อมหรือการลดขยะที่เกิดขึ้นจากโครงการอย่างเป็นรูปธรรม'
  },
  {
    id: 17,
    dimensionId: 'type_volunteer',
    shortLabel: '5.2 มีส่วนร่วมทำประโยชน์เพื่อส่วนรวม',
    title: 'ข้าพเจ้าได้มีส่วนร่วมในการทำประโยชน์เพื่อมหาวิทยาลัยและชุมชน'
  },
  {
    id: 18,
    dimensionId: 'type_volunteer',
    shortLabel: '5.3 ตระหนักความรับผิดชอบต่อสังคม',
    title: 'การเข้าร่วมโครงการทำให้ข้าพเจ้าตระหนักถึงความรับผิดชอบต่อสังคมและสิ่งแวดล้อมมากขึ้น'
  },

  // หมวด 6: ประเภทศิลปวัฒนธรรม (ประเภทโครงการ 3) (Q19-Q21)
  {
    id: 19,
    dimensionId: 'type_culture',
    shortLabel: '6.1 เรียนรู้ศิลปวัฒนธรรมไทย',
    title: 'ข้าพเจ้าได้เรียนรู้เกี่ยวกับศิลปวัฒนธรรมหรือภูมิปัญญาท้องถิ่นมากขึ้น'
  },
  {
    id: 20,
    dimensionId: 'type_culture',
    shortLabel: '6.2 ตระหนักคุณค่าวัฒนธรรม',
    title: 'ข้าพเจ้าตระหนักถึงคุณค่าและความสำคัญของศิลปวัฒนธรรมไทยหรือท้องถิ่นมากขึ้น'
  },
  {
    id: 21,
    dimensionId: 'type_culture',
    shortLabel: '6.3 มีส่วนร่วมด้านศิลปวัฒนธรรม',
    title: 'ข้าพเจ้าได้มีส่วนร่วมในกิจกรรมด้านศิลปวัฒนธรรมอย่างเหมาะสม'
  },

  // หมวด 7: ประเภทคุณธรรม จริยธรรมและความเป็นไทย (ประเภทโครงการ 7) (Q22-Q24)
  {
    id: 22,
    dimensionId: 'type_ethics',
    shortLabel: '7.1 ปลูกฝังคุณธรรมและจริยธรรม',
    title: 'กิจกรรมช่วยปลูกฝังคุณธรรม จริยธรรม และการประพฤติตนที่เหมาะสม'
  },
  {
    id: 23,
    dimensionId: 'type_ethics',
    shortLabel: '7.2 ตระหนักการทำประโยชน์เพื่อส่วนรวม',
    title: 'ผู้เข้าร่วมตระหนักถึงการทำประโยชน์เพื่อส่วนรวมและการอยู่ร่วมกับผู้อื่นอย่างมีจิตสำนึก'
  },
  {
    id: 24,
    dimensionId: 'type_ethics',
    shortLabel: '7.3 ภาคภูมิใจในความเป็นไทย',
    title: 'กิจกรรมส่งเสริมความภาคภูมิใจในวัฒนธรรมและความเป็นไทย'
  },

  // หมวด 8: คุณลักษณะบัณฑิต PSU Style และสมรรถนะ 5Hs [4, 5] (Q25-Q32)
  {
    id: 25,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้านอารมณ์',
    shortLabel: '8.1 ความซื่อสัตย์ มีวินัย (Integrity)',
    title: 'กิจกรรมนี้ช่วยส่งเสริมให้นักศึกษาปฏิบัติตนด้วยความซื่อสัตย์ มีวินัย และความรับผิดชอบ (PSU Identity: Integrity)'
  },
  {
    id: 26,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้านสังคม',
    shortLabel: '8.2 ตระหนักบทบาทสร้างประโยชน์แก่สังคม',
    title: 'กิจกรรมนี้ช่วยส่งเสริมให้นักศึกษาตระหนักถึงบทบาทของตนในการสร้างประโยชน์แก่สังคม'
  },
  {
    id: 27,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้านสังคม',
    shortLabel: '8.3 จิตอาสาและประโยชน์ส่วนรวม',
    title: 'กิจกรรมนี้ช่วยส่งเสริมให้นักศึกษามีจิตอาสาและคำนึงถึงประโยชน์ส่วนรวม (PSU Identity: Social Engagement)'
  },
  {
    id: 28,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้านสังคม',
    shortLabel: '8.4 การทำงานร่วมกับผู้อื่น (Leadership)',
    title: 'กิจกรรมนี้ช่วยพัฒนาความสามารถในการทำงานร่วมกับผู้อื่น (PSU Identity: Leadership)'
  },
  {
    id: 29,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้านสังคม',
    shortLabel: '8.5 การคิดวิเคราะห์และรับผิดชอบบทบาท',
    title: 'กิจกรรมนี้ช่วยส่งเสริมการคิดวิเคราะห์ การตัดสินใจ และการรับผิดชอบต่อบทบาทของตน'
  },
  {
    id: 30,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'PSU Style — ด้าน Global',
    shortLabel: '8.6 การปฏิบัติตามแนวทาง SDGs',
    title: 'กิจกรรมนี้ช่วยส่งเสริมความเข้าใจและการปฏิบัติตนตามแนวทางการพัฒนาที่ยั่งยืน (SDGs)'
  },
  {
    id: 31,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'สมรรถนะ 5Hs — ข้อ 4',
    shortLabel: '8.7 ความฉลาดทางอารมณ์และมืออาชีพ',
    title: 'ช่วยพัฒนาความฉลาดทางอารมณ์และพฤติกรรมแบบมืออาชีพ (Head / Heart / Habit)'
  },
  {
    id: 32,
    dimensionId: 'psu_5hs',
    subGroupLabel: 'สมรรถนะ 5Hs — ข้อ 5',
    shortLabel: '8.8 การมีส่วนร่วมทางสังคม (5Hs)',
    title: 'ช่วยส่งเสริมการมีส่วนร่วมทางสังคมและการทำประโยชน์เพื่อส่วนรวม (Hand / Heart / Health / Habit)'
  },

  // หมวด 9: ผลลัพธ์ด้านชุมชน สังคม และความเท่าเทียม (Q33-Q36)
  {
    id: 33,
    dimensionId: 'community_impact',
    subGroupLabel: 'ชุมชนและสิ่งแวดล้อม',
    shortLabel: '9.1 พัฒนาสภาพแวดล้อมมหาวิทยาลัย/ชุมชน',
    title: 'กิจกรรมมีส่วนช่วยพัฒนาสภาพแวดล้อม มหาวิทยาลัย หรือชุมชนให้ดีขึ้น'
  },
  {
    id: 34,
    dimensionId: 'community_impact',
    subGroupLabel: 'ชุมชนและสิ่งแวดล้อม',
    shortLabel: '9.2 ความร่วมมือกับชุมชน',
    title: 'กิจกรรมช่วยสร้างความร่วมมือหรือความสัมพันธ์ที่ดีระหว่างผู้เข้าร่วม มหาวิทยาลัย และชุมชน'
  },
  {
    id: 35,
    dimensionId: 'community_impact',
    subGroupLabel: 'โอกาสและความเท่าเทียม',
    shortLabel: '9.3 เข้าถึงและได้รับประโยชน์เท่าเทียม',
    title: 'กิจกรรมเปิดโอกาสให้ผู้เข้าร่วมทุกเพศทุกวัยสามารถเข้าถึงและได้รับประโยชน์อย่างเหมาะสม'
  },
  {
    id: 36,
    dimensionId: 'community_impact',
    subGroupLabel: 'โอกาสและความเท่าเทียม',
    shortLabel: '9.4 เพิ่มโอกาสเรียนรู้และพัฒนาตนเอง',
    title: 'กิจกรรมช่วยเพิ่มโอกาสในการเรียนรู้หรือพัฒนาตนเองของผู้เข้าร่วม'
  }
];

export const COMMUNITY_EVALUATION_QUESTIONS: readonly EvaluationQuestion[] = [
  {
    id: 1,
    dimensionId: 'community_section15',
    shortLabel: 'ช.1 ประโยชน์ต่อผู้เข้าร่วมและชุมชน',
    title: 'ข้าพเจ้าเห็นถึงประโยชน์ที่เกิดขึ้นกับผู้เข้าร่วมหรือชุมชนจากโครงการ'
  },
  {
    id: 2,
    dimensionId: 'community_section15',
    shortLabel: 'ช.2 ความเชื่อมั่นต่อคณะผู้จัดงาน',
    title: 'โครงการทำให้ข้าพเจ้ามีความเชื่อมั่นต่อการดำเนินงานของคณะผู้จัดมากขึ้น'
  },
  {
    id: 3,
    dimensionId: 'community_section15',
    shortLabel: 'ช.3 ความสัมพันธ์ระหว่างมหาวิทยาลัยกับชุมชน',
    title: 'โครงการช่วยสร้างความสัมพันธ์ที่ดีระหว่างมหาวิทยาลัยและชุมชน'
  },
  {
    id: 4,
    dimensionId: 'community_section15',
    shortLabel: 'ช.4 ภาพลักษณ์ที่ดีของมหาวิทยาลัย',
    title: 'โครงการช่วยสร้างภาพลักษณ์ที่ดีของมหาวิทยาลัยต่อชุมชน'
  }
];

export const SDG_EVALUATION_ITEMS: readonly SdgEvaluationItem[] = [
  {
    code: 5,
    key: 'sdg5',
    nameEn: 'Gender Equality',
    nameTh: 'ความเท่าเทียมทางเพศ',
    description: 'โครงการเปิดโอกาสให้ทุกเพศมีส่วนร่วมอย่างเท่าเทียมและได้รับการปฏิบัติอย่างเป็นธรรม',
    colorHex: '#FF3A21'
  },
  {
    code: 11,
    key: 'sdg11',
    nameEn: 'Sustainable Cities and Communities',
    nameTh: 'เมืองและชุมชนที่ยั่งยืน',
    description: 'โครงการมีส่วนพัฒนาสภาพแวดล้อม มหาวิทยาลัย หรือชุมชนให้น่าอยู่ ปลอดภัย และยั่งยืนมากขึ้น',
    colorHex: '#FD9D24'
  },
  {
    code: 12,
    key: 'sdg12',
    nameEn: 'Responsible Consumption and Production',
    nameTh: 'การผลิตและการบริโภคที่ยั่งยืน',
    description: 'โครงการส่งเสริมการใช้ทรัพยากร วัสดุ หรืออุปกรณ์อย่างคุ้มค่าและรับผิดชอบ',
    colorHex: '#BF8B2E'
  },
  {
    code: 13,
    key: 'sdg13',
    nameEn: 'Climate Action',
    nameTh: 'การรับมือการเปลี่ยนแปลงสภาพภูมิอากาศ',
    description: 'โครงการมีส่วนสร้างความตระหนักหรือกิจกรรมที่เกี่ยวข้องกับการอนุรักษ์สิ่งแวดล้อมและลดผลกระทบต่อสภาพภูมิอากาศ',
    colorHex: '#3F7E44'
  },
  {
    code: 14,
    key: 'sdg14',
    nameEn: 'Life Below Water',
    nameTh: 'ทรัพยากรทางน้ำและทางทะเล',
    description: 'โครงการมีส่วนส่งเสริมการอนุรักษ์แหล่งน้ำ สัตว์น้ำ หรือระบบนิเวศทางน้ำ',
    colorHex: '#0A97D9'
  },
  {
    code: 15,
    key: 'sdg15',
    nameEn: 'Life on Land',
    nameTh: 'ระบบนิเวศบนบก',
    description: 'โครงการมีส่วนส่งเสริมการอนุรักษ์ทรัพยากรธรรมชาติ พื้นที่สีเขียว หรือความหลากหลายทางชีวภาพ',
    colorHex: '#56C02B'
  },
  {
    code: 17,
    key: 'sdg17',
    nameEn: 'Partnerships for the Goals',
    nameTh: 'หุ้นส่วนเพื่อการพัฒนาที่ยั่งยืน',
    description: 'โครงการก่อให้เกิดความร่วมมือระหว่างมหาวิทยาลัย นักศึกษา บุคลากร ศิษย์เก่า หรือชุมชนในการพัฒนาสังคม',
    colorHex: '#19486A'
  }
];

export const RATING_LABELS: Record<number, string> = {
  5: 'มากที่สุด',
  4: 'มาก',
  3: 'ปานกลาง',
  2: 'น้อย',
  1: 'น้อยที่สุด'
};

export const PSU_FACULTIES: readonly string[] = [
  'คณะวิศวกรรมศาสตร์',
  'คณะวิทยาศาสตร์',
  'คณะแพทยศาสตร์',
  'คณะพยาบาลศาสตร์',
  'คณะวิทยาการจัดการ',
  'คณะทรัพยากรธรรมชาติ',
  'คณะเภสัชศาสตร์',
  'คณะทันตแพทยศาสตร์',
  'คณะสัตวแพทยศาสตร์',
  'คณะอุตสาหกรรมเกษตร',
  'คณะศิลปศาสตร์',
  'คณะเศรษฐศาสตร์',
  'คณะนิติศาสตร์',
  'คณะการแพทย์แผนไทย',
  'คณะเทคนิคการแพทย์',
  'วิทยาลัยนานาชาติ',
  'วิทยาลัยการคอมพิวเตอร์',
  'บัณฑิตวิทยาลัย',
  'วิทยาเขตปัตตานี / ภูเก็ต / สุราษฎร์ธานี / ตรัง',
  'คณะ/หน่วยงานอื่นๆ'
];

const PSU_FACULTY_CODE_MAP: Record<string, string> = {
  '101': 'คณะวิศวกรรมศาสตร์',
  '102': 'คณะวิทยาศาสตร์',
  '103': 'คณะแพทยศาสตร์',
  '104': 'คณะพยาบาลศาสตร์',
  '105': 'คณะวิทยาการจัดการ',
  '106': 'คณะทรัพยากรธรรมชาติ',
  '107': 'คณะเภสัชศาสตร์',
  '108': 'คณะทันตแพทยศาสตร์',
  '109': 'คณะสัตวแพทยศาสตร์',
  '110': 'คณะอุตสาหกรรมเกษตร',
  '111': 'คณะศิลปศาสตร์',
  '112': 'คณะเศรษฐศาสตร์',
  '113': 'คณะนิติศาสตร์',
  '114': 'คณะการแพทย์แผนไทย',
  '115': 'คณะเทคนิคการแพทย์',
  '116': 'วิทยาลัยนานาชาติ',
  '120': 'วิทยาลัยการคอมพิวเตอร์'
};

/**
 * เดาคณะอัตโนมัติจากรหัสคณะ 3 หลักในรหัสนักศึกษา 10 หลัก (เช่น 6610110xxx -> 101 คณะวิศวกรรมศาสตร์)
 */
export function guessFacultyFromStudentId(studentId: string): string {
  const digits = (studentId || '').replace(/\D/g, '');
  if (digits.length < 5) return '';
  const campusFacCode = digits.slice(2, 5);
  if (PSU_FACULTY_CODE_MAP[campusFacCode]) {
    return PSU_FACULTY_CODE_MAP[campusFacCode];
  }
  const campusChar = digits[2];
  if (['2', '3', '4', '5'].includes(campusChar)) {
    return 'วิทยาเขตปัตตานี / ภูเก็ต / สุราษฎร์ธานี / ตรัง';
  }
  return '';
}

export interface ParsedEvaluationRecord {
  id: string;
  krathong_id?: string | null;
  schemaVersion: 3 | 1;
  pdpaAccepted?: boolean;
  user_type: 'student' | 'staff' | 'general' | string;
  student_id: string;
  student_name?: string;
  faculty?: string;
  major?: string;
  year_level?: string;
  role?: string;
  device_id?: string;
  scores: number[]; // V3 = 36 ข้อหลัก, V1 = 10 ข้อเดิม
  community_scores?: number[]; // V3 สำหรับบุคคลทั่วไป/ชุมชน = 4 ข้อ (ส่วนที่ 15)
  sdg_results?: boolean[]; // V3 = 7 เป้าหมาย SDGs (5, 11, 12, 13, 14, 15, 17)
  average_score: number;
  feedback_impressed?: string;
  feedback_improve?: string;
  feedback_other?: string;
  comment: string;
  created_at: string;
}

export interface StudentTranscriptEntry {
  student_id: string;
  student_name: string;
  faculty: string;
  major: string;
  year_level: string;
  device_id: string;
  deviceStatus: 'verified' | 'shared_device';
  created_at: string;
  krathong_id?: string | null;
  schemaVersion?: 3 | 1;
}

export interface FacultyCountRow {
  faculty: string;
  count: number;
  percentage: number;
}

export interface StudentTranscriptRoster {
  uniqueStudents: StudentTranscriptEntry[];
  totalSubmittedStudentRows: number;
  duplicateIdCount: number;
  sharedDeviceCount: number;
  facultyBreakdown: FacultyCountRow[];
}

export interface QuestionStatRow {
  questionId: number;
  dimensionId: string;
  subGroupLabel?: string;
  shortLabel: string;
  title: string;
  totalN: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
  mean: number;
  sd: number;
  levelText: string;
}

export interface DimensionStatRow {
  dimensionId: string;
  label: string;
  shortLabel: string;
  sectionGroup: string;
  questionCount: number;
  totalN: number;
  mean: number;
  sd: number;
  levelText: string;
}

export interface KpiStatRow {
  key: 'overall' | 'tradition_eco' | 'relationship';
  label: string;
  target: number;
  mean: number;
  sd: number;
  passed: boolean;
}

export interface SdgStatRow {
  code: number;
  key: string;
  nameEn: string;
  nameTh: string;
  description: string;
  colorHex: string;
  totalN: number;
  compliantCount: number;
  nonCompliantCount: number;
  compliantPct: number;
  nonCompliantPct: number;
}

export interface EvaluationAnalyticsSummary {
  totalN: number;
  legacyExcludedCount: number;
  userTypeCounts: {
    student: number;
    staff: number;
    general: number;
  };
  dimensionStats: DimensionStatRow[];
  questionStats: QuestionStatRow[];
  communityStats: QuestionStatRow[];
  communityN: number;
  kpiStats: KpiStatRow[];
  sdgStats: SdgStatRow[];
  overallMean: number;
  overallSD: number;
  overallLevelText: string;
  highestDimension: DimensionStatRow | null;
  lowestDimension: DimensionStatRow | null;
  records: ParsedEvaluationRecord[];
}

export interface EncodeEvaluationV3Params {
  pdpaAccepted: boolean;
  scores: number[]; // ความยาว 36
  communityScores?: number[]; // ความยาว 4 (เฉพาะบุคคลทั่วไป)
  sdgResults: boolean[]; // ความยาว 7
  studentId?: string;
  faculty?: string;
  major?: string;
  yearCode?: string;
  role?: string;
  deviceId?: string;
  feedbackImpressed?: string;
  feedbackImprove?: string;
  feedbackOther?: string;
}

/**
 * แปลผลค่าเฉลี่ยคะแนนความพึงพอใจตามเกณฑ์มาตรฐาน 5 ระดับ
 */
export function getSatisfactionLevelText(mean: number): string {
  if (mean >= 4.51) return 'มากที่สุด';
  if (mean >= 3.51) return 'มาก';
  if (mean >= 2.51) return 'ปานกลาง';
  if (mean >= 1.51) return 'น้อย';
  return 'น้อยที่สุด';
}

function normalizeScoreDigit(val: unknown, fallback = 5): number {
  const num = Math.round(Number(val));
  if (!Number.isFinite(num) || num < 1 || num > 5) return fallback;
  return num;
}

function buildCombinedFeedbackSummary(
  impressed: string,
  improve: string,
  other: string
): string {
  const parts: string[] = [];
  if (impressed.trim()) parts.push(`ประทับใจ: ${impressed.trim()}`);
  if (improve.trim()) parts.push(`ควรปรับปรุง: ${improve.trim()}`);
  if (other.trim()) parts.push(`อื่นๆ: ${other.trim()}`);
  return parts.join(' | ');
}

/**
 * เข้ารหัสข้อมูลประเมินมาตรฐาน V3 (36 ข้อหลัก + 4 ข้อชุมชน + 7 SDGs + ข้อมูลผู้ตอบ + ข้อเสนอแนะ 3 ช่อง)
 * ลงในสตริง JSON กระชับที่รับประกันความยาวไม่เกิน 980 ตัวอักษร เพื่อรองรับ constraint <= 1000 ของ D1 และ Supabase RLS
 */
export function encodeEvaluationPayload(params: EncodeEvaluationV3Params): string {
  const coreDigits = EVALUATION_QUESTIONS.map((_, idx) =>
    String(normalizeScoreDigit(params.scores[idx], 5))
  ).join('');

  const communityDigits =
    Array.isArray(params.communityScores) &&
    params.communityScores.length === COMMUNITY_EVALUATION_QUESTIONS.length
      ? COMMUNITY_EVALUATION_QUESTIONS.map((_, idx) =>
          String(normalizeScoreDigit(params.communityScores![idx], 5))
        ).join('')
      : '';

  const sdgDigits = SDG_EVALUATION_ITEMS.map((_, idx) => (params.sdgResults[idx] ? '1' : '0')).join('');

  let c1 = (params.feedbackImpressed || '').trim().slice(0, 150);
  let c2 = (params.feedbackImprove || '').trim().slice(0, 150);
  let c3 = (params.feedbackOther || '').trim().slice(0, 100);
  let maj = (params.major || '').trim().slice(0, 60);
  let rl = (params.role || '').trim().slice(0, 50);

  const payloadObj: Record<string, unknown> = {
    v: 3,
    pd: params.pdpaAccepted ? 1 : 0,
    s: coreDigits,
    sdg: sdgDigits,
    sid: (params.studentId || '').replace(/\D/g, '').trim().slice(0, 15)
  };

  if (communityDigits) payloadObj.cs = communityDigits;
  if ((params.faculty || '').trim()) payloadObj.fac = (params.faculty || '').trim().slice(0, 50);
  if (maj) payloadObj.maj = maj;
  const yrCode = normalizeYearCode(params.yearCode || '');
  if (yrCode) payloadObj.yr = yrCode;
  if (rl) payloadObj.rl = rl;
  if ((params.deviceId || '').trim()) payloadObj.did = (params.deviceId || '').trim().slice(0, 16);
  if (c1) payloadObj.c1 = c1;
  if (c2) payloadObj.c2 = c2;
  if (c3) payloadObj.c3 = c3;

  const rebuildAndCheck = () => {
    if (c1) payloadObj.c1 = c1;
    else delete payloadObj.c1;
    if (c2) payloadObj.c2 = c2;
    else delete payloadObj.c2;
    if (c3) payloadObj.c3 = c3;
    else delete payloadObj.c3;
    if (maj) payloadObj.maj = maj;
    else delete payloadObj.maj;
    if (rl) payloadObj.rl = rl;
    else delete payloadObj.rl;
    return JSON.stringify(payloadObj);
  };

  let serialized = rebuildAndCheck();
  while (serialized.length > 980) {
    if (c3.length > 0) {
      c3 = c3.slice(0, Math.max(0, c3.length - Math.max(10, serialized.length - 980)));
    } else if (c2.length > 0) {
      c2 = c2.slice(0, Math.max(0, c2.length - Math.max(10, serialized.length - 980)));
    } else if (c1.length > 0) {
      c1 = c1.slice(0, Math.max(0, c1.length - Math.max(10, serialized.length - 980)));
    } else if (rl.length > 20) {
      rl = rl.slice(0, rl.length - 10);
    } else if (maj.length > 20) {
      maj = maj.slice(0, maj.length - 10);
    } else {
      break;
    }
    serialized = rebuildAndCheck();
  }

  return serialized;
}

/**
 * แปลงแถวข้อมูลจากฐานข้อมูลหรือ LocalStorage (รองรับทั้งรูปแบบมาตรฐานใหม่ V3 และข้อมูลทดสอบชุดเก่า 10 ข้อ)
 */
export function parseEvaluationRow(raw: any, index = 0): ParsedEvaluationRecord {
  const baseRating = normalizeScoreDigit(raw?.rating, 5);
  const coreCount = EVALUATION_QUESTIONS.length;
  const communityCount = COMMUNITY_EVALUATION_QUESTIONS.length;
  const sdgCount = SDG_EVALUATION_ITEMS.length;

  // รองรับ Pre-parsed V3 Record จาก LocalStorage หรือ Demo Records
  if (raw?.schemaVersion === 3 && Array.isArray(raw?.scores) && raw.scores.length === coreCount) {
    const cleanScores = raw.scores.map((n: unknown) => normalizeScoreDigit(n, baseRating));
    const cleanCommunity =
      Array.isArray(raw.community_scores) && raw.community_scores.length === communityCount
        ? raw.community_scores.map((n: unknown) => normalizeScoreDigit(n, baseRating))
        : [];
    const cleanSdgs =
      Array.isArray(raw.sdg_results) && raw.sdg_results.length === sdgCount
        ? raw.sdg_results.map((b: unknown) => Boolean(b))
        : [];
    const sid = String(raw.student_id || '').trim();
    const derivedFaculty = sid ? guessFacultyFromStudentId(sid) : '';
    const c1 = String(raw.feedback_impressed || '').trim();
    const c2 = String(raw.feedback_improve || '').trim();
    const c3 = String(raw.feedback_other || '').trim();
    const comment = String(raw.comment || '').trim() || buildCombinedFeedbackSummary(c1, c2, c3);
    const avg = Number(
      (cleanScores.reduce((a: number, b: number) => a + b, 0) / cleanScores.length).toFixed(2)
    );

    return {
      id: raw.id || `eval-${index + 1}`,
      krathong_id: raw.krathong_id || null,
      schemaVersion: 3,
      pdpaAccepted: raw.pdpaAccepted !== false,
      user_type: raw.user_type || 'general',
      student_id: sid,
      student_name: String(raw.student_name || '').trim(),
      faculty: derivedFaculty || String(raw.faculty || '').trim(),
      major: String(raw.major || '').trim(),
      year_level: formatYearLevel(String(raw.year_level || '')),
      role: String(raw.role || '').trim(),
      device_id: String(raw.device_id || '').trim(),
      scores: cleanScores,
      community_scores: cleanCommunity,
      sdg_results: cleanSdgs,
      average_score: avg,
      feedback_impressed: c1,
      feedback_improve: c2,
      feedback_other: c3,
      comment,
      created_at: raw.created_at || new Date().toISOString()
    };
  }

  let scores: number[] = Array(10).fill(baseRating);
  let schemaVersion: 3 | 1 = 1;
  let pdpaAccepted = false;
  let studentId = '';
  let studentName = '';
  let faculty = '';
  let major = '';
  let yearLevel = '';
  let role = '';
  let deviceId = '';
  let communityScores: number[] = [];
  let sdgResults: boolean[] = [];
  let c1 = '';
  let c2 = '';
  let c3 = '';
  let comment = '';

  const rawFeedback = typeof raw?.feedback === 'string' ? raw.feedback.trim() : '';
  const jsonCandidate = rawFeedback.startsWith('__EVAL_V2__:')
    ? rawFeedback.slice('__EVAL_V2__:'.length).trim()
    : rawFeedback;

  if (jsonCandidate.startsWith('{')) {
    try {
      const parsed = JSON.parse(jsonCandidate);

      if (
        parsed?.v === 3 &&
        ((typeof parsed.s === 'string' && parsed.s.length === coreCount) ||
          (Array.isArray(parsed.s) && parsed.s.length === coreCount))
      ) {
        schemaVersion = 3;
        pdpaAccepted = parsed.pd === 1 || parsed.pd === true;
        scores =
          typeof parsed.s === 'string'
            ? Array.from(parsed.s, (ch: string) => normalizeScoreDigit(ch, baseRating))
            : parsed.s.map((n: unknown) => normalizeScoreDigit(n, baseRating));

        if (typeof parsed.cs === 'string' && parsed.cs.length === communityCount) {
          communityScores = Array.from(parsed.cs, (ch: string) => normalizeScoreDigit(ch, baseRating));
        } else if (Array.isArray(parsed.cs) && parsed.cs.length === communityCount) {
          communityScores = parsed.cs.map((n: unknown) => normalizeScoreDigit(n, baseRating));
        }

        if (typeof parsed.sdg === 'string' && parsed.sdg.length === sdgCount) {
          sdgResults = Array.from(parsed.sdg, (ch: string) => ch === '1');
        } else if (Array.isArray(parsed.sdg) && parsed.sdg.length === sdgCount) {
          sdgResults = parsed.sdg.map((v: unknown) => v === 1 || v === true || v === '1');
        }

        if (typeof parsed.sid === 'string') studentId = parsed.sid;
        if (typeof parsed.fac === 'string') faculty = parsed.fac;
        if (typeof parsed.maj === 'string') major = parsed.maj;
        if (typeof parsed.yr === 'string') yearLevel = formatYearLevel(parsed.yr);
        if (typeof parsed.rl === 'string') role = parsed.rl;
        if (typeof parsed.did === 'string') deviceId = parsed.did;
        if (typeof parsed.c1 === 'string') c1 = parsed.c1.trim();
        if (typeof parsed.c2 === 'string') c2 = parsed.c2.trim();
        if (typeof parsed.c3 === 'string') c3 = parsed.c3.trim();
        comment = buildCombinedFeedbackSummary(c1, c2, c3);
      } else {
        // ข้อมูลประเมินชุดเก่า (10 ข้อ) หรือ __EVAL_V2__
        if (Array.isArray(parsed.s) && parsed.s.length === 10) {
          scores = parsed.s.map((n: any) => normalizeScoreDigit(n, baseRating));
        } else if (Array.isArray(parsed.scores) && parsed.scores.length === 10) {
          scores = parsed.scores.map((n: any) => normalizeScoreDigit(n, baseRating));
        } else if (parsed.scores && typeof parsed.scores === 'object') {
          scores = Array.from({ length: 10 }, (_, idx) => {
            const val = parsed.scores[`q${idx + 1}`] ?? parsed.scores[idx] ?? baseRating;
            return normalizeScoreDigit(val, baseRating);
          });
        }
        if (typeof parsed.sid === 'string') {
          studentId = parsed.sid;
        } else if (typeof parsed.student_id === 'string') {
          studentId = parsed.student_id;
        }
        if (typeof parsed.name === 'string') {
          studentName = parsed.name;
        } else if (typeof parsed.student_name === 'string') {
          studentName = parsed.student_name;
        }
        if (typeof parsed.fac === 'string') {
          faculty = parsed.fac;
        } else if (typeof parsed.faculty === 'string') {
          faculty = parsed.faculty;
        }
        if (typeof parsed.did === 'string') {
          deviceId = parsed.did;
        } else if (typeof parsed.device_id === 'string') {
          deviceId = parsed.device_id;
        }
        if (typeof parsed.c === 'string') {
          comment = parsed.c;
        } else if (typeof parsed.comment === 'string') {
          comment = parsed.comment;
        }
      }
    } catch {
      const commentMatch = jsonCandidate.match(/"(?:comment|c|c1)"\s*:\s*"([^"]*)"/);
      comment = commentMatch ? commentMatch[1] : '';
    }
  } else if (Array.isArray(raw?.scores) && raw.scores.length === 10) {
    scores = raw.scores.map((n: any) => normalizeScoreDigit(n, baseRating));
    studentId = raw.student_id || '';
    studentName = raw.student_name || '';
    faculty = raw.faculty || '';
    deviceId = raw.device_id || '';
    comment = raw.comment || rawFeedback;
  } else {
    comment = rawFeedback;
  }

  const avg = Number(
    (scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)).toFixed(2)
  );
  const cleanSid = (studentId || '').trim();
  const derivedFaculty = cleanSid ? guessFacultyFromStudentId(cleanSid) : '';

  return {
    id: raw?.id || `eval-${index + 1}`,
    krathong_id: raw?.krathong_id || null,
    schemaVersion,
    pdpaAccepted,
    user_type: raw?.user_type || 'general',
    student_id: cleanSid,
    student_name: (studentName || '').trim(),
    faculty: derivedFaculty || (faculty || '').trim(),
    major: (major || '').trim(),
    year_level: (yearLevel || '').trim(),
    role: (role || '').trim(),
    device_id: (deviceId || '').trim(),
    scores,
    community_scores: communityScores,
    sdg_results: sdgResults,
    average_score: avg,
    feedback_impressed: c1,
    feedback_improve: c2,
    feedback_other: c3,
    comment,
    created_at: raw?.created_at || new Date().toISOString()
  };
}

const LOCAL_EVAL_STORAGE_KEY = 'loy_krathong_evaluations_10q_v1';
const LOCAL_KRATHONG_STORAGE_KEY = 'loy_krathong_items_v1';
const LOCAL_KRATHONG_CLEAN_FLAG = 'loy_krathong_clean_v2';
const LOCAL_APPROVAL_SETTING_KEY = 'loy_krathong_require_approval_v1';
const LOCAL_MODERATION_OVERRIDES_KEY = 'loy_krathong_moderation_overrides_v1';
const LOCAL_DELETED_EVAL_IDS_KEY = 'loy_krathong_deleted_eval_ids_v1';
const LOCAL_DEVICE_TOKEN_KEY = 'loy_krathong_device_token_v1';
const LOCAL_BOUND_STUDENT_ID_KEY = 'loy_krathong_bound_sid_v1';

/**
 * สร้างหรือดึง Device Token ประจำเบราว์เซอร์ เพื่อตรวจสอบกรณีมีการลงทะเบียนหลายรหัสจากอุปกรณ์เดียวกัน
 */
export function getOrCreateDeviceToken(): string {
  try {
    if (typeof localStorage === 'undefined') return 'srv-device';
    const existing = localStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 12);
    localStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return 'mem-device';
  }
}

export function getBoundStudentId(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const sid = localStorage.getItem(LOCAL_BOUND_STUDENT_ID_KEY);
    return sid ? sid.trim() : null;
  } catch {
    return null;
  }
}

export function bindStudentIdToDevice(studentId: string): void {
  try {
    const clean = (studentId || '').trim();
    if (clean && typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_BOUND_STUDENT_ID_KEY, clean);
    }
  } catch {}
}

/**
 * ตรวจสอบว่าอุปกรณ์นี้เคยส่งแบบประเมินความพึงพอใจไปแล้วหรือไม่ (จาก Student ID ที่ผูกไว้หรือประวัติในเครื่อง)
 */
export function hasCompletedEvaluationOnDevice(): boolean {
  try {
    if (getBoundStudentId()) return true;
    return getLocalEvaluationRecords().some((rec) => rec.schemaVersion === 3);
  } catch {
    return false;
  }
}

/**
 * ล้างสถานะล็อกเครื่อง ประวัติแบบประเมินในเครื่อง และ Rate Limit เพื่อใช้ทดสอบระบบ (ไม่กระทบฐานข้อมูล Supabase/D1)
 */
export function resetDeviceEvaluationLock(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_BOUND_STUDENT_ID_KEY);
      localStorage.removeItem(LOCAL_EVAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_DEVICE_TOKEN_KEY);
    }
  } catch {}

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('rl_krathong_submit');
      sessionStorage.removeItem('rl_evaluation_submit');
    }
  } catch {}
}

export function getDeletedEvaluationIds(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_DELETED_EVAL_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function mergeDeletedEvaluationIds(ids: string[]): string[] {
  try {
    const current = getDeletedEvaluationIds();
    const merged = Array.from(new Set([...current, ...ids.filter(Boolean).map(String)]));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_DELETED_EVAL_IDS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return getDeletedEvaluationIds();
  }
}

/**
 * ลบประวัติการประเมิน 1 รายการตาม ID ออกจาก LocalStorage (และปลดล็อกเครื่องหากตรงกับรหัสที่ผูกไว้)
 */
export function deleteLocalEvaluationById(evalId: string): void {
  if (!evalId) return;
  try {
    if (typeof localStorage !== 'undefined') {
      const records = getLocalEvaluationRecords();
      let deletedStudentId = '';
      const kept = records.filter((rec) => {
        if (rec.id === evalId) {
          if (rec.user_type === 'student' && rec.student_id) {
            deletedStudentId = rec.student_id.trim();
          }
          return false;
        }
        return true;
      });
      localStorage.setItem(LOCAL_EVAL_STORAGE_KEY, JSON.stringify(kept));
      if (deletedStudentId && getBoundStudentId() === deletedStudentId) {
        localStorage.removeItem(LOCAL_BOUND_STUDENT_ID_KEY);
      }
    }
  } catch {}
}

/**
 * ลบประวัติการประเมินของรหัสนักศึกษาที่ระบุออกจาก LocalStorage และปลดล็อกเครื่องหากผูกกับรหัสนี้ไว้ (เพื่อใช้ทดสอบซ้ำ)
 */
export function deleteLocalEvaluationsByStudentId(studentId: string): string[] {
  const cleanSid = (studentId || '').trim();
  const removedIds: string[] = [];
  if (!cleanSid) return removedIds;

  try {
    if (typeof localStorage !== 'undefined') {
      const records = getLocalEvaluationRecords();
      const kept = records.filter((rec) => {
        if ((rec.student_id || '').trim() === cleanSid) {
          if (rec.id) removedIds.push(rec.id);
          return false;
        }
        return true;
      });
      localStorage.setItem(LOCAL_EVAL_STORAGE_KEY, JSON.stringify(kept));

      if (getBoundStudentId() === cleanSid) {
        localStorage.removeItem(LOCAL_BOUND_STUDENT_ID_KEY);
      }
    }
  } catch {}

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('rl_evaluation_submit');
    }
  } catch {}

  return removedIds;
}

// รายการ ID ทดสอบระบบช่วงพัฒนาที่เคลียร์ออกจากหน้าเว็บและสถิติเริ่มต้น
const DEFAULT_HIDDEN_IDS: Record<string, 'approved' | 'rejected' | 'deleted'> = {
  'f2d13964-5717-4aea-b14d-d6ad1c8a40b0': 'deleted',
  '589097cb-612c-43b0-aeba-680958b0c47f': 'deleted',
  'a8c1eb41-198b-4182-a2a7-6a4783d6aedb': 'deleted',
  '19dfe3ad-e967-4f78-a638-61ac4b50226a': 'deleted',
  'e357eecc-e1f0-4ed8-8176-8da4634e2dfb': 'deleted'
};

function ensureLegacyLocalKrathongsCleared(): void {
  try {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(LOCAL_KRATHONG_CLEAN_FLAG)) {
      localStorage.removeItem(LOCAL_KRATHONG_STORAGE_KEY);
      localStorage.setItem(LOCAL_KRATHONG_CLEAN_FLAG, '1');
    }
  } catch {}
}

export interface LocalKrathongRecord {
  id: string;
  user_type: string;
  owner_name: string;
  wish_message: string;
  base_type: string;
  flower_type: string;
  candle_color: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export function getModerationOverrides(): Record<string, 'approved' | 'rejected' | 'deleted'> {
  try {
    const raw = localStorage.getItem(LOCAL_MODERATION_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_HIDDEN_IDS, ...(typeof parsed === 'object' && parsed ? parsed : {}) };
  } catch {
    return { ...DEFAULT_HIDDEN_IDS };
  }
}

export function mergeModerationOverrides(
  remoteOverrides: Record<string, string>
): Record<string, 'approved' | 'rejected' | 'deleted'> {
  try {
    const current = getModerationOverrides();
    const merged: Record<string, 'approved' | 'rejected' | 'deleted'> = {
      ...DEFAULT_HIDDEN_IDS,
      ...(remoteOverrides as any),
      ...current
    };
    localStorage.setItem(LOCAL_MODERATION_OVERRIDES_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return getModerationOverrides();
  }
}

export function saveLocalKrathongRecord(record: LocalKrathongRecord): void {
  try {
    ensureLegacyLocalKrathongsCleared();
    const existing = getLocalKrathongRecords();
    const filtered = existing.filter((item) => item.id !== record.id);
    const updated = [record, ...filtered].slice(0, 5000);
    localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocalKrathongRecords(): LocalKrathongRecord[] {
  try {
    ensureLegacyLocalKrathongsCleared();
    const raw = localStorage.getItem(LOCAL_KRATHONG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateLocalKrathongStatus(
  krathongId: string,
  status: 'approved' | 'rejected' | 'deleted'
): void {
  try {
    // 1. บันทึกลง Moderation Overrides เพื่อให้ใช้ได้กับทั้งกระทงจาก Supabase, D1 และ LocalStorage
    const overrides = getModerationOverrides();
    overrides[krathongId] = status;
    localStorage.setItem(LOCAL_MODERATION_OVERRIDES_KEY, JSON.stringify(overrides));

    // 2. อัปเดตหรือลบในรายการ LocalStorage
    const existing = getLocalKrathongRecords();
    if (status === 'deleted') {
      const filtered = existing.filter((item) => item.id !== krathongId);
      localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(filtered));
    } else {
      const updated = existing.map((item) =>
        item.id === krathongId ? { ...item, status } : item
      );
      localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}
}

export function getLocalRequireApproval(): boolean {
  try {
    return localStorage.getItem(LOCAL_APPROVAL_SETTING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLocalRequireApproval(val: boolean): void {
  try {
    localStorage.setItem(LOCAL_APPROVAL_SETTING_KEY, val ? 'true' : 'false');
  } catch {}
}

export function saveLocalEvaluationRecord(record: ParsedEvaluationRecord): void {
  try {
    const existing = getLocalEvaluationRecords();
    const updated = [record, ...existing].slice(0, 5000);
    localStorage.setItem(LOCAL_EVAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocalEvaluationRecords(): ParsedEvaluationRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, idx) => parseEvaluationRow(item, idx));
  } catch {
    return [];
  }
}

/**
 * ข้อมูลตัวอย่างเริ่มต้นตามแบบประเมินมาตรฐานใหม่ (V3: 36 ข้อหลัก + 4 ข้อชุมชน + 7 SDGs)
 * เพื่อให้เห็นรูปแบบกราฟ Radar 9 หมวด ตารางสถิติ และรายงาน A4 ได้ทันทีก่อนมีผู้ตอบจริง
 */
export function getDemoEvaluationRecords(): ParsedEvaluationRecord[] {
  const sampleData: ParsedEvaluationRecord[] = [
    {
      id: 'demo-1',
      schemaVersion: 3,
      pdpaAccepted: true,
      user_type: 'student',
      student_id: '6610210245',
      student_name: '',
      faculty: 'คณะวิทยาศาสตร์',
      major: 'วิทยาการคอมพิวเตอร์',
      year_level: 'ชั้นปีที่ 3',
      role: '',
      device_id: 'demo-dev-01',
      scores: [
        5, 5, 5, 5, 4,
        5, 5, 4,
        5, 5, 4, 5,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5, 5, 4, 5, 5, 5,
        5, 5, 5, 5
      ],
      community_scores: [],
      sdg_results: [true, true, true, true, true, true, true],
      average_score: 4.92,
      feedback_impressed: 'แนวคิด 1 ครอบครัว 1 กระทง และลอยกระทงออนไลน์ช่วยลดขยะได้จริง บรรยากาศหน้าตึกฟักทองอบอุ่นมากครับ',
      feedback_improve: 'อยากให้เพิ่มจุดบริการปากกาเมจิกสำหรับตกแต่งพวงกุญแจฝาขวดเพิ่มอีกเล็กน้อย',
      feedback_other: '',
      comment: 'ประทับใจ: แนวคิด 1 ครอบครัว 1 กระทง และลอยกระทงออนไลน์ช่วยลดขยะได้จริง บรรยากาศหน้าตึกฟักทองอบอุ่นมากครับ | ควรปรับปรุง: อยากให้เพิ่มจุดบริการปากกาเมจิกสำหรับตกแต่งพวงกุญแจฝาขวดเพิ่มอีกเล็กน้อย',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    },
    {
      id: 'demo-2',
      schemaVersion: 3,
      pdpaAccepted: true,
      user_type: 'student',
      student_id: '6710110118',
      student_name: '',
      faculty: 'คณะวิศวกรรมศาสตร์',
      major: 'วิศวกรรมเครื่องกล',
      year_level: 'ชั้นปีที่ 2',
      role: '',
      device_id: 'demo-dev-02',
      scores: [
        5, 5, 4, 5, 5,
        4, 5, 4,
        5, 4, 4, 4,
        5, 5, 5,
        5, 4, 5,
        5, 5, 4,
        5, 5, 5,
        4, 5, 5, 4, 4, 5, 4, 5,
        5, 5, 5, 4
      ],
      community_scores: [],
      sdg_results: [true, true, true, true, true, true, true],
      average_score: 4.64,
      feedback_impressed: 'มีทั้งวงดนตรี SMC, Photo Booth และกระทงออนไลน์ขึ้นจอใหญ่ สนุกและรักษ์โลกมากค่ะ',
      feedback_improve: '',
      feedback_other: 'ขอให้จัดกิจกรรมดีๆ แบบนี้ทุกปี',
      comment: 'ประทับใจ: มีทั้งวงดนตรี SMC, Photo Booth และกระทงออนไลน์ขึ้นจอใหญ่ สนุกและรักษ์โลกมากค่ะ | อื่นๆ: ขอให้จัดกิจกรรมดีๆ แบบนี้ทุกปี',
      created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString()
    },
    {
      id: 'demo-3',
      schemaVersion: 3,
      pdpaAccepted: true,
      user_type: 'staff',
      student_id: '',
      student_name: '',
      faculty: '',
      major: 'สาขาวิทยาศาสตร์ชีวภาพ',
      year_level: '',
      role: 'อาจารย์ที่ปรึกษา / ร่วมกิจกรรม',
      device_id: 'demo-dev-03',
      scores: [
        5, 5, 5, 5, 5,
        4, 5, 4,
        5, 5, 5, 4,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5,
        5, 5, 5, 5, 5, 5, 5, 5,
        5, 5, 5, 5
      ],
      community_scores: [],
      sdg_results: [true, true, true, true, true, true, true],
      average_score: 4.92,
      feedback_impressed: 'นักศึกษาจัดการพื้นที่ในตึกฟักทองและบูรณาการแนวคิด SDGs ได้อย่างมีระบบและปลอดภัย',
      feedback_improve: '',
      feedback_other: '',
      comment: 'ประทับใจ: นักศึกษาจัดการพื้นที่ในตึกฟักทองและบูรณาการแนวคิด SDGs ได้อย่างมีระบบและปลอดภัย',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      id: 'demo-4',
      schemaVersion: 3,
      pdpaAccepted: true,
      user_type: 'general',
      student_id: '',
      student_name: '',
      faculty: '',
      major: '',
      year_level: '',
      role: 'ประชาชนในพื้นที่',
      device_id: 'demo-dev-04',
      scores: [
        4, 5, 4, 5, 5,
        4, 5, 4,
        4, 4, 4, 4,
        5, 5, 5,
        5, 5, 4,
        5, 5, 4,
        5, 5, 5,
        4, 5, 5, 4, 4, 5, 4, 5,
        5, 5, 5, 4
      ],
      community_scores: [5, 5, 5, 5],
      sdg_results: [true, true, true, true, true, true, true],
      average_score: 4.58,
      feedback_impressed: 'ชอบที่มีพวงกุญแจจากฝาขวดรีไซเคิลและรายได้สมทบทุนค่ายอาสาฯ ค่ะ',
      feedback_improve: '',
      feedback_other: '',
      comment: 'ประทับใจ: ชอบที่มีพวงกุญแจจากฝาขวดรีไซเคิลและรายได้สมทบทุนค่ายอาสาฯ ค่ะ',
      created_at: new Date(Date.now() - 3600 * 1000 * 1.2).toISOString()
    },
    {
      id: 'demo-5',
      schemaVersion: 3,
      pdpaAccepted: true,
      user_type: 'student',
      student_id: '6810210089',
      student_name: '',
      faculty: 'คณะวิทยาศาสตร์',
      major: 'เคมีประยุกต์',
      year_level: 'ชั้นปีที่ 1',
      role: '',
      device_id: 'demo-dev-05',
      scores: [
        5, 4, 5, 5, 5,
        4, 4, 4,
        5, 4, 5, 4,
        5, 5, 5,
        5, 4, 5,
        5, 5, 4,
        4, 5, 5,
        5, 5, 5, 5, 4, 5, 4, 5,
        5, 5, 5, 4
      ],
      community_scores: [],
      sdg_results: [true, true, true, true, false, true, true],
      average_score: 4.64,
      feedback_impressed: 'ได้ร่วมทำกระทงกับเพื่อนๆ และสมทบทุนค่ายอาสาพัฒนาวิทยาศาสตร์เพื่อชนบท ครั้งที่ 47 ประทับใจมากค่ะ',
      feedback_improve: 'ช่วงเวลาเดินขบวนคนค่อนข้างเยอะ อยากให้จัดโซนทางเดินให้กว้างขึ้นอีกนิดครับ',
      feedback_other: '',
      comment: 'ประทับใจ: ได้ร่วมทำกระทงกับเพื่อนๆ และสมทบทุนค่ายอาสาพัฒนาวิทยาศาสตร์เพื่อชนบท ครั้งที่ 47 ประทับใจมากค่ะ | ควรปรับปรุง: ช่วงเวลาเดินขบวนคนค่อนข้างเยอะ อยากให้จัดโซนทางเดินให้กว้างขึ้นอีกนิดครับ',
      created_at: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString()
    }
  ];

  return sampleData.map((d, i) => parseEvaluationRow(d, i));
}

function computeSampleMeanAndSd(values: number[]): { mean: number; sd: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, sd: 0 };
  const exactMean = values.reduce((a, b) => a + b, 0) / n;
  let varianceSum = 0;
  if (n > 1) {
    for (let i = 0; i < n; i++) {
      varianceSum += Math.pow(values[i] - exactMean, 2);
    }
  }
  return {
    mean: Number(exactMean.toFixed(2)),
    sd: n > 1 ? Number(Math.sqrt(varianceSum / (n - 1)).toFixed(2)) : 0
  };
}

function computeQuestionStatsList(
  questions: readonly EvaluationQuestion[],
  sourceRecords: ParsedEvaluationRecord[],
  getScores: (rec: ParsedEvaluationRecord) => number[] | undefined
): QuestionStatRow[] {
  const totalN = sourceRecords.length;
  return questions.map((q, qIdx) => {
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const values: number[] = [];

    sourceRecords.forEach((rec) => {
      const arr = getScores(rec);
      const score = normalizeScoreDigit(arr?.[qIdx], 5) as 1 | 2 | 3 | 4 | 5;
      counts[score] += 1;
      values.push(score);
    });

    const { mean, sd } = computeSampleMeanAndSd(values);

    const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
      5: totalN > 0 ? Number(((counts[5] / totalN) * 100).toFixed(1)) : 0,
      4: totalN > 0 ? Number(((counts[4] / totalN) * 100).toFixed(1)) : 0,
      3: totalN > 0 ? Number(((counts[3] / totalN) * 100).toFixed(1)) : 0,
      2: totalN > 0 ? Number(((counts[2] / totalN) * 100).toFixed(1)) : 0,
      1: totalN > 0 ? Number(((counts[1] / totalN) * 100).toFixed(1)) : 0
    };

    return {
      questionId: q.id,
      dimensionId: q.dimensionId,
      subGroupLabel: q.subGroupLabel,
      shortLabel: q.shortLabel,
      title: q.title,
      totalN,
      counts,
      percentages,
      mean,
      sd,
      levelText: totalN > 0 ? getSatisfactionLevelText(mean) : '-'
    };
  });
}

/**
 * คำนวณสถิติแบบประเมินมาตรฐานใหม่ V3 (เฉพาะรายการ schemaVersion === 3 เพื่อไม่ให้ข้อมูลชุดเก่าปนกับชุดใหม่)
 * ครอบคลุม 36 ข้อหลัก, 9 หมวด, 4 ข้อเฉพาะชุมชน (ส่วนที่ 15), KPI 3 ข้อหน้า 5, และความสอดคล้อง 7 SDGs
 */
export function calculateEvaluationAnalytics(records: ParsedEvaluationRecord[]): EvaluationAnalyticsSummary {
  const v3Records = records.filter((rec) => rec.schemaVersion === 3);
  const legacyExcludedCount = Math.max(0, records.length - v3Records.length);
  const totalN = v3Records.length;

  const userTypeCounts = {
    student: v3Records.filter((r) => r.user_type === 'student').length,
    staff: v3Records.filter((r) => r.user_type === 'staff').length,
    general: v3Records.filter((r) => r.user_type !== 'student' && r.user_type !== 'staff').length
  };

  const questionStats = computeQuestionStatsList(
    EVALUATION_QUESTIONS,
    v3Records,
    (rec) => rec.scores
  );

  const dimensionStats: DimensionStatRow[] = EVALUATION_DIMENSIONS.map((dim) => {
    const qIndices: number[] = [];
    EVALUATION_QUESTIONS.forEach((q, idx) => {
      if (q.dimensionId === dim.id) qIndices.push(idx);
    });

    const respondentDimMeans = v3Records.map((rec) => {
      const sum = qIndices.reduce((acc, idx) => acc + normalizeScoreDigit(rec.scores[idx], 5), 0);
      return qIndices.length > 0 ? sum / qIndices.length : 0;
    });

    const { mean, sd } = computeSampleMeanAndSd(respondentDimMeans);

    return {
      dimensionId: dim.id,
      label: dim.label,
      shortLabel: dim.shortLabel,
      sectionGroup: dim.sectionGroup,
      questionCount: qIndices.length,
      totalN,
      mean,
      sd,
      levelText: totalN > 0 ? getSatisfactionLevelText(mean) : '-'
    };
  });

  const communityRecords = v3Records.filter(
    (rec) =>
      rec.user_type !== 'student' &&
      rec.user_type !== 'staff' &&
      Array.isArray(rec.community_scores) &&
      rec.community_scores.length === COMMUNITY_EVALUATION_QUESTIONS.length
  );
  const communityN = communityRecords.length;
  const communityStats = computeQuestionStatsList(
    COMMUNITY_EVALUATION_QUESTIONS,
    communityRecords,
    (rec) => rec.community_scores
  );

  const kpiTarget = 4.0;
  const kpiOverallQ = questionStats[EVALUATION_QUESTIONS.findIndex((q) => q.kpiKey === 'overall')];
  const kpiTraditionQ = questionStats[EVALUATION_QUESTIONS.findIndex((q) => q.kpiKey === 'tradition_eco')];
  const kpiRelationQ = questionStats[EVALUATION_QUESTIONS.findIndex((q) => q.kpiKey === 'relationship')];

  const kpiStats: KpiStatRow[] = [
    {
      key: 'overall',
      label: 'ความพึงพอใจภาพรวมของผู้เข้าร่วมกิจกรรม',
      target: kpiTarget,
      mean: kpiOverallQ?.mean ?? 0,
      sd: kpiOverallQ?.sd ?? 0,
      passed: totalN > 0 && (kpiOverallQ?.mean ?? 0) >= kpiTarget
    },
    {
      key: 'tradition_eco',
      label: 'รับรู้คุณค่าประเพณีและแนวคิดการลดขยะ (1 ครอบครัว 1 กระทง / ออนไลน์)',
      target: kpiTarget,
      mean: kpiTraditionQ?.mean ?? 0,
      sd: kpiTraditionQ?.sd ?? 0,
      passed: totalN > 0 && (kpiTraditionQ?.mean ?? 0) >= kpiTarget
    },
    {
      key: 'relationship',
      label: 'ผู้เข้าร่วมเกิดความสัมพันธ์อันดีและได้ทำกิจกรรมร่วมกัน',
      target: kpiTarget,
      mean: kpiRelationQ?.mean ?? 0,
      sd: kpiRelationQ?.sd ?? 0,
      passed: totalN > 0 && (kpiRelationQ?.mean ?? 0) >= kpiTarget
    }
  ];

  const sdgRecords = v3Records.filter(
    (rec) => Array.isArray(rec.sdg_results) && rec.sdg_results.length === SDG_EVALUATION_ITEMS.length
  );
  const sdgTotalN = sdgRecords.length;
  const sdgStats: SdgStatRow[] = SDG_EVALUATION_ITEMS.map((item, idx) => {
    let compliantCount = 0;
    for (let i = 0; i < sdgTotalN; i++) {
      if (sdgRecords[i].sdg_results?.[idx]) compliantCount++;
    }
    const nonCompliantCount = Math.max(0, sdgTotalN - compliantCount);
    return {
      code: item.code,
      key: item.key,
      nameEn: item.nameEn,
      nameTh: item.nameTh,
      description: item.description,
      colorHex: item.colorHex,
      totalN: sdgTotalN,
      compliantCount,
      nonCompliantCount,
      compliantPct: sdgTotalN > 0 ? Number(((compliantCount / sdgTotalN) * 100).toFixed(1)) : 0,
      nonCompliantPct: sdgTotalN > 0 ? Number(((nonCompliantCount / sdgTotalN) * 100).toFixed(1)) : 0
    };
  });

  const respondentOverallMeans = v3Records.map((rec) => {
    const sum = EVALUATION_QUESTIONS.reduce(
      (acc, _, idx) => acc + normalizeScoreDigit(rec.scores[idx], 5),
      0
    );
    return sum / EVALUATION_QUESTIONS.length;
  });
  const { mean: overallMean, sd: overallSD } = computeSampleMeanAndSd(respondentOverallMeans);

  const sortedByMean = [...dimensionStats].sort((a, b) => b.mean - a.mean);
  const highestDimension = totalN > 0 ? sortedByMean[0] : null;
  const lowestDimension = totalN > 0 ? sortedByMean[sortedByMean.length - 1] : null;

  return {
    totalN,
    legacyExcludedCount,
    userTypeCounts,
    dimensionStats,
    questionStats,
    communityStats,
    communityN,
    kpiStats,
    sdgStats,
    overallMean,
    overallSD,
    overallLevelText: totalN > 0 ? getSatisfactionLevelText(overallMean) : '-',
    highestDimension,
    lowestDimension,
    records: v3Records
  };
}

/**
 * สร้างบัญชีรายชื่อนักศึกษาเพื่อบันทึกชั่วโมงกิจกรรม (Activity Transcript)
 * พร้อมระบบตัดรหัสนักศึกษาซ้ำ (Deduplicate), ตรวจจับเครื่องที่ส่งซ้ำหลายรหัส, เก็บสาขา/ชั้นปี และสรุปยอดแยกตามคณะ
 */
export function buildStudentTranscriptRoster(
  records: ParsedEvaluationRecord[],
  _krathongs: { id: string; owner_name: string }[] = []
): StudentTranscriptRoster {
  void _krathongs;
  const validStudentRows = records.filter((rec) => {
    const cleanSid = (rec.student_id || '').trim();
    return rec.user_type === 'student' && /^\d{8,13}$/.test(cleanSid);
  });

  // ตรวจจับ Device Token ที่ส่งมามากกว่า 1 รหัสนักศึกษา
  const deviceToStudentIds = new Map<string, Set<string>>();
  validStudentRows.forEach((rec) => {
    const did = (rec.device_id || '').trim();
    const sid = (rec.student_id || '').trim();
    if (did) {
      if (!deviceToStudentIds.has(did)) {
        deviceToStudentIds.set(did, new Set());
      }
      deviceToStudentIds.get(did)!.add(sid);
    }
  });

  // ตัดรหัสนักศึกษาซ้ำให้เหลือ 1 คนต่อ 1 รหัส
  const dedupedMap = new Map<string, StudentTranscriptEntry>();
  const chronological = [...validStudentRows].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  chronological.forEach((rec) => {
    const sid = (rec.student_id || '').trim();
    const did = (rec.device_id || '').trim();
    const resolvedFaculty =
      guessFacultyFromStudentId(sid) || (rec.faculty || '').trim() || 'คณะ/หน่วยงานอื่นๆ';
    const resolvedMajor = (rec.major || '').trim();
    const resolvedYear = formatYearLevel(rec.year_level || '');

    const sharedOnSameDevice = did ? (deviceToStudentIds.get(did)?.size || 0) > 1 : false;

    const existing = dedupedMap.get(sid);
    if (!existing) {
      dedupedMap.set(sid, {
        student_id: sid,
        student_name: '',
        faculty: resolvedFaculty,
        major: resolvedMajor,
        year_level: resolvedYear,
        device_id: did,
        deviceStatus: sharedOnSameDevice ? 'shared_device' : 'verified',
        created_at: rec.created_at,
        krathong_id: rec.krathong_id || null,
        schemaVersion: rec.schemaVersion
      });
    } else {
      if (
        (existing.faculty === 'ไม่ระบุคณะ' || existing.faculty === 'คณะ/หน่วยงานอื่นๆ') &&
        resolvedFaculty !== 'ไม่ระบุคณะ' &&
        resolvedFaculty !== 'คณะ/หน่วยงานอื่นๆ'
      ) {
        existing.faculty = resolvedFaculty;
      }
      if (!existing.major && resolvedMajor) existing.major = resolvedMajor;
      if (!existing.year_level && resolvedYear) existing.year_level = resolvedYear;
      if (rec.schemaVersion === 3) existing.schemaVersion = 3;
      if (sharedOnSameDevice) {
        existing.deviceStatus = 'shared_device';
      }
    }
  });

  const uniqueStudents = Array.from(dedupedMap.values()).sort((a, b) => {
    const facCmp = a.faculty.localeCompare(b.faculty, 'th');
    if (facCmp !== 0) return facCmp;
    return a.student_id.localeCompare(b.student_id);
  });

  const facultyCounts = new Map<string, number>();
  uniqueStudents.forEach((s) => {
    facultyCounts.set(s.faculty, (facultyCounts.get(s.faculty) || 0) + 1);
  });

  const totalUnique = uniqueStudents.length;
  const facultyBreakdown: FacultyCountRow[] = Array.from(facultyCounts.entries())
    .map(([faculty, count]) => ({
      faculty,
      count,
      percentage: totalUnique > 0 ? Number(((count / totalUnique) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count || a.faculty.localeCompare(b.faculty, 'th'));

  return {
    uniqueStudents,
    totalSubmittedStudentRows: validStudentRows.length,
    duplicateIdCount: Math.max(0, validStudentRows.length - totalUnique),
    sharedDeviceCount: uniqueStudents.filter((s) => s.deviceStatus === 'shared_device').length,
    facultyBreakdown
  };
}

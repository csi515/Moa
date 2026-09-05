import type { IndustryCategory } from './categories';

/** 전용 Module이 있는 업종 (플러그인 레지스트리와 동기화) */
export const MODULE_INDUSTRY_IDS = ['piano', 'pilates', 'gym', 'daycare'] as const;
export type ModuleIndustryId = (typeof MODULE_INDUSTRY_IDS)[number];

type DefinitionSeed = {
  id: string;
  label: string;
  description: string;
  category: IndustryCategory;
  moduleId?: ModuleIndustryId;
};

function def<T extends string>(
  id: T,
  label: string,
  description: string,
  category: IndustryCategory,
  moduleId?: ModuleIndustryId
): {
  id: T;
  label: string;
  description: string;
  category: IndustryCategory;
  moduleId?: ModuleIndustryId;
} {
  return { id, label, description, category, moduleId };
}

/**
 * 단일 출처 업종 목록.
 * INDUSTRY_IDS / INDUSTRY_DEFINITIONS는 여기서만 파생한다.
 * 교과(영어·수학·국어·과학·코딩)는 academy 하나로만 — 과목별 Type·coding_bootcamp 금지.
 */
const DEFINITION_LIST = [
  def('piano', '피아노학원', '원생·출결·수강료·교재 중심 운영', 'education', 'piano'),
  def('academy', '학원 (교과·종합)', '영어·수학·국어·과학·코딩 등 교과/종합 학원', 'education'),
  def('art_academy', '미술학원', '미술·드로잉·디자인 교육', 'education'),
  def('music_academy', '음악학원', '피아노 외 기악·성악 등 (종합)', 'education'),
  def('dance_academy', '무용·댄스학원', '발레·방송댄스 등', 'education'),
  def('language_academy', '어학원', '회화·시험 대비 어학', 'education'),
  def('taekwondo_academy', '태권도장', '태권도·무술 도장 (신규 가입용)', 'education'),
  def('sports_academy', '스포츠 아카데미', '구기·육상 등 스포츠 교육', 'education'),
  def('driver_license_school', '운전면허학원', '운전 교육·면허 학원', 'education'),

  def('pilates', '필라테스학원', '회원·예약·수업 종류·강사 스케줄 중심 운영', 'fitness', 'pilates'),
  def('gym', '체육관', '회원·수업반·차량 운행·출결·수강료 중심 운영', 'fitness', 'gym'),
  def('yoga_studio', '요가 스튜디오', '요가·필라테스 외 바디워크', 'fitness'),
  def('crossfit', '크로스핏', '크로스핏·기능성 트레이닝', 'fitness'),
  def('climbing_gym', '클라이밍짐', '실내 클라이밍', 'fitness'),
  def('swim_school', '수영장·수영교실', '수영 레슨·회원제', 'fitness'),
  def('golf_lesson', '골프 레슨', '골프 연습장·레슨', 'fitness'),
  def('personal_training', '퍼스널 트레이닝', 'PT·1:1 트레이닝', 'fitness'),

  def('hair_salon', '헤어샵', '헤어 미용실', 'beauty'),
  def('nail_salon', '네일샵', '네일·페디큐어', 'beauty'),
  def('skin_clinic', '피부관리', '피부·에스테틱', 'beauty'),
  def('makeup_studio', '메이크업 스튜디오', '메이크업·브라이덜', 'beauty'),
  def('barber_shop', '바버샵', '남성 전문 이발', 'beauty'),
  def('lash_brow', '속눈썹·눈썹', '래쉬·브로우', 'beauty'),

  def('massage_spa', '마사지·스파', '전신·스웨디시 등', 'wellness'),
  def('thai_massage', '타이마사지', '타이·아로마', 'wellness'),
  def('foot_reflexology', '발마사지', '족부·리플렉솔로지', 'wellness'),
  def('sauna_jjimjilbang', '사우나·찜질방', '사우나·찜질', 'wellness'),

  def('daycare', '어린이집', '원아·보호자·반·출결·보육료 중심 운영', 'childcare', 'daycare'),
  def('kids_cafe', '키즈카페', '놀이·돌봄 키즈카페', 'childcare'),
  def('after_school_care', '방과후·돌봄', '초등 돌봄·방과후', 'childcare'),
  def('playgroup', '놀이학교·플레이그룹', '영유아 놀이 프로그램', 'childcare'),

  def('life_coaching', '라이프 코칭', '라이프·커리어 코칭', 'consulting'),
  def('career_consulting', '진로·취업 상담', '진로·취업 컨설팅', 'consulting'),
  def('business_consulting', '경영 컨설팅', '사업·경영 자문', 'consulting'),
  def('psychological_counseling', '심리상담', '심리·상담 센터', 'consulting'),

  def('dental_clinic', '치과', '치과 클리닉 (예약·고객)', 'healthcare'),
  def('oriental_medicine', '한의원', '한방 클리닉', 'healthcare'),
  def('physical_therapy', '물리치료·재활', '재활·물리치료', 'healthcare'),
  def('veterinary_clinic', '동물병원', '동물 진료', 'healthcare'),

  def('private_tutoring', '과외·개인지도', '1:1·소수 과외', 'lesson'),
  def('instrument_lesson', '악기 레슨', '개인 악기 레슨', 'lesson'),
  def('voice_lesson', '보컬 레슨', '성악·보컬', 'lesson'),
  def('cooking_class', '쿠킹 클래스', '요리·베이킹 클래스', 'lesson'),

  def('photo_studio', '사진 스튜디오', '촬영·스튜디오', 'studio'),
  def('craft_workshop', '공방', '수공예·체험 공방', 'studio'),
  def('recording_studio', '녹음실', '녹음·믹싱', 'studio'),
  def('rehearsal_room', '연습실', '밴드·댄스 연습실', 'studio'),

  def('pet_grooming', '반려동물 미용', '펫 그루밍', 'pet'),
  def('pet_hotel', '반려동물 호텔', '펫 호텔·데이케어', 'pet'),
  def('dog_training', '반려견 훈련', '훈련·행동교정', 'pet'),

  def('auto_repair', '자동차 정비', '정비·수리', 'automotive'),
  def('car_wash', '세차장', '세차·디테일링', 'automotive'),
  def('driving_school', '운전연수', '연수·장롱면허', 'automotive'),

  def('real_estate', '부동산', '중개·컨설팅', 'property'),
  def('interior_design', '인테리어', '인테리어·리모델링', 'property'),
  def('cleaning_service', '청소·클리닝', '입주·사무실 청소', 'property'),

  def('tax_accounting', '세무·회계', '세무·기장', 'professional'),
  def('law_office', '법무·변호사', '법률 사무', 'professional'),
  def('it_agency', 'IT·개발사', '개발·IT 서비스', 'professional'),
  def('design_agency', '디자인 에이전시', '디자인·브랜딩', 'professional'),

  def('wedding_planner', '웨딩플래너', '웨딩·스드메', 'event'),
  def('party_event', '파티·행사', '이벤트·파티', 'event'),
  def('funeral_service', '상조·장례', '상조·장례 서비스', 'event'),

  def('hotel_pension', '호텔·펜션', '숙박업', 'travel'),
  def('travel_agency', '여행사', '여행·투어', 'travel'),

  def('restaurant', '음식점', '식당·외식', 'food'),
  def('cafe', '카페', '카페·디저트', 'food'),
  def('bakery', '베이커리', '빵집·베이커리', 'food'),

  def('general_service', '기타 서비스', '목록에 없는 업종', 'other'),
] as const satisfies readonly DefinitionSeed[];

export type IndustryType = (typeof DEFINITION_LIST)[number]['id'];

export interface IndustryDefinition {
  id: IndustryType;
  label: string;
  description: string;
  category: IndustryCategory;
  moduleId?: ModuleIndustryId;
  selectable: boolean;
}

export const INDUSTRY_IDS: IndustryType[] = DEFINITION_LIST.map((d) => d.id);

/**
 * 신규 가입·사업장 생성 UI에 노출하는 업종.
 * 내부 카탈로그/기존 org 데이터는 그대로 두고, 여기만 켜서 단계적으로 공개한다.
 */
export const PUBLIC_SELECTABLE_INDUSTRY_IDS = ['piano'] as const satisfies readonly IndustryType[];

const PUBLIC_SELECTABLE_SET = new Set<string>(PUBLIC_SELECTABLE_INDUSTRY_IDS);

export const INDUSTRY_DEFINITIONS = Object.fromEntries(
  DEFINITION_LIST.map((d) => [
    d.id,
    {
      id: d.id,
      label: d.label,
      description: d.description,
      category: d.category,
      moduleId: d.moduleId,
      selectable: PUBLIC_SELECTABLE_SET.has(d.id),
    } satisfies IndustryDefinition,
  ])
) as Record<IndustryType, IndustryDefinition>;

/** 구 값 → 현재 IndustryType 호환 별칭 */
export const INDUSTRY_ALIASES: Record<string, IndustryType> = {
  taekwondo: 'gym',
  preschool: 'daycare',
  kindergarten: 'daycare',
};

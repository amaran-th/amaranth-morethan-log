export const ALLOWED_TAGS = [
  "Java", "Spring", "테스트", "데이터베이스", "인프라", "설계", "React", "프론트엔드",
  "웹·네트워크", "CS", "AI", "게임 개발", "UX·디자인", "협업·도구", "우아한테크코스",
  "프로젝트", "커리어",
] as const

type Target = { kind: "tag"; value: string } | { kind: "series"; value: string } | { kind: "drop" }
const tag = (value: (typeof ALLOWED_TAGS)[number]): Target => ({ kind: "tag", value })
const series = (value: string): Target => ({ kind: "series", value })
const drop: Target = { kind: "drop" }

// Keys are legacy categories, legacy tags and current-blog tags (spec section 4).
// Lookups are case-insensitive.
export const TAG_MAP: Record<string, Target> = {
  // Java
  "java": tag("Java"), "string": tag("Java"), "제네릭": tag("Java"), "thread": tag("Java"),
  "vo": tag("Java"), "함수형 프로그래밍": tag("Java"),
  // Spring
  "spring": tag("Spring"), "jpa": tag("Spring"), "aop": tag("Spring"),
  // 테스트
  "테스트": tag("테스트"), "test": tag("테스트"), "junit5": tag("테스트"), "학습 테스트": tag("테스트"),
  "mockito": tag("테스트"), "성능 테스트": tag("테스트"),
  // 데이터베이스
  "database": tag("데이터베이스"), "데이터베이스": tag("데이터베이스"),
  "데이터베이스 성능": tag("데이터베이스"), "mysql": tag("데이터베이스"), "정규화": tag("데이터베이스"),
  // 인프라
  "인프라": tag("인프라"), "배포": tag("인프라"), "aws": tag("인프라"), "cicd": tag("인프라"),
  "docker": tag("인프라"), "자동화": tag("인프라"),
  // 설계
  "소프트웨어 설계": tag("설계"), "디자인 패턴": tag("설계"), "소프트웨어 아키텍처": tag("설계"),
  "ddd": tag("설계"), "uml": tag("설계"), "소프트웨어 공학": tag("설계"),
  "개발 방법론": tag("설계"), "방법론": tag("설계"),
  // React
  "react": tag("React"), "recoil": tag("React"), "상태관리 라이브러리": tag("React"),
  "커스텀 훅": tag("React"),
  // 프론트엔드
  "javascript": tag("프론트엔드"), "typescript": tag("프론트엔드"), "nextjs": tag("프론트엔드"),
  "next.js": tag("프론트엔드"), "webpack": tag("프론트엔드"), "three.js": tag("프론트엔드"),
  "라이브러리": tag("프론트엔드"), "프론트엔드": tag("프론트엔드"), "frontend": tag("프론트엔드"),
  "프론트엔드 라이브러리": tag("프론트엔드"), "node": tag("프론트엔드"), "브라우저": tag("프론트엔드"),
  "seo": tag("프론트엔드"), "gatsby": tag("프론트엔드"), "ui": tag("프론트엔드"),
  // 웹·네트워크
  "web": tag("웹·네트워크"), "http": tag("웹·네트워크"), "네트워크": tag("웹·네트워크"),
  "websocket": tag("웹·네트워크"), "실시간 통신": tag("웹·네트워크"), "auth": tag("웹·네트워크"),
  "보안": tag("웹·네트워크"), "graphql": tag("웹·네트워크"), "크롤링": tag("웹·네트워크"),
  // CS
  "cs": tag("CS"), "운영체제": tag("CS"), "자료구조": tag("CS"), "컴퓨터 공학": tag("CS"),
  "알고리즘": tag("CS"), "algorithm": tag("CS"), "코딩 테스트": tag("CS"), "graph": tag("CS"),
  // AI
  "머신러닝": tag("AI"), "딥러닝": tag("AI"),
  // 게임 개발
  "unity": tag("게임 개발"), "c#": tag("게임 개발"),
  // UX·디자인
  "ux": tag("UX·디자인"), "ui 디자인": tag("UX·디자인"), "figma": tag("UX·디자인"),
  "디자인 시스템": tag("UX·디자인"), "sw-css": tag("UX·디자인"),
  // 협업·도구
  "github": tag("협업·도구"), "git": tag("협업·도구"), "형상 관리 툴": tag("협업·도구"),
  "markdown": tag("협업·도구"), "협업": tag("협업·도구"), "페어 프로그래밍": tag("협업·도구"),
  "발표 스터디": tag("협업·도구"), "notion": tag("협업·도구"),
  // 우아한테크코스
  "우아한 테크코스": tag("우아한테크코스"), "우테코 5기": tag("우아한테크코스"),
  // 프로젝트 (legacy BDD posts are all about the BDD dev community)
  "kerdy": tag("프로젝트"), "두레": tag("프로젝트"), "장작": tag("프로젝트"),
  "유스콘": tag("프로젝트"), "프로젝트": tag("프로젝트"), "bdd": tag("프로젝트"),
  // 커리어
  "실무": tag("커리어"), "일을:하자": tag("커리어"), "자기계발": tag("커리어"),
  "생산성": tag("커리어"), "계획": tag("커리어"), "로드맵": tag("커리어"), "근황": tag("커리어"),
  "글쓰기": tag("커리어"), "도서": tag("커리어"), "독후감": tag("커리어"),
  // series
  "기술 부채": series("기술 부채"),
  "java 언어로 배우는 디자인 패턴 입문": series("Java 언어로 배우는 디자인 패턴 입문"),
  "스터디 운영 일지 시리즈": series("스터디 운영 일지"),
  "일일 기술토크 시리즈": series("일일 기술토크"),
  "ux 개선안 시리즈": series("UX 개선안"),
  "인터랙션 만들기 시리즈": series("인터랙션 만들기"),
  // dropped
  "지식 공유": drop, "회고": drop, "회고글": drop, "til": drop, "random": drop, "시리즈": drop,
  "트러블 슈팅": drop, "트러블슈팅": drop, "주저리주저리": drop, "blog": drop,
}

const CATEGORY_BY_SECTION: Record<string, string> = {
  "지식 공유": "💻 개발",
  "문제 해결": "💻 개발",
  "회고": "💬 회고",
}

export function mapCategory(section: string): string {
  const category = CATEGORY_BY_SECTION[section]
  if (!category) throw new Error(`Unknown legacy section: "${section}"`)
  return category
}

export function mapRawTags(category: string, tags: string[]) {
  const result = { tags: [] as string[], series: undefined as string | undefined, unknown: [] as string[] }
  for (const raw of [category, ...tags]) {
    if (!raw) continue
    const target = TAG_MAP[raw.normalize("NFC").trim().toLowerCase()]
    if (!target) result.unknown.push(raw)
    else if (target.kind === "tag" && !result.tags.includes(target.value)) result.tags.push(target.value)
    else if (target.kind === "series") result.series ??= target.value
  }
  return result
}

export function countTags(mapped: string[][]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tags of mapped) for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return counts
}

export function capTags(tags: string[], counts: Map<string, number>, max = 3): string[] {
  return [...tags]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || ALLOWED_TAGS.indexOf(a as never) - ALLOWED_TAGS.indexOf(b as never))
    .slice(0, max)
}

# v0.6.6 — 도적 공통 공격 시작 거리 / 실제 화살 / 새 적

- 단검술 3종과 궁술 3종: 검사와 동일한 기본 600 공격 시작 거리. 장비 범위 보정도 동일 적용.
- 단검술: 전방 공통 사거리 내 타격, 빠른 칼날 잔상 연출. 기존 피해계수·동작시간 유지.
- 피어싱 샷: 1050px/s 이동, 매 업데이트마다 이동 구간과 적 몸체를 검사. 화면 밖 1100까지 이동하며 시작 거리 밖 적에게도 피해와 독 적용. 레벨별 관통 피해 감소/증가 규칙 유지.
- 폭발화살: 첫 충돌 위치에서 기존 스킬 반경으로 한 번 폭발. 관통하지 않고 즉시 소멸. 이후 적 위치를 미리 지정해 즉시 피해 주던 로직 제거.
- 화살비: 공통 거리 안에서 시전 시작, 기존 지정 지역 6회 공격 유지.
- 분신: 단검/궁술 복제 유지. 발사 시 분신 피해 배율 고정, 원본과 별도 관통 기록. 분신 HP 흡수 중복 없음.
- 직업/스테이지 전환 시 남은 화살 피해 종료.
- 일반 적: 6종→10종. 버섯괴물, 고블린, 늑대, 갑옷망령 추가. HP/공격/골드/보스/내성 성장 공식 변경 없음.
- 마법사, 검사, 소환술사 전투 및 장비 수치 유지.

## GitHub 업데이트 (v0.6.5 기준)
- 루트: index.html, sw.js
- js/: game.js, class-data.js, remaster.js
- assets/remaster/: enemies-extra.png, manifest.json
- START.html은 단일 파일 실행용 빌드 결과. 기존 js/firebase-config.js 유지.

## 검증
316개 자동검증 통과: 6개 스킬 공통 준비 거리 및 바깥 시전 차단, 단검 피해 범위, 투사체 비행 지연, 거리 밖 관통/독, 첫 충돌 폭발/소멸, 스테이지 전환 안전성, 4직업 독립 저장, 모든 액티브 시전/유한 수치, 멧돼지 무대상 이동, 모든 그림 프레임 로드, 10종 적 렌더링. 실제 폰에서 체감 확인은 추가 필요.

## 이미지 생성 기록
Built-in image generation 사용. 새 원본: assets/remaster/enemies-extra.png.
Prompt: transparent 2×2 cute polished chibi enemy atlas, full bodies facing left, generous empty gutters; mushroom monster, goblin, dark wolf, haunted armor; clean outlines, restrained shading, no labels or backgrounds. 기존 그림은 재생성하지 않음.

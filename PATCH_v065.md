# v0.6.5 — 검날 찌르기와 소환체 리마스터

- 검사 찌르기 계열: 화살표 검기를 긴 검날/코등이/잔상으로 변경. 판정, 사거리, 피해계수 유지.
- 멧돼지: 대상이 없는 프레임에도 420px/s로 돌진. 적을 처치한 뒤에도 멈추지 않음. 기존 전 높이 관통 판정/1회 적중/보스 둔화 유지.
- 다른 소환체: 개별 이동속도와 공격 시계 유지. 접근 중 밀린 공격을 도착 후 한꺼번에 처리하지 않도록 정리.
- 야수/정령/언데드/골렘/드래곤 14종 새 외형 적용. 기존 HP와 수명/공격 규칙 유지. 정지 그림에 개별 가벼운 상하 움직임 적용, 다프레임 걷기 애니메이션은 아님.
- 원본 소환체 그림: assets/remaster/allies.png. 기존 캐릭터 그림 재생성 없음. 자동 빌드 시 원본 파일을 재사용.

## GitHub 교체 (v0.6.4 기준)
index.html, sw.js, js/game.js, js/remaster.js, assets/remaster/allies.png, assets/remaster/manifest.json.
START.html은 단일 파일 실행용. 기존 js/firebase-config.js를 유지할 것.

## 생성 기록
Built-in image generation. Prompt: transparent 4×4 chibi fantasy creature atlas, right-facing full bodies, generous margins; boar/wolf/griffin/lesser spirit/greater spirit/spirit king/skeleton/skeleton mage/death knight/stone golem/iron golem/diamond golem/young dragon/ancient dragon/golden dragon/wisp. 마지막 두 칸은 미사용 예비 그림.

## 검증
VM 746항목, 기존 마법사 회귀 59항목 통과. 멧돼지 무대상 이동/처치 후 이동/늑대 독립 이동 추가 검증. 실제 휴대전화에서 움직임 체감 확인 필요.

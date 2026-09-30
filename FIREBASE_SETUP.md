# 랭킹 서버(Firebase) 설정 — 한 번만 하면 됩니다

무료 요금제(Spark)로 충분해요. 카드 등록 없이 진행됩니다.

1. https://console.firebase.google.com → **프로젝트 추가** (예: mage-rising). Google 애널리틱스는 꺼도 됩니다.
2. 프로젝트 홈 → **`</>` 웹 앱 추가** → 앱 이름 입력 → (Hosting은 체크 안 해도 됨) → 등록.
   화면에 나오는 `firebaseConfig` 중 **apiKey, authDomain, projectId, appId** 4개를 복사해서
   `js/firebase-config.js` 에 붙여넣으세요.
3. 왼쪽 메뉴 **빌드 → Authentication → 시작하기 → 로그인 방법 → 익명** 을 사용 설정.
4. 같은 화면 **설정 → 승인된 도메인** 에 `dongfu-game.github.io` 추가.
5. **빌드 → Firestore Database → 데이터베이스 만들기** → 위치는 `asia-northeast3 (서울)` → **프로덕션 모드로 시작**.
6. Firestore → **규칙** 탭에 `firebase/firestore.rules` 내용을 통째로 붙여넣고 **게시**.
7. (권장) Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보 → 해당 API 키 →
   **애플리케이션 제한: 웹사이트** → `https://dongfu-game.github.io/*` 만 허용.
8. 수정한 파일들을 GitHub에 올리면 끝. 게임에서 🏆 → 닉네임 설정 → 랭킹이 보이면 성공입니다.

## 참고
- 랭킹 기준은 **최고 스테이지**, 같으면 **마력 레벨** 높은 순입니다.
- 플레이어 식별은 익명 로그인이라, 브라우저 데이터를 지우거나 기기를 바꾸면 새 랭킹 기록이 만들어집니다.
- 저장 파일은 브라우저에서 수정이 가능하므로, 규칙의 상한(스테이지 1000, 마력 99999)을 넘는 기록만 막을 수 있고 그 안쪽 조작까지는 막지 못합니다.
  (엄격하게 막으려면 서버(Cloud Functions)에서 검증하는 구조가 필요합니다.)
- 닉네임 중복은 허용되고, 욕설 필터는 넣지 않았습니다. 필요하면 Firestore 콘솔에서 해당 문서를 삭제하면 됩니다.

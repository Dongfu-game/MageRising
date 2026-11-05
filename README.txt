MageRising 바다 연출 및 스타폴 패치 — GitHub main 9d85cfd517cde39fa5240bb9571491129a0983ea 기준

저장소 루트: index.html, sw.js
js 폴더: game.js, cosmic-fx.js
assets/sea 폴더: wave.png, waterspout.png, tsunami.png (폴더가 없다면 생성)
assets/starfall 폴더: star-single.png

바다 시전 이펙트와 블리자드가 겹쳐 표시되지 않도록 해당 경계에서 기다립니다. 정확한 기존 원인은 확인되지 않았습니다. 바다 전장 오버레이와 이미지 애니메이션을 적용하며, 스타폴은 북두칠성을 유지하고 개별 유성을 이동시킵니다. 기존 스킬 피해 수치 및 저장 데이터는 변경하지 않았습니다.
코드 검사: 일반 마법 순서, 스타폴 및 블랙홀 발동, 바다 이펙트 중 블리자드 대기, 유성 렌더 호출. 실제 브라우저 게임과 모바일 화면에서는 검증하지 못했습니다. 업로드 전에 게임 설정에서 저장 파일을 내보내 백업하세요.

# VISUALIZING TOUCH

`MASTER_SPEC.md` 개정 2, Frame 1/2, 기본디자인 PDF 7개, 제공 소재 PNG 8개와 확대 PNG 8개를 기반으로 구현한 데스크톱 웹 체험입니다.

## 실행

```sh
npm install
npm run dev -- --port 5173
```

로컬 주소: http://127.0.0.1:5173

```sh
npm run build
npm test
```

테스트 실행 시 개발 서버가 실행 중이어야 합니다. Playwright Chromium이 없는 환경은 `npx playwright install chromium`을 먼저 실행합니다. 결과는 `playwright-report/`, 검수 스크린샷은 `tmp/qa/`에 저장됩니다. 배포는 수행하지 않았습니다.

## 사용

- 인트로 → 소개 문장 → 7개 카테고리 → 소재 등장 → 탐색: 마우스 휠. 소개의 쉼표는 약 1.5초 대기 후 추가 입력으로 이어집니다. 위/아래 방향키도 사용할 수 있습니다.
- 탐색: 커서를 가장자리로 이동하면 3D 시점이 회전합니다. 소재 또는 연결된 이름을 클릭합니다.
- 상세: OBSERVE 드래그는 360° 회전, DEFORM 클릭/드래그는 소재별 변형입니다. 휠과 왼쪽 막대는 40~300% 확대 상태를 공유합니다. 막대 키보드 조작: 위/아래 10%, Home 40%, End 300%.
- 별: 즐겨찾기 추가/해제. FAV에서 휠로 순환합니다. 관성 정지 후 3초가 지나면 해당 소재의 설명이 나타납니다. 첫 진입은 이 3초 대기가 없습니다.
- RETURN: 실제 직전 장면과 관찰 상태를 복구합니다. 별 선택은 복귀로 취소되지 않으며 새로고침하면 초기화됩니다.
- 사운드: 첫 사용자 입력 후 재생이 가능합니다. 기본 ON·13%, OFF는 출력 이득 0입니다.

## 구조

- `src/App.tsx`: 장면 전환, 이력 snapshot, 입력 라우팅, 즐겨찾기, 라벨 배치.
- `src/state.ts`: 명세 상태, 소개 스크롤/쉼표 gate.
- `src/scene.ts`: WebGL, 8종 절차 모델, 사진/3D 전환, 변형/확대/입자.
- `src/components.tsx`: 타이핑, 원본 SVG 타이틀, 지속 배경, 실제 출력 파형.
- `src/audio.ts`: Web Audio 합성음, cue, 지속음, mute, limiter, analyser.
- `src/data/materials.ts`: 소재 설명과 ID 연결.
- `src/data/more-links.json`: 검증한 외부 참고 링크 및 범위.
- `src/data/asset-manifest.json`: 자산 출처와 근사 제작 범위.
- `tools/prepare_assets.py`: 원본 파일을 변경하지 않고 복사·벡터 추출·표면 텍스처 생성.
- `tests/site.spec.ts`: 브라우저 기반 기능·해상도·시간 조건 검수.

## 자산과 표현 범위

원본 PDF·PNG는 수정하지 않았습니다. `public/assets/`에 별도 복사했습니다. CMF 7개 도형, 브랜드, NEWMATERIALS/FAVORITES 및 소재명은 제공 PDF의 실제 윤곽입니다. Noto Sans KR을 로컬 파일로 연결했습니다. Seramonde 웹폰트 파일이 없어, 윤곽으로 처리하지 않은 본문·작은 영문 UI는 Georgia/Times 계열 대체 글꼴입니다.

3D는 스캔이 아니라 절차적 근사입니다. 제공 사진으로 정면을 표현하고 회전 시 두께가 있는 판/폼/L형, 양면 시트, 섬유 가닥, 철 입자 모델로 전환합니다. 사진과 재구성 모델의 형상이 완전히 동일하지 않습니다. 뒷면·두께·변형·입자 운동은 실물 측정 결과가 아닙니다.

확대 PNG는 AI 개념 시각화입니다. 300%는 체험 화면의 상대 확대율이며 현미경의 물리적 배율이 아닙니다. 오디오는 합성음으로 현장 녹음이 아닙니다. +MORE는 해당 소재 계열의 관련 사례/원리 출처이며 제공 사진의 제품 제조사를 보증하지 않습니다.

최종 체크리스트와 남은 차이는 `IMPLEMENTATION_REVIEW.md`를 참조합니다.

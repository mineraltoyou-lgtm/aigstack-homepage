# AIGSTACK 홈페이지 (aigstack.kr)

온프레미스 AI 비서 플랫폼 AIGSTACK의 공개 마케팅 사이트.
정적 HTML — GitHub(소스) → Cloudflare Pages(호스팅) 연동.

## 구조
- `index.html` — 메인 랜딩
- `pages/` — logos / factory / venture / saas / 3d-cluster / 갤러리 등 공개 페이지

## 배포
GitHub push → Cloudflare Pages 자동 빌드/배포. 빌드 명령 없음(정적), 출력 디렉토리 = 루트.

## 주의
- 문의폼은 `/submit` 으로 POST → aigstack.kr 경로 라우팅(서버/Worker)에서 처리.
- 내부 운영 페이지(admin·dashboard·internal)는 의도적으로 제외(공개 금지).

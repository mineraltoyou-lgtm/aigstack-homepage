import { defineConfig } from 'vite';

// 토스 앱 안에서는 번들 파일을 상대 경로로 불러와야 한다.
export default defineConfig({
  base: './',
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Chế độ xử lý thư mục tĩnh
    publicDir: 'public',
    build: {
      rollupOptions: {
        // Loại bỏ các file trong playables khỏi trình phân tích cú pháp của Vite
        external: [
          /^\/playables\/.*\.html$/,
          '/playables/Merge.html'
        ],
      },
    },
    // Đánh dấu các file html trong thư mục này là asset thô, không parse nội dung
    assetsInclude: ['public/playables/**/*.html'],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
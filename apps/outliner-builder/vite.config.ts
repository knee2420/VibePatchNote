import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    watch: {
      // 사용자가 저장한 워크스페이스 파일은 소스가 아니다. 감시하면 저장·자동 저장 때마다
      // 페이지가 새로고침되어 메모리의 편집 내용이 초기화된다.
      ignored: ["**/src/data/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

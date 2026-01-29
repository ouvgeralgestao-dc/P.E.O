import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6002, // Porta fixa - Frontend conforme regra rules.mdc
    strictPort: true, // Impede mudança automática de porta se estiver ocupada
    proxy: {
      "/api": {
        target: "http://localhost:6001",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true, // Facilita debugging
    outDir: "dist",
    // Usa caminhos relativos para funcionar quando servido pelo backend
    // em producao (instalador)
  },
  // Base absoluta para garantir carregamento correto de assets em rotas profundas
  base: "/",
});

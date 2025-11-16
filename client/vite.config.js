import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => {
          console.log(`🔄 Proxy: ${path} -> http://localhost:3001${path}`);
          return path;
        },
        configure: (proxy, _options) => {
          proxy.on("error", (err, req, res) => {
            console.error("❌ Proxy error:", err.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Proxy error", details: err.message })
            );
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("📤 Sending to backend:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "📥 Response from backend:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
});

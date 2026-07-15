import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to serve ONNX runtime files from node_modules
function serveOrtFiles() {
  return {
    name: "serve-ort-files",
    configureServer(server) {
      server.middlewares.use("/ort", (req, res, next) => {
        const urlPath = req.url.split("?")[0];
        const filePath = path.join(
          __dirname,
          "node_modules/onnxruntime-web/dist",
          urlPath
        );

        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath);
          const contentType =
            ext === ".mjs" || ext === ".js"
              ? "application/javascript"
              : ext === ".wasm"
              ? "application/wasm"
              : "application/octet-stream";

          res.setHeader("Content-Type", contentType);
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

// Custom plugin to patch CDN URLs in piper-tts-web
function patchPiperTtsWeb() {
  return {
    name: "patch-piper-tts-web",
    transform(code, id) {
      if (id.includes("@mintplex-labs/piper-tts-web") || id.includes("piper-tts-web")) {
        return code.replace(
          /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/onnxruntime-web\/1\.18\.0\//g,
          "/ort/"
        );
      }
      return code;
    },
  };
}

export default defineConfig({
  plugins: [react(), serveOrtFiles(), patchPiperTtsWeb()],
  resolve: {
    alias: {
      "onnxruntime-web/wasm": path.resolve(
        __dirname,
        "node_modules/onnxruntime-web/dist/ort.webgpu.mjs"
      ),
    },
  },
  optimizeDeps: {
    exclude: ["@mintplex-labs/piper-tts-web"],
    include: ["onnxruntime-web"],
    esbuildOptions: {
      define: { global: "globalThis" },
    },
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    fs: {
      allow: [".."],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
})

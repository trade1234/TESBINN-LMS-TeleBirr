import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_API_URL;
  const proxyOverride = env.VITE_PROXY_TARGET;

  const resolveOrigin = (value?: string) => {
    if (!value) return undefined;
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  };

  const getProxyTarget = () => {
    return (
      resolveOrigin(proxyOverride) ||
      resolveOrigin(backendUrl) ||
      "https://tesbinn-lms-backend.vercel.app"
    );
  };

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: getProxyTarget(),
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss({
            theme: {
                extend: {
                    fontFamily: {
                        fredoka: ["Fredoka", "sans-serif"],
                        inter: ["Inter", "sans-serif"],
                    },
                    animation: {
                        "spin-slow": "spin 5s linear infinite",
                    },
                },
            },
        }),
    ],
    server: {
        proxy: {
            // Proxy API requests to avoid CORS issues
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
                secure: false,
            },
            "/health": {
                target: "http://localhost:5000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});

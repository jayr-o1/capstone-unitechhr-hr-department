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
    ]
});

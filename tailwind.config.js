/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            animation: {
                "spin-slow": "spin 5s linear infinite",
                "spin-reverse": "spin-reverse 3s linear infinite",
            },
            keyframes: {
                "spin-reverse": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(-360deg)" },
                },
            },
        },
    },
    plugins: [],
};

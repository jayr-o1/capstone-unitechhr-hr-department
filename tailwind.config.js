/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        screens: {
            'xs': '475px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
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

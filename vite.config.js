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
                rewrite: (path) => path,
                configure: (proxy, _options) => {
                    proxy.on("error", (err, _req, _res) => {
                        console.log("proxy error", err);
                    });
                    proxy.on("proxyReq", (proxyReq, req, _res) => {
                        // Log the content type for debugging
                        console.log(
                            "Request Content-Type:",
                            req.headers['content-type']
                        );
                        
                        // For multipart/form-data, don't modify the content-type header
                        if (req.headers['content-type'] && 
                            req.headers['content-type'].startsWith('multipart/form-data')) {
                            console.log("Preserving multipart/form-data Content-Type");
                            
                            // Important: For multipart requests, we should NOT touch the body or headers 
                            // as that will break the boundary definition
                        }
                        
                        console.log(
                            "Sending Request to the Target:",
                            req.method,
                            req.url
                        );
                    });
                    proxy.on("proxyRes", (proxyRes, req, _res) => {
                        console.log(
                            "Received Response from the Target:",
                            proxyRes.statusCode,
                            req.url
                        );
                    });
                },
                // Adding specific options for handling file uploads
                handleRequest: (req, res, next) => {
                    // Allow larger file uploads
                    req.maxBodyLength = 50 * 1024 * 1024; // 50MB
                    next();
                },
                // Important: Preserve the original body of the request
                selfHandleResponse: false,
                // Increase timeout for file uploads
                timeout: 60000,
            },
            "/health": {
                target: "http://localhost:5000",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,
            },
            // Proxy recommendations API requests
            "/api/recommendations": {
                target: "http://localhost:5001",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,
                configure: (proxy, _options) => {
                    proxy.on("error", (err, _req, _res) => {
                        console.log("recommendations proxy error", err);
                    });
                    proxy.on("proxyReq", (proxyReq, req, _res) => {
                        console.log(
                            "Sending Recommendations Request:",
                            req.method,
                            req.url
                        );
                    });
                    proxy.on("proxyRes", (proxyRes, req, _res) => {
                        console.log(
                            "Received Recommendations Response:",
                            proxyRes.statusCode,
                            req.url
                        );
                    });
                },
            },
        },
    },
});

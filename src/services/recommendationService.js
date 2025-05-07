/**
 * Service for handling skill recommendations API calls
 */

// Base API URL - use environment variable with fallback to localhost for development
const API_BASE_URL =
    import.meta.env.VITE_RECOMMENDATION_API_URL || "http://localhost:5001";

// API Configuration
const API_CONFIG = {
    endpoints: {
        recommendations: `${API_BASE_URL}/api/recommendations`,
    },
    timeout: 30000, // 30 second timeout
};

/**
 * Helper function to fetch with timeout
 */
const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    }
};

/**
 * Get teaching specialization recommendations based on skills
 * @param {Array} skills - Array of skill objects with name, proficiency, and isCertified
 * @returns {Promise} - Promise that resolves to recommendations
 */
export const getTeachingRecommendations = async (skills) => {
    try {
        // Validate input
        if (!skills || !Array.isArray(skills)) {
            throw new Error("Skills must be an array");
        }

        console.log("Sending skills to recommendations API:", skills);

        // Call the API with timeout
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.recommendations,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    skills: skills,
                }),
            },
            API_CONFIG.timeout
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                    `API request failed with status ${response.status}`
            );
        }

        return {
            success: true,
            recommendations: data,
        };
    } catch (error) {
        console.error("Error getting teaching recommendations:", error);
        return {
            success: false,
            message: error.message || "Failed to get recommendations",
            recommendations: null,
        };
    }
};

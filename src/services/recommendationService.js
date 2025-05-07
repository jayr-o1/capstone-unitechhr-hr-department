/**
 * Service for handling skill recommendations API calls
 */

// Base API URL - use environment variable with fallback to proxy URL for development
const API_BASE_URL = import.meta.env.VITE_RECOMMENDATION_API_URL || ""; // Empty string to use relative path with proxy

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
 * Convert string proficiency level to numeric value
 * @param {string|number} proficiency - Proficiency level as string or number
 * @returns {number} - Numeric proficiency value (0-100)
 */
const convertProficiencyToNumber = (proficiency) => {
    // If already a number, return it (ensuring it's within 0-100 range)
    if (typeof proficiency === "number") {
        return Math.min(Math.max(proficiency, 0), 100);
    }

    // If it's a string that's a number (e.g. "75"), parse it
    if (!isNaN(parseInt(proficiency))) {
        return Math.min(Math.max(parseInt(proficiency), 0), 100);
    }

    // Convert text proficiency levels to numbers
    switch (proficiency?.toLowerCase?.()) {
        case "expert":
            return 90;
        case "advanced":
            return 75;
        case "intermediate":
            return 50;
        case "basic":
        case "beginner":
            return 30;
        case "novice":
            return 15;
        default:
            return 50; // Default to intermediate if unknown
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

        // Format skills keeping the string proficiency values
        const formattedSkills = skills.map((skill) => ({
            name: skill.name,
            proficiency: skill.proficiency, // Keep as string
            isCertified: Boolean(skill.isCertified),
        }));

        console.log("Sending skills to recommendations API:", formattedSkills);

        // Call the API with timeout
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.recommendations,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    skills: formattedSkills,
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

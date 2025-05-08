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
    timeout: 120000, // Increased from 30sec to 120sec (2min) timeout for slower networks
};

// Sample mock data for when the API is unavailable
const MOCK_RECOMMENDATIONS = {
    subject_areas: [
        {
            name: "Computer Science",
            match_score: 92,
            required_skills: ["Programming", "Algorithms", "Data Structures"],
            matching_skills: ["JavaScript", "Python", "SQL", "React"],
            courses: [
                "Introduction to Programming",
                "Web Development Fundamentals",
                "Data Structures and Algorithms"
            ]
        },
        {
            name: "Information Technology",
            match_score: 88,
            required_skills: ["Networking", "System Administration", "Security"],
            matching_skills: ["Cybersecurity", "Operating Systems", "SQL"],
            courses: [
                "IT Fundamentals",
                "Network Security",
                "Database Management"
            ]
        },
        {
            name: "Data Science",
            match_score: 78,
            required_skills: ["Statistics", "Machine Learning", "Programming"],
            matching_skills: ["Python", "SQL", "Data Analysis"],
            courses: [
                "Introduction to Data Science",
                "Statistical Methods",
                "Data Visualization"
            ]
        }
    ]
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
 * Helper function to check if an API endpoint is available
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} - Promise that resolves to true if API is available
 */
const isApiAvailable = async (url) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Short 5s timeout for check
        
        const response = await fetch(url, {
            method: "OPTIONS",
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.log("API availability check failed:", error.message);
        return false;
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
        
        // First check if API is available
        const apiEndpoint = API_CONFIG.endpoints.recommendations;
        const apiAvailable = await isApiAvailable(apiEndpoint);
        
        if (!apiAvailable) {
            console.warn("Recommendations API is not available, using mock data");
            // Return mock data instead of making the call that will fail
            return {
                success: true,
                message: "Using mock recommendations due to API unavailability",
                recommendations: MOCK_RECOMMENDATIONS,
                isMock: true
            };
        }

        // API is available, proceed with real call
        const response = await fetchWithTimeout(
            apiEndpoint,
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
        
        // If API call fails for any reason, return mock data as fallback
        return {
            success: true, // Still return success to keep the UI working
            message: "Using mock recommendations due to API error: " + error.message,
            recommendations: MOCK_RECOMMENDATIONS,
            isMock: true,
            error: error.message
        };
    }
};

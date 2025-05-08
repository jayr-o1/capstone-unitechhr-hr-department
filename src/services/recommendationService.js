/**
 * Service for handling skill recommendations API calls
 */

// Base API URL - use environment variable with fallback to direct URL for development
const API_BASE_URL = import.meta.env.VITE_RECOMMENDATION_API_URL || "http://localhost:5001"; 

// API Configuration
const API_CONFIG = {
    endpoints: {
        // Always use the direct URL to the server rather than relying on proxy
        recommendations: `${API_BASE_URL}/api/recommendations`,
    },
    timeout: 180000, // Increased to 3 minutes for slower networks
};

/**
 * Helper function to fetch with timeout
 */
const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        console.log(`Fetching from ${url} with timeout ${timeout}ms`);
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

    console.log("Processing skills for recommendations:", formattedSkills);

    // Try direct API call with CORS enabled
    try {
        // Try multiple endpoint formats - prioritize direct URL first
        const endpoints = [
            API_CONFIG.endpoints.recommendations,             // Direct URL (from config): http://localhost:5001/api/recommendations
            "http://localhost:5001/api/recommendations",      // Explicit direct URL as fallback
            "http://localhost:5001/recommendations",          // Alternative endpoint 1
            "http://localhost:5001/api/v1/recommendations",   // Alternative endpoint 2
            "http://localhost:5001/recommend",                // Alternative endpoint 3
            "/api/recommendations"                            // Proxy URL - try this last as it's likely not configured correctly
        ];
        
        let lastError = null;
        
        // Try each endpoint
        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting API call to: ${endpoint}`);
                
                // Make the API request
                const response = await fetchWithTimeout(
                    endpoint,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        mode: "cors", // Enable CORS for cross-origin requests
                        credentials: "omit", // Don't send cookies
                        body: JSON.stringify({
                            skills: formattedSkills,
                        }),
                    },
                    API_CONFIG.timeout
                );
                
                // Check if we got a successful response
                if (response.ok) {
                    const data = await response.json();
                    console.log("API response data:", data);
                    
                    return {
                        success: true,
                        recommendations: data,
                    };
                } else {
                    // Log more details about the failed response
                    console.log(`Endpoint ${endpoint} failed with status: ${response.status} (${response.statusText})`);
                    
                    // Try to get more error details if possible
                    try {
                        const errorText = await response.text();
                        console.log(`Response error details: ${errorText}`);
                    } catch (textError) {
                        console.log(`Could not read error details: ${textError.message}`);
                    }
                    
                    lastError = new Error(`API request failed with status ${response.status}`);
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed with error:`, error);
                lastError = error;
                // Continue to the next endpoint
            }
        }
        
        console.error("All recommendation API endpoints failed");
        
        // If we got here, all endpoints failed - create basic mock data as fallback
        const mockRecommendations = {
            recommendations: [
                {
                    specialization: "Web Development Education",
                    description: "Teach web development technologies like HTML, CSS, JavaScript",
                    matching_score: 75,
                    matching_skills: ["JavaScript", "HTML", "CSS"].filter(skill => 
                        formattedSkills.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
                    ),
                    missing_skills: ["Teaching Methods", "Student Assessment", "Curriculum Design"]
                },
                {
                    specialization: "Database Education",
                    description: "Teach database concepts and SQL to college students",
                    matching_score: 65,
                    matching_skills: ["SQL", "Database Design"].filter(skill => 
                        formattedSkills.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
                    ),
                    missing_skills: ["Teaching Methods", "Database Administration", "NoSQL Databases"]
                }
            ],
            user_skills: formattedSkills,
            error: lastError ? lastError.message : "All API endpoints failed"
        };
        
        console.log("Using fallback mock recommendations");
        return {
            success: true,
            recommendations: mockRecommendations
        };
        
    } catch (error) {
        console.error("Error getting teaching recommendations:", error);
        throw new Error(`Failed to get recommendations: ${error.message}`);
    }
};

/**
 * Personalizes mock recommendations based on user skills
 * @param {Array} skills - User skills
 * @param {Object} mockData - Basic mock data
 * @returns {Object} - Personalized recommendations
 */
const personalizeRecommendations = (skills, mockData) => {
    try {
        // Deep clone the mock data
        const personalized = JSON.parse(JSON.stringify(mockData));
        
        // Find skill names to use for matching
        const skillNames = skills.map(s => s.name.toLowerCase());
        
        // Adjust scores based on matching skills
        personalized.subject_areas.forEach(area => {
            // Count how many of the user's skills match this area's skills
            let matchCount = 0;
            
            area.matching_skills.forEach(areaSkill => {
                if (skillNames.some(userSkill => 
                    userSkill.includes(areaSkill.toLowerCase()) || 
                    areaSkill.toLowerCase().includes(userSkill))) {
                    matchCount++;
                }
            });
            
            // Bonus for matches
            const matchBonus = matchCount * 2;
            area.match_score = Math.min(100, area.match_score + matchBonus);
            
            // Add skill proficiency info
            area.matching_skills = area.matching_skills.map(skill => {
                const userSkill = skills.find(s => 
                    s.name.toLowerCase().includes(skill.toLowerCase()) || 
                    skill.toLowerCase().includes(s.name.toLowerCase())
                );
                
                return userSkill ? 
                    { name: skill, proficiency: userSkill.proficiency } : 
                    { name: skill, proficiency: "Not in profile" };
            });
        });
        
        // Sort by match score
        personalized.subject_areas.sort((a, b) => b.match_score - a.match_score);
        
        return personalized;
    } catch (error) {
        console.error("Error personalizing recommendations:", error);
        return mockData; // Return original if personalization fails
    }
};

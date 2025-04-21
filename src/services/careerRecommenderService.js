import { db } from "../firebase";
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    setDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    writeBatch,
} from "firebase/firestore";

// Base API URL - use environment variable with fallback to localhost for development
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// API Configuration
const API_CONFIG = {
    endpoints: {
        recommend: `${API_BASE_URL}/recommend`, // Main recommendation endpoint
        simpleRecommend: `${API_BASE_URL}/api/recommend`, // Frontend-friendly endpoint
        outputRecommend: `${API_BASE_URL}/output_recommendation`, // Output to JSON endpoint
        health: `${API_BASE_URL}/health`, // Health check endpoint
        fields: `${API_BASE_URL}/fields`, // Get available fields
        specializations: `${API_BASE_URL}/specializations`, // Get available specializations
        matchSkill: `${API_BASE_URL}/match_skill`, // Skill matching endpoint
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
 * Check API health
 * @returns {Promise} - Promise that resolves to health status
 */
export const checkApiHealth = async () => {
    try {
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.health,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            API_CONFIG.timeout
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `API health check failed with status ${response.status}`
            );
        }

        return {
            success: true,
            status: data,
        };
    } catch (error) {
        console.error("Error checking API health:", error);
        return {
            success: false,
            message: error.message || "Failed to check API health",
            status: null,
        };
    }
};

/**
 * Get all available career fields
 * @returns {Promise} - Promise that resolves to list of fields
 */
export const getCareerFields = async () => {
    try {
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.fields,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            API_CONFIG.timeout
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `Failed to get fields with status ${response.status}`
            );
        }

        return {
            success: true,
            fields: data,
        };
    } catch (error) {
        console.error("Error getting career fields:", error);
        return {
            success: false,
            message: error.message || "Failed to get career fields",
            fields: null,
        };
    }
};

/**
 * Get all available specializations
 * @returns {Promise} - Promise that resolves to list of specializations
 */
export const getCareerSpecializations = async () => {
    try {
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.specializations,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
            API_CONFIG.timeout
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `Failed to get specializations with status ${response.status}`
            );
        }

        return {
            success: true,
            specializations: data,
        };
    } catch (error) {
        console.error("Error getting career specializations:", error);
        return {
            success: false,
            message: error.message || "Failed to get career specializations",
            specializations: null,
        };
    }
};

/**
 * Match a user skill against a standard skill
 * @param {string} userSkill - The user's skill name
 * @param {string} standardSkill - The standard skill to match against
 * @param {boolean} useSemantic - Whether to use semantic matching (default: true)
 * @returns {Promise} - Promise that resolves to match result
 */
export const matchSkill = async (
    userSkill,
    standardSkill,
    useSemantic = true
) => {
    try {
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.matchSkill,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_skill: userSkill,
                    standard_skill: standardSkill,
                    use_semantic: useSemantic,
                }),
            },
            API_CONFIG.timeout
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                    `Skill matching failed with status ${response.status}`
            );
        }

        return {
            success: true,
            result: data,
        };
    } catch (error) {
        console.error("Error matching skills:", error);
        return {
            success: false,
            message: error.message || "Failed to match skills",
            result: null,
        };
    }
};

/**
 * Get career recommendations with proficiency levels (simplified API for frontend)
 * @param {Array} skills - Array of skill objects with name and proficiency
 * @param {Object} options - Optional parameters for the recommendation
 * @returns {Promise} - Promise that resolves to recommendations
 *
 * Note: This function does NOT save recommendations to a file by default.
 * If you need to save to a file, use getCareerRecommendationsWithJsonOutput instead.
 */
export const getCareerRecommendations = async (skills, options = {}) => {
    try {
        // Validate input
        if (!skills || !Array.isArray(skills)) {
            throw new Error("Skills must be an array");
        }

        // Format skills as {skillName: proficiency} dictionary
        const skillsDict = {};
        skills.forEach((skill) => {
            if (!skill.name) {
                throw new Error("Each skill must have a name");
            }
            // Convert proficiency to number and ensure it's within 1-100 range
            const proficiency = Math.min(
                Math.max(parseInt(skill.proficiency) || 50, 1),
                100
            );
            skillsDict[skill.name] = proficiency;
        });

        console.log("Sending skills to frontend-friendly API:", skillsDict);

        // Call the API with timeout
        const response = await fetchWithTimeout(
            API_CONFIG.endpoints.simpleRecommend,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    skills: skillsDict,
                    currentField: options.currentField || null,
                    currentSpecialization:
                        options.currentSpecialization || null,
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

        // Process the response to ensure it follows expected format
        const processedData = {
            success: true,
            recommendations: data.recommendations || data,
        };

        // Check for the new specialization_cards format
        if (
            processedData.recommendations &&
            processedData.recommendations.specialization_cards &&
            Array.isArray(processedData.recommendations.specialization_cards)
        ) {
            // We have the new format, use it directly
            console.log("Using new specialization cards format");
            return processedData;
        }

        // Handle legacy formats - check for fields and specializations
        if (
            processedData.recommendations &&
            !processedData.recommendations.fields &&
            data.recommendations
        ) {
            // Map to new format if using old format
            if (data.recommendations.top_fields) {
                processedData.recommendations.fields =
                    data.recommendations.top_fields.map((field) => ({
                        ...field,
                        confidence:
                            field.match_percentage || field.confidence || 0,
                    }));
            }

            if (
                data.recommendations.top_specializations ||
                data.recommendations.specializations
            ) {
                const specs =
                    data.recommendations.top_specializations ||
                    data.recommendations.specializations ||
                    [];
                processedData.recommendations.specializations = specs.map(
                    (spec) => ({
                        ...spec,
                        confidence:
                            spec.match_percentage || spec.confidence || 0,
                        matched_skills:
                            spec.matching_skills || spec.matched_skills || [],
                        missing_skills: spec.missing_skills || [],
                    })
                );
            }

            // Convert the old format to the new specialization cards format
            if (
                processedData.recommendations.specializations &&
                Array.isArray(processedData.recommendations.specializations) &&
                processedData.recommendations.specializations.length > 0
            ) {
                // Create the specialization cards array
                const specCards =
                    processedData.recommendations.specializations.map(
                        (spec) => {
                            return {
                                title:
                                    spec.specialization ||
                                    "Unknown Specialization",
                                field: spec.field || "General",
                                confidence:
                                    spec.confidence ||
                                    spec.match_percentage ||
                                    0,
                                matching_skills: (
                                    spec.matched_skills ||
                                    spec.matching_skills ||
                                    []
                                ).map((skill) => {
                                    if (typeof skill === "string") {
                                        return {
                                            name: skill,
                                            proficiency: 0,
                                            match_score: 0,
                                        };
                                    } else {
                                        return {
                                            name:
                                                skill.skill || skill.name || "",
                                            user_skill:
                                                skill.user_skill ||
                                                skill.name ||
                                                "",
                                            proficiency: skill.proficiency || 0,
                                            match_score: skill.match_score || 0,
                                        };
                                    }
                                }),
                                missing_skills: (spec.missing_skills || []).map(
                                    (skill) => {
                                        if (typeof skill === "string") {
                                            return {
                                                name: skill,
                                                priority: 50,
                                            };
                                        } else {
                                            return {
                                                name:
                                                    skill.skill ||
                                                    skill.name ||
                                                    "",
                                                priority: skill.priority || 50,
                                            };
                                        }
                                    }
                                ),
                            };
                        }
                    );

                // Add the specialization cards to the response
                processedData.recommendations.specialization_cards = specCards;
            }
        }

        return processedData;
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return {
            success: false,
            message: error.message || "Failed to get recommendations",
            recommendations: null,
        };
    }
};

/**
 * Get detailed career recommendations with advanced options
 * @param {Array} skills - Array of skill objects with name and proficiency
 * @param {Object} options - Optional parameters for the recommendation
 * @param {boolean} options.saveToFile - Whether to save recommendations to a file
 * @param {number} options.topFields - Number of top fields to return
 * @param {number} options.topSpecializations - Number of top specializations to return
 * @param {number} options.fuzzyThreshold - Threshold for fuzzy matching
 * @param {boolean} options.simplifiedResponse - Whether to simplify the response
 * @param {boolean} options.useSemantic - Whether to use semantic matching
 * @returns {Promise} - Promise that resolves to detailed recommendations
 */
export const getDetailedCareerRecommendations = async (
    skills,
    options = {}
) => {
    try {
        // Validate input
        if (!skills || !Array.isArray(skills)) {
            throw new Error("Skills must be an array");
        }

        // Format skills as {skillName: proficiency} dictionary
        const skillsDict = {};
        skills.forEach((skill) => {
            if (!skill.name) {
                throw new Error("Each skill must have a name");
            }
            // Convert proficiency to number and ensure it's within 1-100 range
            const proficiency = Math.min(
                Math.max(parseInt(skill.proficiency) || 50, 1),
                100
            );
            skillsDict[skill.name] = proficiency;
        });

        console.log("Sending skills dictionary to detailed API:", skillsDict);

        // Choose appropriate endpoint based on options
        const endpoint =
            options.saveToFile === true
                ? API_CONFIG.endpoints.outputRecommend
                : API_CONFIG.endpoints.recommend;

        // Call the API with timeout
        const response = await fetchWithTimeout(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    skills: skillsDict,
                    top_fields: options.topFields || 3,
                    top_specializations: options.topSpecializations || 3,
                    fuzzy_threshold: options.fuzzyThreshold || 80,
                    simplified_response: options.simplifiedResponse || false,
                    use_semantic:
                        options.useSemantic !== undefined
                            ? options.useSemantic
                            : true,
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

        // Ensure the data structure is consistent
        const processedData = {
            success: true,
            recommendations: data,
            // If output to file was used, include the filename
            outputFile: data.output_file || null,
        };

        // Return the detailed recommendations
        return processedData;
    } catch (error) {
        console.error("Error getting detailed recommendations:", error);
        return {
            success: false,
            message: error.message || "Failed to get detailed recommendations",
            recommendations: null,
        };
    }
};

/**
 * Get career recommendations and save to JSON file.
 * This function explicitly saves the results to a JSON file on the server.
 * @param {Array} skills - Array of skill objects with name and proficiency
 * @param {Object} options - Optional parameters for the recommendation
 * @returns {Promise} - Promise that resolves to recommendations and filename
 */
export const getCareerRecommendationsWithJsonOutput = async (
    skills,
    options = {}
) => {
    try {
        // Force the saveToFile option to true to ensure output is saved to a file
        const result = await getDetailedCareerRecommendations(skills, {
            ...options,
            saveToFile: true,
        });

        console.log("Recommendation saved to file:", result.outputFile);
        return result;
    } catch (error) {
        console.error("Error getting recommendations with JSON output:", error);
        return {
            success: false,
            message:
                error.message ||
                "Failed to get recommendations with JSON output",
            recommendations: null,
            outputFile: null,
        };
    }
};

/**
 * Save career recommendation to Firestore
 */
export const saveCareerRecommendation = async (
    userId,
    universityId,
    recommendationData
) => {
    try {
        // Validate input
        if (!userId || !universityId || !recommendationData) {
            throw new Error("Missing required parameters");
        }

        // Get employee document reference
        const { employeeRef, employeeDocId } = await getEmployeeReference(
            userId,
            universityId
        );

        // Create recommendation object
        const recommendationId = `rec_${Date.now()}`;
        const recommendationObj = {
            id: recommendationId,
            timestamp: serverTimestamp(),
            ...recommendationData,
            status: "active",
            employeeId: userId.startsWith("emp_")
                ? userId.split("_")[1]
                : userId,
            createdBy: userId,
            createdAt: serverTimestamp(),
        };

        // Create a batch write for atomic operation
        const batch = writeBatch(db);

        // Reference to recommendation document
        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId,
            "careerRecommendations",
            recommendationId
        );

        // Add operations to batch
        batch.set(recommendationRef, recommendationObj);
        batch.update(employeeRef, {
            latestRecommendationId: recommendationId,
            lastRecommendationDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Commit the batch
        await batch.commit();

        return {
            success: true,
            recommendationId,
        };
    } catch (error) {
        console.error("Error saving recommendation:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Helper function to get employee reference
 */
const getEmployeeReference = async (userId, universityId) => {
    let employeeDocId = userId;

    if (userId.startsWith("emp_")) {
        const employeeId = userId.split("_")[1];
        const employeesRef = collection(
            db,
            "universities",
            universityId,
            "employees"
        );
        const q = query(employeesRef, where("employeeId", "==", employeeId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Employee record not found");
        }
        employeeDocId = querySnapshot.docs[0].id;
    }

    const employeeRef = doc(
        db,
        "universities",
        universityId,
        "employees",
        employeeDocId
    );

    return { employeeRef, employeeDocId };
};

/**
 * Get latest career recommendation
 */
export const getLatestCareerRecommendation = async (userId, universityId) => {
    try {
        const { employeeRef } = await getEmployeeReference(
            userId,
            universityId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            throw new Error("Employee not found");
        }

        const { latestRecommendationId } = employeeDoc.data();

        if (!latestRecommendationId) {
            return {
                success: false,
                message: "No recommendations found",
                recommendation: null,
            };
        }

        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDoc.id,
            "careerRecommendations",
            latestRecommendationId
        );

        const recommendationDoc = await getDoc(recommendationRef);

        if (!recommendationDoc.exists()) {
            throw new Error("Recommendation not found");
        }

        return {
            success: true,
            recommendation: recommendationDoc.data(),
        };
    } catch (error) {
        console.error("Error getting recommendation:", error);
        return {
            success: false,
            message: error.message,
            recommendation: null,
        };
    }
};

/**
 * Delete latest career recommendation
 */
export const deleteLatestCareerRecommendation = async (
    userId,
    universityId
) => {
    try {
        const { employeeRef } = await getEmployeeReference(
            userId,
            universityId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            throw new Error("Employee not found");
        }

        const { latestRecommendationId } = employeeDoc.data();

        if (!latestRecommendationId) {
            return {
                success: false,
                message: "No recommendations to delete",
            };
        }

        // Create a batch write for atomic operation
        const batch = writeBatch(db);

        // Delete recommendation
        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDoc.id,
            "careerRecommendations",
            latestRecommendationId
        );

        batch.delete(recommendationRef);
        batch.update(employeeRef, {
            latestRecommendationId: null,
            lastRecommendationDate: null,
            updatedAt: serverTimestamp(),
        });

        await batch.commit();

        return {
            success: true,
            message: "Recommendation deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting recommendation:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Reset all recommendations, clearing any cached data
 * @returns {Promise} - Promise that resolves when reset is complete
 */
export const resetRecommendations = async () => {
    try {
        console.log("Resetting all recommendation data...");

        // Find any saved recommendation files
        const timestampPattern = /career_recommendation_\d{8}_\d{6}\.json/;
        const recommendationFiles = [];

        // Try to list files in the current directory
        try {
            const fs = window.require("fs");
            const files = await fs.promises.readdir("./");

            // Filter for recommendation files
            files.forEach((file) => {
                if (timestampPattern.test(file)) {
                    recommendationFiles.push(file);
                }
            });

            // Delete any found recommendation files
            for (const file of recommendationFiles) {
                try {
                    await fs.promises.unlink(file);
                    console.log(`Deleted recommendation file: ${file}`);
                } catch (err) {
                    console.error(`Error deleting file ${file}:`, err);
                }
            }
        } catch (err) {
            // File system access might not be available in browser
            console.log(
                "Could not access file system to delete recommendation files"
            );
        }

        // Clear browser local storage if available
        try {
            localStorage.removeItem("lastRecommendation");
            localStorage.removeItem("recommendationTimestamp");
            localStorage.removeItem("careerRecommendation");
            console.log("Cleared recommendation data from local storage");
        } catch (err) {
            console.log("Could not clear local storage:", err);
        }

        return {
            success: true,
            message: "Recommendation data reset complete",
        };
    } catch (error) {
        console.error("Error resetting recommendations:", error);
        return {
            success: false,
            message: error.message || "Failed to reset recommendations",
        };
    }
};

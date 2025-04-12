import { db } from "../firebase";
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    setDoc,
    query,
    where,
    getDocs,
    deleteDoc,
} from "firebase/firestore";

/**
 * Get career recommendations based on employee skills
 * @param {Array} skills - Array of employee skill objects
 * @param {string} currentField - Current field (optional)
 * @param {string} currentSpecialization - Current specialization (optional)
 * @returns {Promise} - Promise that resolves to recommendations
 */
export const getCareerRecommendations = async (
    skills,
    currentField = null,
    currentSpecialization = null
) => {
    try {
        // Prepare skills data for the recommender
        const formattedSkills = skills.map((skill) => skill.name);

        // Call the Python API
        try {
            const response = await fetch(
                "http://localhost:5000/api/recommend",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        skills: formattedSkills,
                        currentField,
                        currentSpecialization,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                console.log(
                    "Received API recommendations:",
                    data.recommendations
                );
                return { success: true, recommendations: data.recommendations };
            } else {
                console.error("API error:", data.message);
                // Fall back to simulated data if the API fails
                return await simulateRecommendations(
                    formattedSkills,
                    currentField,
                    currentSpecialization
                );
            }
        } catch (apiError) {
            console.error("API connection error:", apiError);
            console.log("Falling back to simulated recommendations");

            // Fall back to simulated data if the API is not available
            return await simulateRecommendations(
                formattedSkills,
                currentField,
                currentSpecialization
            );
        }
    } catch (error) {
        console.error("Error getting career recommendations:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

// Simulate recommendations (as a fallback function)
const simulateRecommendations = async (
    formattedSkills,
    currentField,
    currentSpecialization
) => {
    try {
        // This is a simple fallback that creates generic recommendations
        // without relying on hardcoded skill lists

        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Create a base recommendation object
        const recommendations = {
            top_fields: [],
            top_specializations: [],
            explanation: {
                summary:
                    "Based on your skill profile, we've identified potential career paths.",
                details:
                    "Note: This is using fallback recommendation logic since the main recommendation engine is unavailable.",
                skill_analysis: {
                    key_strengths: formattedSkills.slice(0, 3).map((skill) => ({
                        skill,
                        relevance: "high",
                    })),
                    development_areas: [],
                },
            },
        };

        // Generate some generic field recommendations
        const genericFields = [
            {
                field: "Technology",
                match_percentage: 85,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(3, formattedSkills.length)
                ),
                missing_skills: [
                    "Cloud Architecture",
                    "API Design",
                    "System Design",
                ],
            },
            {
                field: "Business",
                match_percentage: 78,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(2, formattedSkills.length)
                ),
                missing_skills: [
                    "Strategic Planning",
                    "Business Intelligence",
                    "Resource Management",
                ],
            },
            {
                field: "Design",
                match_percentage: 72,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(2, formattedSkills.length)
                ),
                missing_skills: [
                    "User Research",
                    "Information Architecture",
                    "Interaction Design",
                ],
            },
        ];

        // Generate some generic specialization recommendations
        const genericSpecializations = [
            {
                specialization: "Software Development",
                match_percentage: 88,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(3, formattedSkills.length)
                ),
                missing_skills: ["TypeScript", "System Architecture", "DevOps"],
            },
            {
                specialization: "Data Science",
                match_percentage: 80,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(2, formattedSkills.length)
                ),
                missing_skills: [
                    "Machine Learning",
                    "Statistical Analysis",
                    "Data Visualization",
                ],
            },
            {
                specialization: "Project Management",
                match_percentage: 75,
                matching_skills: formattedSkills.slice(
                    0,
                    Math.min(2, formattedSkills.length)
                ),
                missing_skills: [
                    "Risk Management",
                    "Agile Methodologies",
                    "Team Leadership",
                ],
            },
        ];

        // Add fields and specializations to recommendations
        recommendations.top_fields = genericFields;
        recommendations.top_specializations = genericSpecializations;

        return { success: true, recommendations };
    } catch (error) {
        console.error("Error in simulation:", error);
        return {
            success: false,
            message: "Error generating simulated recommendations",
            recommendations: null,
        };
    }
};

/**
 * Save career recommendations for an employee
 * @param {string} userId - The user ID
 * @param {string} universityId - The university ID
 * @param {Object} recommendationData - The recommendation data to save
 * @returns {Promise} - Promise that resolves when the recommendation is saved
 */
export const saveCareerRecommendation = async (
    userId,
    universityId,
    recommendationData
) => {
    try {
        if (!userId || !universityId) {
            return { success: false, message: "Missing required parameters" };
        }

        // Check if this is a mock user ID from direct employee login
        let employeeId = userId;
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            // Handle employee ID extraction similar to other services
            const parts = userId.split("_");
            if (parts.length >= 2) {
                employeeId = parts[1];

                // Find the actual document ID by querying based on employeeId
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // Create the recommendation object with timestamp
        const recommendationObj = {
            id: Date.now().toString(),
            timestamp: serverTimestamp(),
            recommendationData,
            status: "active",
            employeeId: employeeId,
            createdBy: userId,
            createdAt: serverTimestamp(),
        };

        // Save to the employee's career recommendations subcollection
        // First ensure the subcollection exists by checking
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );

        // Create the subcollection reference
        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId,
            "careerRecommendations",
            recommendationObj.id
        );

        // Save the recommendation to the subcollection
        await setDoc(recommendationRef, recommendationObj);

        // Also update the employee document with the latest recommendation ID and timestamp
        await updateDoc(employeeRef, {
            latestRecommendationId: recommendationObj.id,
            lastRecommendationDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(
            "Successfully saved career recommendation:",
            recommendationObj.id
        );

        return {
            success: true,
            recommendationId: recommendationObj.id,
        };
    } catch (error) {
        console.error("Error saving career recommendation:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Get the latest career recommendation for an employee
 * @param {string} userId - The user ID
 * @param {string} universityId - The university ID
 * @returns {Promise} - Promise that resolves to the latest recommendation
 */
export const getLatestCareerRecommendation = async (userId, universityId) => {
    try {
        if (!userId || !universityId) {
            return {
                success: false,
                message: "Missing required parameters",
                recommendation: null,
            };
        }

        // Logic to get employee doc ID based on userId (similar to other functions)
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            const parts = userId.split("_");
            if (parts.length >= 2) {
                const employeeId = parts[1];

                // Find the document ID
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                        recommendation: null,
                    };
                }
            }
        }

        // Get the employee document to find the latest recommendation ID
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            return {
                success: false,
                message: "Employee not found",
                recommendation: null,
            };
        }

        const employeeData = employeeDoc.data();
        const latestRecommendationId = employeeData.latestRecommendationId;

        if (!latestRecommendationId) {
            return {
                success: false,
                message: "No recommendations found",
                recommendation: null,
            };
        }

        // Get the recommendation document
        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId,
            "careerRecommendations",
            latestRecommendationId
        );

        const recommendationDoc = await getDoc(recommendationRef);

        if (!recommendationDoc.exists()) {
            return {
                success: false,
                message: "Recommendation not found",
                recommendation: null,
            };
        }

        return {
            success: true,
            recommendation: recommendationDoc.data(),
        };
    } catch (error) {
        console.error("Error getting career recommendation:", error);
        return {
            success: false,
            message: error.message,
            recommendation: null,
        };
    }
};

/**
 * Delete the latest career recommendation for an employee
 * @param {string} userId - The user ID
 * @param {string} universityId - The university ID
 * @returns {Promise} - Promise that resolves when the recommendation is deleted
 */
export const deleteLatestCareerRecommendation = async (
    userId,
    universityId
) => {
    try {
        if (!userId || !universityId) {
            return {
                success: false,
                message: "Missing required parameters",
            };
        }

        // Logic to get employee doc ID based on userId (similar to other functions)
        let employeeDocId = userId;

        if (userId.startsWith("emp_")) {
            const parts = userId.split("_");
            if (parts.length >= 2) {
                const employeeId = parts[1];

                // Find the document ID
                const employeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const q = query(
                    employeesRef,
                    where("employeeId", "==", employeeId)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    employeeDocId = querySnapshot.docs[0].id;
                } else {
                    return {
                        success: false,
                        message: "Employee record not found",
                    };
                }
            }
        }

        // Get the employee document to find the latest recommendation ID
        const employeeRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId
        );
        const employeeDoc = await getDoc(employeeRef);

        if (!employeeDoc.exists()) {
            return {
                success: false,
                message: "Employee not found",
            };
        }

        const employeeData = employeeDoc.data();
        const latestRecommendationId = employeeData.latestRecommendationId;

        if (!latestRecommendationId) {
            return {
                success: false,
                message: "No recommendations found",
            };
        }

        // Delete the recommendation document
        const recommendationRef = doc(
            db,
            "universities",
            universityId,
            "employees",
            employeeDocId,
            "careerRecommendations",
            latestRecommendationId
        );

        await deleteDoc(recommendationRef);

        // Update employee document to remove the latest recommendation reference
        await updateDoc(employeeRef, {
            latestRecommendationId: null,
            lastRecommendationDate: null,
            updatedAt: serverTimestamp(),
        });

        console.log(
            "Successfully deleted career recommendation:",
            latestRecommendationId
        );

        return {
            success: true,
            message: "Recommendation deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting career recommendation:", error);
        return {
            success: false,
            message: error.message,
        };
    }
};

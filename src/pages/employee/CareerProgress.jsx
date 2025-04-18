import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import {
    getEmployeeSkills,
    getCareerPaths,
    getEmployeeData,
    updateEmployeeProfile,
} from "../../services/employeeService";
import {
    getCareerRecommendations,
    getDetailedCareerRecommendations,
    checkApiHealth,
    saveCareerRecommendation,
    getLatestCareerRecommendation,
    resetRecommendations,
    deleteLatestCareerRecommendation,
} from "../../services/careerRecommenderService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartLine,
    faGraduationCap,
    faAward,
    faCheckCircle,
    faChevronRight,
    faStar,
    faStarHalfAlt,
    faCertificate,
    faArrowRight,
    faLightbulb,
    faBriefcase,
    faTrophy,
    faRobot,
    faSpinner,
    faRefresh,
    faBolt,
} from "@fortawesome/free-solid-svg-icons";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";
import { toast } from "react-hot-toast";

const CareerProgress = () => {
    const { user, userDetails } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employeeData, setEmployeeData] = useState(null);
    const [skills, setSkills] = useState([]);
    const [careerPaths, setCareerPaths] = useState([]);
    const [selectedCareerPath, setSelectedCareerPath] = useState(null);
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingRecommendation, setGeneratingRecommendation] =
        useState(false);
    const [recommendationError, setRecommendationError] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [displayResults, setDisplayResults] = useState(false);
    const [recommendationStatus, setRecommendationStatus] = useState(null);

    // Refs for scrolling
    const careerPathDetailsRef = useRef(null);

    // Check for section and careerPathId in URL query parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sectionParam = params.get("section");
        const careerPathParam = params.get("careerPathId");

        if (
            sectionParam &&
            ["overview", "career-path", "skills-gap"].includes(sectionParam)
        ) {
            setActiveSection(sectionParam);
        }

        // Set selected career path from URL if it exists and we have loaded career paths
        if (careerPathParam && careerPaths.length > 0) {
            const pathFromParam = careerPaths.find(
                (path) => path.id === careerPathParam
            );
            if (pathFromParam) {
                setSelectedCareerPath(pathFromParam);
            }
        }
    }, [location.search, careerPaths]);

    // Update URL when section or career path changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        if (activeSection) {
            params.set("section", activeSection);
        }

        if (selectedCareerPath?.id) {
            params.set("careerPathId", selectedCareerPath.id);
        }

        navigate(`${location.pathname}?${params.toString()}`, {
            replace: true,
        });
    }, [activeSection, selectedCareerPath, location.pathname, navigate]);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (userDetails && userDetails.universityId) {
                    setLoading(true);

                    // Fetch employee data
                    const empData = await getEmployeeData(
                        user.uid,
                        userDetails.universityId
                    );
                    if (empData.success) {
                        setEmployeeData(empData.data);

                        // Fetch employee skills
                        const skillsData = await getEmployeeSkills(
                            user.uid,
                            userDetails.universityId
                        );
                        if (skillsData.success) {
                            setSkills(skillsData.skills);
                        }

                        // Fetch career paths
                        if (empData.data.department) {
                            const careerPathsData = await getCareerPaths(
                                userDetails.universityId,
                                empData.data.department
                            );
                            if (careerPathsData.success) {
                                setCareerPaths(careerPathsData.careerPaths);

                                // Check URL for career path selection
                                const params = new URLSearchParams(
                                    location.search
                                );
                                const careerPathParam =
                                    params.get("careerPathId");

                                if (careerPathParam) {
                                    const pathFromParam =
                                        careerPathsData.careerPaths.find(
                                            (path) =>
                                                path.id === careerPathParam
                                        );
                                    if (pathFromParam) {
                                        setSelectedCareerPath(pathFromParam);
                                    } else if (
                                        careerPathsData.careerPaths.length > 0
                                    ) {
                                        // Fall back to first career path if ID not found
                                        setSelectedCareerPath(
                                            careerPathsData.careerPaths[0]
                                        );
                                    }
                                } else if (
                                    careerPathsData.careerPaths.length > 0
                                ) {
                                    // No URL param, select first career path
                                    setSelectedCareerPath(
                                        careerPathsData.careerPaths[0]
                                    );
                                }
                            }
                        }
                    } else {
                        setError("Failed to load employee data");
                    }

                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading career data:", err);
                setError("An error occurred while loading data");
                setLoading(false);
            }
        };

        loadData();
    }, [user, userDetails, location.search]);

    // Scroll to career details if redirect from dashboard
    useEffect(() => {
        // Check both location state and URL params for section indication
        const params = new URLSearchParams(location.search);
        const sectionParam = params.get("section");

        const shouldScrollToCareerPath =
            (location.state?.fromDashboard && careerPathDetailsRef.current) ||
            (sectionParam === "career-path" && careerPathDetailsRef.current);

        if (shouldScrollToCareerPath) {
            setTimeout(() => {
                careerPathDetailsRef.current.scrollIntoView({
                    behavior: "smooth",
                });
                setActiveSection("career-path");
            }, 300);
        }
    }, [location.state, location.search, selectedCareerPath]);

    // Utility functions for skills and career paths
    const getSkillLevel = (proficiency) => {
        if (proficiency >= 90) return "Expert";
        if (proficiency >= 70) return "Advanced";
        if (proficiency >= 50) return "Intermediate";
        if (proficiency >= 30) return "Basic";
        return "Novice";
    };

    const getMissingSkills = () => {
        if (
            !selectedCareerPath ||
            !selectedCareerPath.requiredSkills ||
            !skills.length
        ) {
            return [];
        }

        const employeeSkillsMap = new Map();
        skills.forEach((skill) => {
            employeeSkillsMap.set(
                skill.name.toLowerCase(),
                skill.proficiency || 0
            );
        });

        return selectedCareerPath.requiredSkills.filter((requiredSkill) => {
            const employeeSkillLevel =
                employeeSkillsMap.get(requiredSkill.name.toLowerCase()) || 0;
            return employeeSkillLevel < requiredSkill.minimumProficiency;
        });
    };

    const getSkillProgressPercentage = () => {
        if (
            !selectedCareerPath ||
            !selectedCareerPath.requiredSkills ||
            !selectedCareerPath.requiredSkills.length
        ) {
            return 0;
        }

        const missingSkills = getMissingSkills();
        const totalSkills = selectedCareerPath.requiredSkills.length;
        const acquiredSkills = totalSkills - missingSkills.length;

        return Math.round((acquiredSkills / totalSkills) * 100);
    };

    // Navigation and UI interaction handlers
    const handleViewAllSkills = () => {
        navigate("/employee/profile", {
            state: { activeTab: "skills" },
            search: new URLSearchParams({ tab: "skills" }).toString(),
        });
    };

    const handleChangeSection = (section) => {
        setActiveSection(section);

        // Update URL
        const params = new URLSearchParams(location.search);
        params.set("section", section);
        navigate(`${location.pathname}?${params.toString()}`, {
            replace: true,
        });
    };

    const handleSelectCareerPath = (careerPath) => {
        setSelectedCareerPath(careerPath);

        // Update URL
        const params = new URLSearchParams(location.search);
        params.set("careerPathId", careerPath.id);
        navigate(`${location.pathname}?${params.toString()}`, {
            replace: true,
        });
    };

    const handleGenerateRecommendation = async () => {
        if (skills.length === 0) {
            setRecommendationError(
                "You need to add skills before generating recommendations"
            );
            return;
        }

        try {
            setGeneratingRecommendation(true);
            setRecommendationError(null);
            setDisplayResults(false);
            setRecommendationStatus("initiating");

            // Check the API health first
            const healthCheck = await checkApiHealth();
            if (!healthCheck.success) {
                throw new Error(
                    "Career recommendation service is currently unavailable. Please try again later."
                );
            }

            // Format skills for the API
            const skillsToSend = skills.map((skill) => ({
                name: skill.name,
                proficiency:
                    typeof skill.proficiency === "number"
                        ? skill.proficiency
                        : parseInt(skill.proficiency) || 50,
            }));

            // Call the simplified recommendation API to start the process
            console.log("Triggering career recommendation process...");
            const matchingResult = await getCareerRecommendations(
                skillsToSend,
                {
                    currentField:
                        employeeData?.field || employeeData?.department || null,
                    currentSpecialization:
                        employeeData?.position ||
                        employeeData?.specialization ||
                        null,
                    timeout: 30000, // Increased timeout for better chance of completion
                }
            );

            if (!matchingResult.success) {
                throw new Error(
                    matchingResult.message ||
                        "Failed to initiate recommendation process"
                );
            }

            // If we got quick results back already, display them
            if (matchingResult.recommendations) {
                console.log(
                    "Received immediate recommendations:",
                    matchingResult.recommendations
                );

                // Process the recommendations to make sure they have the expected format
                const processedRecommendations = processRecommendations(
                    matchingResult.recommendations
                );

                setRecommendations(processedRecommendations);
                setDisplayResults(true);
                setRecommendationStatus("completed");

                // Save the recommendation to the database if userId and universityId are available
                if (user?.uid && userDetails?.universityId) {
                    try {
                        await saveCareerRecommendation(
                            user.uid,
                            userDetails.universityId,
                            processedRecommendations
                        );
                    } catch (saveError) {
                        console.error(
                            "Error saving recommendation:",
                            saveError
                        );
                    }
                }
            } else {
                // Update status to processing if no immediate results
                setRecommendationStatus("processing");
            }

            setGeneratingRecommendation(false);
        } catch (error) {
            console.error("Error generating recommendations:", error);
            setRecommendationError(
                error.message ||
                    "An error occurred while generating recommendations. Please try again or contact support if the issue persists."
            );
            setRecommendationStatus(null);
            setGeneratingRecommendation(false);
        }
    };

    const fetchGeneratedRecommendations = async () => {
        try {
            setGeneratingRecommendation(true);
            setRecommendationError(null);
            setRecommendationStatus("retrieving");

            // First check if we have a saved recommendation
            if (user?.uid && userDetails?.universityId) {
                const savedRecommendation = await getLatestCareerRecommendation(
                    user.uid,
                    userDetails.universityId
                );

                if (
                    savedRecommendation.success &&
                    savedRecommendation.recommendation
                ) {
                    console.log(
                        "Found saved recommendation:",
                        savedRecommendation.recommendation
                    );
                    setRecommendations(savedRecommendation.recommendation);
                    setDisplayResults(true);
                    setRecommendationStatus("completed");
                    setGeneratingRecommendation(false);

                    // Scroll to recommendations section
                    setTimeout(() => {
                        const recommendationsSection = document.getElementById(
                            "recommendations-section"
                        );
                        if (recommendationsSection) {
                            window.scrollTo({
                                top: recommendationsSection.offsetTop,
                                behavior: "smooth",
                            });
                        }
                    }, 100);

                    return;
                }
            }

            // No saved recommendation found, generate a new one with detailed information
            // Format skills for the API
            const skillsToSend = skills.map((skill) => ({
                name: skill.name,
                proficiency:
                    typeof skill.proficiency === "number"
                        ? skill.proficiency
                        : parseInt(skill.proficiency) || 50,
            }));

            // Use detailed recommendations for more comprehensive results
            console.log("Fetching detailed recommendations...");
            const result = await getDetailedCareerRecommendations(
                skillsToSend,
                {
                    currentField:
                        employeeData?.field || employeeData?.department || null,
                    currentSpecialization:
                        employeeData?.position ||
                        employeeData?.specialization ||
                        null,
                    includeAllDetails: true,
                    timeout: 30000,
                }
            );

            console.log("Detailed recommendation API response:", result);

            if (result.success && result.recommendations) {
                console.log(
                    "Career recommendation results:",
                    result.recommendations
                );

                // Process the recommendations to make sure they have the expected format
                const processedRecommendations = processRecommendations(
                    result.recommendations
                );

                // Store and display recommendations
                setRecommendations(processedRecommendations);
                setDisplayResults(true);
                setRecommendationStatus("completed");

                // Save the recommendation to the database
                if (user?.uid && userDetails?.universityId) {
                    try {
                        await saveCareerRecommendation(
                            user.uid,
                            userDetails.universityId,
                            processedRecommendations
                        );
                    } catch (saveError) {
                        console.error(
                            "Error saving recommendation:",
                            saveError
                        );
                    }
                }

                // Scroll to recommendations section
                setTimeout(() => {
                    const recommendationsSection = document.getElementById(
                        "recommendations-section"
                    );
                    if (recommendationsSection) {
                        window.scrollTo({
                            top: recommendationsSection.offsetTop,
                            behavior: "smooth",
                        });
                    }
                }, 100);
            } else {
                // Check if recommendations are still being generated
                if (
                    result.message &&
                    result.message.includes("still being generated")
                ) {
                    setRecommendationStatus("processing");
                    setRecommendationError(
                        "Your recommendations are still being generated. Please check back in a few minutes."
                    );
                } else {
                    setRecommendationStatus(null);
                    setRecommendationError(
                        result.message || "Failed to retrieve recommendations"
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
            setRecommendationError(
                error.message ||
                    "An error occurred while retrieving recommendations. Please try again later."
            );
            setRecommendationStatus(null);
        } finally {
            setGeneratingRecommendation(false);
        }
    };

    // Helper function to process and normalize the recommendations data
    const processRecommendations = (recommendationsData) => {
        // Create a default structure
        const processedData = {
            recommendations: {
                timestamp:
                    recommendationsData.timestamp || new Date().toISOString(),
                specialization_cards: [],
            },
        };

        // Check if we have the new specialization_cards format
        if (
            recommendationsData.specialization_cards &&
            Array.isArray(recommendationsData.specialization_cards)
        ) {
            // Use the new format directly
            processedData.recommendations.specialization_cards =
                recommendationsData.specialization_cards;
            console.log("Using new specialization_cards format directly");
            return processedData;
        }

        // Check if we need to convert from old format
        if (
            (recommendationsData.specializations &&
                Array.isArray(recommendationsData.specializations)) ||
            (recommendationsData.top_specializations &&
                Array.isArray(recommendationsData.top_specializations))
        ) {
            // Get specializations from either old property name
            const specializations =
                recommendationsData.specializations ||
                recommendationsData.top_specializations ||
                [];

            // Convert to the new format
            processedData.recommendations.specialization_cards =
                specializations.map((spec) => {
                    // Process matching skills
                    const matchingSkills = (
                        spec.matched_skills ||
                        spec.matching_skills ||
                        []
                    ).map((skill) => {
                        if (typeof skill === "string") {
                            return {
                                name: skill,
                                proficiency: 50, // Default value
                                match_score: 100, // Assume perfect match
                            };
                        } else {
                            return {
                                name:
                                    skill.skill || skill.name || String(skill),
                                user_skill:
                                    skill.user_skill ||
                                    skill.skill ||
                                    skill.name ||
                                    "",
                                proficiency: skill.proficiency || 0,
                                match_score: skill.match_score || 0,
                            };
                        }
                    });

                    // Process missing skills
                    const missingSkills = (spec.missing_skills || []).map(
                        (skill) => {
                            if (typeof skill === "string") {
                                return {
                                    name: skill,
                                    priority: 50, // Default priority
                                };
                            } else {
                                return {
                                    name:
                                        skill.skill ||
                                        skill.name ||
                                        String(skill),
                                    priority: skill.priority || 50,
                                };
                            }
                        }
                    );

                    // Return the specialization card
                    return {
                        title: spec.specialization || "Unknown Specialization",
                        field: spec.field || "General",
                        confidence:
                            spec.confidence || spec.match_percentage || 0,
                        matching_skills: matchingSkills,
                        missing_skills: missingSkills,
                    };
                });

            console.log("Converted old format to specialization_cards format");
        }

        // For backward compatibility, keep the old structure
        processedData.top_fields =
            processRecommendationsLegacy(recommendationsData).top_fields;
        processedData.top_specializations =
            processRecommendationsLegacy(
                recommendationsData
            ).top_specializations;

        console.log("Processed recommendations:", processedData);
        return processedData;
    };

    // Keep the old function for backward compatibility
    const processRecommendationsLegacy = (recommendationsData) => {
        // Create a default structure if fields are missing
        const processedData = {
            timestamp:
                recommendationsData.timestamp || new Date().toISOString(),
            summary: recommendationsData.summary || null,
            top_fields: [],
            top_specializations: [],
            future_path: recommendationsData.future_path || null,
            development_recommendations:
                recommendationsData.development_recommendations || null,
        };

        // Process specializations if available
        if (
            recommendationsData.specializations &&
            Array.isArray(recommendationsData.specializations)
        ) {
            processedData.top_specializations =
                recommendationsData.specializations.map((spec) => {
                    // Normalize matching skills to always be strings
                    const matching_skills =
                        spec.matching_skills || spec.matched_skills || [];
                    const normalized_matching_skills = matching_skills.map(
                        (skill) =>
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill)
                    );

                    // Normalize missing skills to always be strings
                    const missing_skills = spec.missing_skills || [];
                    const normalized_missing_skills = missing_skills.map(
                        (skill) =>
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill)
                    );

                    return {
                        specialization:
                            spec.name ||
                            spec.specialization ||
                            "Unknown Specialization",
                        match_percentage:
                            spec.confidence ||
                            spec.match_percentage ||
                            spec.score ||
                            50,
                        field: spec.field || null,
                        description: spec.description || null,
                        matching_skills: normalized_matching_skills,
                        missing_skills: normalized_missing_skills,
                        career_path: spec.career_path || null,
                    };
                });
        }

        // Process fields if available
        if (
            recommendationsData.fields &&
            Array.isArray(recommendationsData.fields) &&
            recommendationsData.fields.length > 0
        ) {
            processedData.top_fields = recommendationsData.fields.map(
                (field) => {
                    // Normalize matching skills to always be strings
                    const matching_skills = field.matching_skills || [];
                    const normalized_matching_skills = matching_skills.map(
                        (skill) =>
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill)
                    );

                    // Normalize missing skills to always be strings
                    const missing_skills = field.missing_skills || [];
                    const normalized_missing_skills = missing_skills.map(
                        (skill) =>
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill)
                    );

                    return {
                        field: field.name || field.field || "Unknown Field",
                        match_percentage:
                            field.confidence ||
                            field.match_percentage ||
                            field.score ||
                            50,
                        description: field.description || null,
                        matching_skills: normalized_matching_skills,
                        missing_skills: normalized_missing_skills,
                        career_insights: field.career_insights || null,
                    };
                }
            );
        }
        // Derive fields from specializations if fields array is empty but specializations exist
        else if (processedData.top_specializations.length > 0) {
            console.log(
                "Deriving fields from specializations as fields array is empty"
            );

            // Create a map to collect fields from specializations
            const fieldMap = {};

            // Process each specialization to extract field information
            processedData.top_specializations.forEach((spec) => {
                // Use specialization as field name if no field is provided
                const fieldName = spec.field || "General";

                // Initialize field entry if not exists
                if (!fieldMap[fieldName]) {
                    fieldMap[fieldName] = {
                        field: fieldName,
                        match_percentage: 0,
                        matching_skills: [],
                        missing_skills: [],
                        description: null,
                        career_insights: null,
                    };
                }

                // Update match percentage (take the highest)
                fieldMap[fieldName].match_percentage = Math.max(
                    fieldMap[fieldName].match_percentage,
                    spec.match_percentage
                );

                // Merge matching skills
                if (spec.matching_skills && spec.matching_skills.length > 0) {
                    spec.matching_skills.forEach((skill) => {
                        // Handle both string and object formats for skills
                        const skillName =
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill);

                        if (
                            skillName &&
                            !fieldMap[fieldName].matching_skills.includes(
                                skillName
                            )
                        ) {
                            fieldMap[fieldName].matching_skills.push(skillName);
                        }
                    });
                }

                // Merge missing skills
                if (spec.missing_skills && spec.missing_skills.length > 0) {
                    spec.missing_skills.forEach((skill) => {
                        // Handle both string and object formats for skills
                        const skillName =
                            typeof skill === "string"
                                ? skill
                                : skill.skill || skill.name || String(skill);

                        if (
                            skillName &&
                            !fieldMap[fieldName].missing_skills.includes(
                                skillName
                            )
                        ) {
                            fieldMap[fieldName].missing_skills.push(skillName);
                        }
                    });
                }
            });

            // Convert field map to array and sort by match percentage (descending)
            processedData.top_fields = Object.values(fieldMap).sort(
                (a, b) => b.match_percentage - a.match_percentage
            );
        }

        return processedData;
    };

    // Helper function to format match percentage
    const formatPercentage = (percentValue) => {
        // Handle decimal values like 0.74... by converting to 74%
        if (percentValue < 1) {
            return Math.round(percentValue * 100);
        }
        // Handle values already in range of 1-100
        return Math.round(percentValue);
    };

    // Helper function to normalize skill objects
    const normalizeSkill = (skill) => {
        if (typeof skill === "string") {
            return skill;
        }
        // Check if it's an object with skill property
        if (skill && typeof skill === "object") {
            return skill.skill || skill.name || JSON.stringify(skill);
        }
        // Fallback
        return String(skill);
    };

    // Add this function to reset recommendations
    const handleResetRecommendations = async () => {
        try {
            setRecommendationStatus("resetting");

            // Reset any saved recommendations
            const result = await resetRecommendations();

            if (result.success) {
                // Clear any local state
                setRecommendations(null);
                setDisplayResults(false);
                setRecommendationStatus(null);

                // Also clear from Firestore if logged in
                if (user?.uid && userDetails?.universityId) {
                    try {
                        // Use the existing Firebase functions to delete from Firestore
                        // You might need to implement this function if it doesn't exist
                        await deleteLatestCareerRecommendation(
                            user.uid,
                            userDetails.universityId
                        );
                    } catch (error) {
                        console.error(
                            "Error deleting recommendation from Firestore:",
                            error
                        );
                    }
                }

                // Show success message
                toast.success(
                    "Recommendations have been reset. You can now generate new recommendations."
                );
            } else {
                toast.error(
                    result.message || "Failed to reset recommendations"
                );
            }
        } catch (error) {
            console.error("Error resetting recommendations:", error);
            toast.error("Failed to reset recommendations: " + error.message);
        } finally {
            setRecommendationStatus(null);
        }
    };

    if (loading) {
        return (
            <EmployeePageLoader
                isLoading={true}
                message="Loading career progress..."
            />
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-xl">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const missingSkills = getMissingSkills();
    const skillProgressPercentage = getSkillProgressPercentage();

    return (
        <div className="pb-6 max-w-7xl mx-auto">
            {/* Page Header with Recommendation Buttons */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Career Progress</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchGeneratedRecommendations}
                        disabled={generatingRecommendation}
                        className="flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="mr-2"
                        />
                        Check Recommendations
                    </button>
                    <button
                        onClick={handleGenerateRecommendation}
                        disabled={
                            generatingRecommendation || skills.length === 0
                        }
                        className={`flex items-center px-4 py-2 rounded-lg text-white ${
                            generatingRecommendation || skills.length === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                        {generatingRecommendation ? (
                            <>
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    className="fa-spin mr-2"
                                />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={faRobot}
                                    className="mr-2"
                                />
                                Generate Recommendations
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Display recommendation error if any */}
            {recommendationError && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start">
                        <FontAwesomeIcon
                            icon={faRobot}
                            className="mt-1 mr-2 text-red-500"
                        />
                        <div>
                            <p className="font-medium text-red-700">
                                Recommendation Error
                            </p>
                            <p className="text-sm text-red-600">
                                {recommendationError}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Display recommendation status */}
            {recommendationStatus && (
                <div
                    className={`mb-6 p-4 rounded-lg border ${
                        recommendationStatus === "completed"
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-200"
                    }`}
                >
                    <div className="flex items-start">
                        <FontAwesomeIcon
                            icon={
                                recommendationStatus === "completed"
                                    ? faCheckCircle
                                    : faSpinner
                            }
                            className={`mt-1 mr-2 ${
                                recommendationStatus !== "completed"
                                    ? "fa-spin"
                                    : ""
                            } ${
                                recommendationStatus === "completed"
                                    ? "text-green-500"
                                    : "text-blue-500"
                            }`}
                        />
                        <div>
                            <p
                                className={`font-medium ${
                                    recommendationStatus === "completed"
                                        ? "text-green-700"
                                        : "text-blue-700"
                                }`}
                            >
                                {recommendationStatus === "initiating" &&
                                    "Initiating Recommendations"}
                                {recommendationStatus === "processing" &&
                                    "Recommendations In Progress"}
                                {recommendationStatus === "retrieving" &&
                                    "Retrieving Recommendations"}
                                {recommendationStatus === "completed" &&
                                    "Recommendations Generated"}
                            </p>
                            <p
                                className={`text-sm ${
                                    recommendationStatus === "completed"
                                        ? "text-green-600"
                                        : "text-blue-600"
                                }`}
                            >
                                {recommendationStatus === "initiating" &&
                                    "Starting the AI recommendation process..."}
                                {recommendationStatus === "processing" &&
                                    "The AI is analyzing your skills profile and generating career recommendations. This may take a few minutes."}
                                {recommendationStatus === "retrieving" &&
                                    "Fetching your generated recommendations..."}
                                {recommendationStatus === "completed" &&
                                    "Your career recommendations are ready to view."}
                            </p>
                            {recommendationStatus === "processing" && (
                                <button
                                    onClick={fetchGeneratedRecommendations}
                                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                    Check if Ready
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
                {/* Current Position Card */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon
                            icon={faBriefcase}
                            className="text-blue-500 mr-2"
                        />
                        Current Position Overview
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center text-center">
                            <div className="bg-blue-100 rounded-full p-3 mb-3">
                                <FontAwesomeIcon
                                    icon={faBriefcase}
                                    className="text-blue-600 text-xl"
                                />
                            </div>
                            <h3 className="font-semibold mb-1">
                                Current Position
                            </h3>
                            <p className="text-lg font-bold text-blue-700">
                                {employeeData?.position || "Not assigned"}
                            </p>
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-4 flex flex-col items-center text-center">
                            <div className="bg-indigo-100 rounded-full p-3 mb-3">
                                <FontAwesomeIcon
                                    icon={faTrophy}
                                    className="text-indigo-600 text-xl"
                                />
                            </div>
                            <h3 className="font-semibold mb-1">
                                Next Position
                            </h3>
                            <p className="text-lg font-bold text-indigo-700">
                                {employeeData?.nextPosition || "Not assigned"}
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center text-center">
                            <div className="bg-green-100 rounded-full p-3 mb-3">
                                <FontAwesomeIcon
                                    icon={faChartLine}
                                    className="text-green-600 text-xl"
                                />
                            </div>
                            <h3 className="font-semibold mb-1">
                                Skill Completion
                            </h3>
                            <p className="text-lg font-bold text-green-700">
                                {skillProgressPercentage}%
                            </p>
                        </div>
                    </div>

                    {/* Career Path Progress */}
                    <div className="mb-4">
                        <h3 className="text-md font-medium text-gray-700 mb-2">
                            Career Path Progress
                        </h3>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                                {employeeData?.position || "Current"}
                            </span>
                            <span className="font-medium">
                                {employeeData?.nextPosition || "Next Position"}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${skillProgressPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Skills Needed Section */}
                    {missingSkills.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-md font-medium text-gray-700 mb-2">
                                Skills Needed for Next Position
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {missingSkills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                    >
                                        <FontAwesomeIcon
                                            icon={faLightbulb}
                                            className="mr-1"
                                        />
                                        {normalizeSkill(skill.name)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Skills Overview Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon
                            icon={faGraduationCap}
                            className="text-green-500 mr-2"
                        />
                        Skills Overview
                    </h2>

                    {skills.length > 0 ? (
                        <div className="space-y-4">
                            {skills.slice(0, 5).map((skill) => (
                                <div
                                    key={skill.id}
                                    className="bg-gray-50 p-3 rounded-lg"
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-800">
                                            {skill.name}
                                        </span>
                                        <span className="text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                            {getSkillLevel(skill.proficiency)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-green-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    skill.proficiency || 0
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 flex justify-center">
                                {skills.length > 5 && (
                                    <button
                                        onClick={handleViewAllSkills}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                                    >
                                        View all {skills.length} skills
                                        <FontAwesomeIcon
                                            icon={faArrowRight}
                                            className="ml-2"
                                        />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <FontAwesomeIcon
                                icon={faGraduationCap}
                                className="text-gray-400 text-4xl mb-2"
                            />
                            <p className="text-gray-500 mb-4">
                                No skills recorded yet.
                            </p>
                            <button
                                onClick={handleViewAllSkills}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Add Skills to Your Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Career Path Details (conditionally shown) */}
                {activeSection === "career-path" && selectedCareerPath && (
                    <div
                        ref={careerPathDetailsRef}
                        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FontAwesomeIcon
                                icon={faChartLine}
                                className="text-blue-500 mr-2"
                            />
                            Career Path Details
                        </h2>

                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h3 className="font-medium text-lg text-blue-800">
                                {selectedCareerPath.title || "Career Path"}
                            </h3>
                            <p className="text-blue-700 mt-1">
                                {selectedCareerPath.description ||
                                    "No description available"}
                            </p>
                        </div>

                        {/* Required skills section */}
                        <div className="mt-6">
                            <h3 className="font-medium text-gray-700 mb-3">
                                Required Skills
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedCareerPath.requiredSkills?.map(
                                    (skill, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {skill.name}
                                                </span>
                                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                    Min:{" "}
                                                    {skill.minimumProficiency}%
                                                </span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommendations Section */}
                {displayResults && recommendations && (
                    <div
                        id="recommendations-section"
                        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="rounded-full bg-purple-100 p-3 mr-4">
                                    <FontAwesomeIcon
                                        icon={faRobot}
                                        className="text-purple-600 text-xl"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        AI Career Recommendations
                                    </h2>
                                    <p className="text-gray-600">
                                        Personalized career path suggestions
                                        based on your skills profile
                                    </p>
                                </div>
                            </div>

                            {/* Regenerate Button */}
                            <div className="flex justify-end mb-4">
                                <button
                                    className="flex items-center px-4 py-2 mr-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    onClick={handleResetRecommendations}
                                    disabled={
                                        generatingRecommendation ||
                                        recommendationStatus === "resetting"
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faRefresh}
                                        className="mr-2"
                                    />
                                    Reset Recommendations
                                </button>
                                <button
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    onClick={handleGenerateRecommendation}
                                    disabled={generatingRecommendation}
                                >
                                    <FontAwesomeIcon
                                        icon={faBolt}
                                        className="mr-2"
                                    />
                                    Generate New Recommendations
                                </button>
                            </div>
                        </div>

                        {/* Recommendations Results */}
                        <div className="mt-4">
                            {/* Display Specialization Cards */}
                            {recommendations.recommendations &&
                            recommendations.recommendations
                                .specialization_cards &&
                            recommendations.recommendations.specialization_cards
                                .length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {recommendations.recommendations.specialization_cards.map(
                                        (card, index) => (
                                            <div
                                                key={index}
                                                className="bg-white rounded-lg p-5 shadow border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="mb-3">
                                                    <h4 className="text-xl font-medium text-gray-900">
                                                        {card.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {card.field}
                                                    </p>
                                                    <div className="mt-2">
                                                        <div className="flex items-center mb-1">
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                                <div
                                                                    className="bg-purple-600 h-2.5 rounded-full"
                                                                    style={{
                                                                        width: `${formatPercentage(
                                                                            card.confidence
                                                                        )}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                                                                {formatPercentage(
                                                                    card.confidence
                                                                )}
                                                                % Match
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Matching skills */}
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                        <FontAwesomeIcon
                                                            icon={faCheckCircle}
                                                            className="text-green-500 mr-1"
                                                        />
                                                        Matching skills
                                                    </h5>
                                                    {card.matching_skills &&
                                                    card.matching_skills
                                                        .length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {card.matching_skills.map(
                                                                (
                                                                    skill,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full"
                                                                    >
                                                                        {
                                                                            skill.name
                                                                        }
                                                                        {skill.proficiency >
                                                                            0 &&
                                                                            ` (${skill.proficiency}%)`}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">
                                                            No matching skills
                                                            found
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Skills needed */}
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                        <FontAwesomeIcon
                                                            icon={faLightbulb}
                                                            className="text-yellow-500 mr-1"
                                                        />
                                                        Skills needed to attain{" "}
                                                        {card.title}
                                                    </h5>
                                                    {card.missing_skills &&
                                                    card.missing_skills.length >
                                                        0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {card.missing_skills.map(
                                                                (
                                                                    skill,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full"
                                                                    >
                                                                        {
                                                                            skill.name
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">
                                                            No skill gaps
                                                            identified
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                // If no specialization cards, use traditional format
                                <>
                                    {/* Legacy display for old format */}
                                    {(recommendations.top_fields &&
                                        recommendations.top_fields.length >
                                            0) ||
                                    (recommendations.top_specializations &&
                                        recommendations.top_specializations
                                            .length > 0) ? (
                                        <>
                                            {/* Top Fields Section */}
                                            {recommendations.top_fields &&
                                                recommendations.top_fields
                                                    .length > 0 && (
                                                    <div className="mb-8">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                                            Recommended Career
                                                            Fields
                                                        </h3>
                                                        <div className="space-y-6">
                                                            {/* Legacy fields display */}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Top Specializations Section */}
                                            {recommendations.top_specializations &&
                                                recommendations
                                                    .top_specializations
                                                    .length > 0 && (
                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                                            Recommended
                                                            Specializations
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Legacy specializations display */}
                                                        </div>
                                                    </div>
                                                )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600">
                                                No recommendations available
                                                yet.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Hide results button */}
                        <div className="flex justify-center mt-6 pt-4 border-t">
                            <button
                                onClick={() => setDisplayResults(false)}
                                className="text-gray-600 hover:text-gray-800 flex items-center"
                            >
                                <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    className="mr-1"
                                />
                                Hide Results
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerProgress;

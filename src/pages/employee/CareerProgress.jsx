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
    saveCareerRecommendation,
    getLatestCareerRecommendation,
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
    faSync,
} from "@fortawesome/free-solid-svg-icons";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";

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

    // Recommendation system state
    const [recommendations, setRecommendations] = useState(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState(null);
    const [showingRecommendations, setShowingRecommendations] = useState(false);
    const [savedRecommendation, setSavedRecommendation] = useState(null);

    // Refs for scrolling
    const careerPathDetailsRef = useRef(null);
    const recommendationsRef = useRef(null);

    // Check for section and careerPathId in URL query parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sectionParam = params.get("section");
        const careerPathParam = params.get("careerPathId");

        if (
            sectionParam &&
            [
                "overview",
                "career-path",
                "skills-gap",
                "recommendations",
            ].includes(sectionParam)
        ) {
            setActiveSection(sectionParam);
            if (sectionParam === "recommendations") {
                setShowingRecommendations(true);
            }
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
    }, [activeSection, selectedCareerPath]);

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
    }, [user, userDetails]);

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

    // Functions for recommendation system
    const fetchRecommendations = async () => {
        try {
            if (!skills || skills.length === 0) {
                setRecommendationError(
                    "You need to add skills before getting recommendations"
                );
                return;
            }

            setRecommendationLoading(true);
            setRecommendationError(null);

            // First check if there are saved recommendations
            if (userDetails && userDetails.universityId) {
                const savedRecommendationResult =
                    await getLatestCareerRecommendation(
                        user.uid,
                        userDetails.universityId
                    );

                if (
                    savedRecommendationResult.success &&
                    savedRecommendationResult.recommendation
                ) {
                    // Use saved recommendation if it exists and is recent (within 30 days)
                    const savedData = savedRecommendationResult.recommendation;

                    // Check if the recommendation is recent
                    const timestamp =
                        savedData.timestamp?.toDate?.() ||
                        new Date(savedData.timestamp);
                    const isRecent =
                        new Date() - timestamp < 30 * 24 * 60 * 60 * 1000; // 30 days

                    if (isRecent) {
                        setSavedRecommendation(savedData);
                        setRecommendations(savedData.recommendationData);
                        setRecommendationLoading(false);
                        setShowingRecommendations(true);

                        // Update URL
                        setActiveSection("recommendations");
                        const params = new URLSearchParams(location.search);
                        params.set("section", "recommendations");
                        navigate(`${location.pathname}?${params.toString()}`, {
                            replace: true,
                        });

                        // Scroll to recommendations section
                        setTimeout(() => {
                            if (recommendationsRef.current) {
                                recommendationsRef.current.scrollIntoView({
                                    behavior: "smooth",
                                });
                            }
                        }, 300);

                        return;
                    }
                }
            }

            // Get new recommendations if no recent saved ones
            const currentField = employeeData?.field || null;
            const currentSpecialization = employeeData?.position || null;

            // Fetch recommendations based on skills
            const recommendationsResult = await getCareerRecommendations(
                skills,
                currentField,
                currentSpecialization
            );

            if (recommendationsResult.success) {
                setRecommendations(recommendationsResult.recommendations);

                // Save the recommendations to the database
                if (userDetails && userDetails.universityId) {
                    const saveResult = await saveCareerRecommendation(
                        user.uid,
                        userDetails.universityId,
                        recommendationsResult.recommendations
                    );

                    if (saveResult.success) {
                        console.log("Saved career recommendations");
                    }
                }

                setShowingRecommendations(true);

                // Update URL
                setActiveSection("recommendations");
                const params = new URLSearchParams(location.search);
                params.set("section", "recommendations");
                navigate(`${location.pathname}?${params.toString()}`, {
                    replace: true,
                });

                // Scroll to recommendations section
                setTimeout(() => {
                    if (recommendationsRef.current) {
                        recommendationsRef.current.scrollIntoView({
                            behavior: "smooth",
                        });
                    }
                }, 300);
            } else {
                // Handle model not available error more prominently
                const errorMessage =
                    recommendationsResult.message ||
                    "Error getting recommendations";
                console.error("API Error:", errorMessage);

                if (errorMessage.includes("model is not available")) {
                    setRecommendationError(
                        "The recommendation model is not available. Please contact your system administrator to ensure the model is properly configured."
                    );
                } else {
                    setRecommendationError(errorMessage);
                }

                // Clear any existing recommendations
                setShowingRecommendations(false);
                setRecommendations(null);
            }

            setRecommendationLoading(false);
        } catch (error) {
            console.error("Error in fetchRecommendations:", error);
            setRecommendationError(
                "An error occurred while getting recommendations. Please try again later."
            );
            setRecommendationLoading(false);

            // Clear any existing recommendations
            setShowingRecommendations(false);
            setRecommendations(null);
        }
    };

    const handleApplyRecommendation = (specialization) => {
        if (userDetails && userDetails.universityId && employeeData) {
            setLoading(true);

            // Update employee data with recommended specialization
            updateEmployeeProfile(user.uid, userDetails.universityId, {
                nextPosition: specialization,
            })
                .then((result) => {
                    if (result.success) {
                        // Reload employee data
                        getEmployeeData(user.uid, userDetails.universityId)
                            .then((empData) => {
                                if (empData.success) {
                                    setEmployeeData(empData.data);
                                }
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                    } else {
                        setError("Failed to update career path");
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.error("Error applying recommendation:", err);
                    setError("An error occurred");
                    setLoading(false);
                });
        }
    };

    const handleRedoRecommendations = async () => {
        if (userDetails && userDetails.universityId) {
            setRecommendationLoading(true);
            setRecommendationError(null);

            try {
                // Delete the latest recommendation
                const deleteResult = await deleteLatestCareerRecommendation(
                    user.uid,
                    userDetails.universityId
                );

                if (deleteResult.success) {
                    // Clear current recommendations
                    setRecommendations(null);
                    setSavedRecommendation(null);

                    // Get new recommendations
                    const currentField = employeeData?.field || null;
                    const currentSpecialization =
                        employeeData?.position || null;

                    // Fetch recommendations based on skills
                    const recommendationsResult =
                        await getCareerRecommendations(
                            skills,
                            currentField,
                            currentSpecialization
                        );

                    if (recommendationsResult.success) {
                        setRecommendations(
                            recommendationsResult.recommendations
                        );

                        // Save the recommendations to the database
                        const saveResult = await saveCareerRecommendation(
                            user.uid,
                            userDetails.universityId,
                            recommendationsResult.recommendations
                        );

                        if (saveResult.success) {
                            console.log("Saved new career recommendations");
                        }

                        setShowingRecommendations(true);

                        // Update URL and scroll to recommendations section
                        setActiveSection("recommendations");
                        const params = new URLSearchParams(location.search);
                        params.set("section", "recommendations");
                        navigate(`${location.pathname}?${params.toString()}`, {
                            replace: true,
                        });

                        setTimeout(() => {
                            if (recommendationsRef.current) {
                                recommendationsRef.current.scrollIntoView({
                                    behavior: "smooth",
                                });
                            }
                        }, 300);
                    } else {
                        // Handle model not available error more prominently
                        const errorMessage =
                            recommendationsResult.message ||
                            "Error getting recommendations";
                        console.error("API Error:", errorMessage);

                        if (errorMessage.includes("model is not available")) {
                            setRecommendationError(
                                "The recommendation model is not available. Please contact your system administrator to ensure the model is properly configured."
                            );
                        } else {
                            setRecommendationError(errorMessage);
                        }

                        // Ensure no partial recommendations are displayed
                        setShowingRecommendations(false);
                        setRecommendations(null);
                    }
                } else {
                    setRecommendationError(
                        deleteResult.message ||
                            "Failed to delete the latest recommendation"
                    );
                }
            } catch (error) {
                console.error("Error in handleRedoRecommendations:", error);
                setRecommendationError(
                    "An error occurred while redoing recommendations. Please try again later."
                );

                // Ensure no partial recommendations are displayed
                setShowingRecommendations(false);
                setRecommendations(null);
            } finally {
                setRecommendationLoading(false);
            }
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
        <div className="pb-6">
            <h1 className="text-2xl font-bold mb-6">Career Progress</h1>

            {/* Current Position Overview */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-4">
                    Current Position
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center text-center">
                        <div className="bg-blue-100 rounded-full p-3 mb-3">
                            <FontAwesomeIcon
                                icon={faBriefcase}
                                className="text-blue-600 text-xl"
                            />
                        </div>
                        <h3 className="font-semibold mb-1">Current Position</h3>
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
                        <h3 className="font-semibold mb-1">Next Position</h3>
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
                        <h3 className="font-semibold mb-1">Completion</h3>
                        <p className="text-lg font-bold text-green-700">
                            {skillProgressPercentage}%
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                            {employeeData?.position || "Not assigned"}
                        </span>
                        <span className="font-medium">
                            {employeeData?.nextPosition || "Not assigned"}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${skillProgressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Skills Overview & AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Skills Overview */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <FontAwesomeIcon
                                icon={faGraduationCap}
                                className="text-green-600 text-xl"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Skills Overview
                            </h2>
                            <p className="text-gray-600">
                                {skills.length} skills acquired
                            </p>
                        </div>
                    </div>

                    {skills.length > 0 ? (
                        <div className="space-y-3 mt-4">
                            {skills.slice(0, 5).map((skill) => (
                                <div key={skill.id}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-700">
                                            {skill.name}
                                        </span>
                                        <span className="text-gray-500 text-sm">
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

                            <div className="flex flex-col space-y-2 mt-4">
                                {skills.length > 5 && (
                                    <button
                                        onClick={handleViewAllSkills}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
                                    >
                                        View all skills
                                        <FontAwesomeIcon
                                            icon={faArrowRight}
                                            className="ml-1 text-xs"
                                        />
                                    </button>
                                )}

                                <button
                                    onClick={fetchRecommendations}
                                    disabled={
                                        recommendationLoading ||
                                        skills.length === 0
                                    }
                                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-white ${
                                        recommendationLoading ||
                                        skills.length === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {recommendationLoading ? (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                className="fa-spin mr-2"
                                            />
                                            Analyzing Skills...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faRobot}
                                                className="mr-2"
                                            />
                                            {recommendations
                                                ? "Refresh Recommendations"
                                                : "Get AI Career Recommendations"}
                                        </>
                                    )}
                                </button>

                                {recommendationError && (
                                    <div
                                        className={`mt-3 p-3 rounded-lg ${
                                            recommendationError.includes(
                                                "model is not available"
                                            )
                                                ? "bg-red-100 border border-red-300"
                                                : "bg-orange-50 border border-orange-200"
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <FontAwesomeIcon
                                                icon={faRobot}
                                                className={`mt-1 mr-2 ${
                                                    recommendationError.includes(
                                                        "model is not available"
                                                    )
                                                        ? "text-red-600"
                                                        : "text-orange-500"
                                                }`}
                                            />
                                            <div>
                                                <p
                                                    className={`font-medium ${
                                                        recommendationError.includes(
                                                            "model is not available"
                                                        )
                                                            ? "text-red-700"
                                                            : "text-orange-700"
                                                    }`}
                                                >
                                                    {recommendationError.includes(
                                                        "model is not available"
                                                    )
                                                        ? "Model Unavailable"
                                                        : "Recommendation Error"}
                                                </p>
                                                <p
                                                    className={`text-sm ${
                                                        recommendationError.includes(
                                                            "model is not available"
                                                        )
                                                            ? "text-red-600"
                                                            : "text-orange-600"
                                                    }`}
                                                >
                                                    {recommendationError}
                                                </p>
                                                {recommendationError.includes(
                                                    "model is not available"
                                                ) && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Please ensure the
                                                        recommendation model is
                                                        properly installed and
                                                        configured to get AI
                                                        recommendations.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-500">
                                No skills recorded yet.
                            </p>
                            <button
                                onClick={handleViewAllSkills}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto"
                            >
                                Add skills
                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                    className="ml-1 text-xs"
                                />
                            </button>
                        </div>
                    )}
                </div>

                {/* AI Recommendations Summary */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                            <FontAwesomeIcon
                                icon={faRobot}
                                className="text-blue-600 text-xl"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                AI Recommendations
                            </h2>
                            <p className="text-gray-600">
                                Career matches based on your skills
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        <p className="text-gray-700">
                            Get personalized career recommendations based on
                            your skills profile.
                        </p>

                        {recommendations ? (
                            <div>
                                <p className="text-gray-600 mb-3">
                                    Top match:{" "}
                                    <span className="font-medium text-blue-600">
                                        {recommendations.top_fields[0]?.field ||
                                            "Technology"}
                                        (
                                        {recommendations.top_fields[0]
                                            ?.match_percentage || 85}
                                        % match)
                                    </span>
                                </p>

                                {recommendations.top_fields &&
                                    recommendations.top_fields.length > 0 && (
                                        <div className="mb-6">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                                <div
                                                    className="bg-green-600 h-2.5 rounded-full"
                                                    style={{
                                                        width: `${
                                                            recommendations
                                                                .top_fields[0]
                                                                ?.match_percentage ||
                                                            0
                                                        }%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                <button
                                    onClick={() => {
                                        setActiveSection("recommendations");
                                        const params = new URLSearchParams(
                                            location.search
                                        );
                                        params.set(
                                            "section",
                                            "recommendations"
                                        );
                                        navigate(
                                            `${
                                                location.pathname
                                            }?${params.toString()}`,
                                            { replace: true }
                                        );

                                        setTimeout(() => {
                                            if (recommendationsRef.current) {
                                                recommendationsRef.current.scrollIntoView(
                                                    { behavior: "smooth" }
                                                );
                                            }
                                        }, 100);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full"
                                >
                                    View Detailed Recommendations
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={fetchRecommendations}
                                disabled={
                                    recommendationLoading || skills.length === 0
                                }
                                className={`flex items-center justify-center px-4 py-2 rounded-lg text-white w-full ${
                                    recommendationLoading || skills.length === 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {recommendationLoading ? (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSpinner}
                                            className="fa-spin mr-2"
                                        />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faRobot}
                                            className="mr-2"
                                        />
                                        Get Recommendations
                                    </>
                                )}
                            </button>
                        )}

                        {recommendationError && (
                            <div
                                className={`mt-3 p-3 rounded-lg ${
                                    recommendationError.includes(
                                        "model is not available"
                                    )
                                        ? "bg-red-100 border border-red-300"
                                        : "bg-orange-50 border border-orange-200"
                                }`}
                            >
                                <div className="flex items-start">
                                    <FontAwesomeIcon
                                        icon={faRobot}
                                        className={`mt-1 mr-2 ${
                                            recommendationError.includes(
                                                "model is not available"
                                            )
                                                ? "text-red-600"
                                                : "text-orange-500"
                                        }`}
                                    />
                                    <div>
                                        <p
                                            className={`font-medium ${
                                                recommendationError.includes(
                                                    "model is not available"
                                                )
                                                    ? "text-red-700"
                                                    : "text-orange-700"
                                            }`}
                                        >
                                            {recommendationError.includes(
                                                "model is not available"
                                            )
                                                ? "Model Unavailable"
                                                : "Recommendation Error"}
                                        </p>
                                        <p
                                            className={`text-sm ${
                                                recommendationError.includes(
                                                    "model is not available"
                                                )
                                                    ? "text-red-600"
                                                    : "text-orange-600"
                                            }`}
                                        >
                                            {recommendationError}
                                        </p>
                                        {recommendationError.includes(
                                            "model is not available"
                                        ) && (
                                            <p className="text-sm text-red-600 mt-1">
                                                Please ensure the recommendation
                                                model is properly installed and
                                                configured to get AI
                                                recommendations.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Career Recommendations Detail Section */}
            {(showingRecommendations || recommendations) && (
                <div
                    ref={recommendationsRef}
                    className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3 mr-4">
                                <FontAwesomeIcon
                                    icon={faRobot}
                                    className="text-blue-600 text-xl"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    AI Career Recommendations
                                </h2>
                                <p className="text-gray-600">
                                    {savedRecommendation ? (
                                        <>
                                            Generated on{" "}
                                            {new Date(
                                                savedRecommendation.timestamp?.toDate?.() ||
                                                    savedRecommendation.timestamp
                                            ).toLocaleDateString()}
                                        </>
                                    ) : (
                                        "Based on your skills profile"
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={fetchRecommendations}
                                disabled={recommendationLoading}
                                className={`flex items-center px-3 py-1 rounded text-white ${
                                    recommendationLoading
                                        ? "bg-gray-400"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                                title="Refresh recommendations with current skills"
                            >
                                {recommendationLoading ? (
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        className="fa-spin"
                                    />
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faSync}
                                            className="mr-1"
                                        />{" "}
                                        Refresh
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleRedoRecommendations}
                                disabled={recommendationLoading}
                                className={`flex items-center px-3 py-1 rounded text-white ${
                                    recommendationLoading
                                        ? "bg-gray-400"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                                title="Delete previous recommendation and generate a new one based on your current skills"
                            >
                                {recommendationLoading ? (
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        className="fa-spin"
                                    />
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faRobot}
                                            className="mr-1"
                                        />{" "}
                                        Redo Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {recommendationLoading && (
                        <div className="text-center py-8">
                            <FontAwesomeIcon
                                icon={faSpinner}
                                className="fa-spin text-blue-500 text-4xl mb-4"
                            />
                            <p className="text-gray-600">
                                Analyzing your skills and generating
                                recommendations...
                            </p>
                        </div>
                    )}

                    {!recommendationLoading && recommendations && (
                        <>
                            {/* Explanation */}
                            {recommendations.explanation &&
                                recommendations.explanation.summary && (
                                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                        <h3 className="font-medium text-blue-800 mb-2">
                                            Analysis Summary
                                        </h3>
                                        <p className="text-gray-700">
                                            {
                                                recommendations.explanation
                                                    .summary
                                            }
                                        </p>

                                        {recommendations.explanation
                                            .details && (
                                            <p className="text-gray-600 mt-2">
                                                {
                                                    recommendations.explanation
                                                        .details
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Field Recommendations */}
                            {recommendations.top_fields &&
                                recommendations.top_fields.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                                            Recommended Career Fields
                                        </h3>

                                        <div className="space-y-6">
                                            {recommendations.top_fields.map(
                                                (field, index) => (
                                                    <div
                                                        key={index}
                                                        className="border border-gray-200 rounded-xl p-4 shadow-sm"
                                                    >
                                                        <div className="flex justify-between mb-2">
                                                            <h4 className="text-lg font-medium">
                                                                {field.field}
                                                            </h4>
                                                            <span className="text-green-600 font-bold">
                                                                {
                                                                    field.match_percentage
                                                                }
                                                                % Match
                                                            </span>
                                                        </div>

                                                        {/* Match progress bar */}
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                                            <div
                                                                className={`h-2.5 rounded-full ${
                                                                    field.match_percentage >=
                                                                    85
                                                                        ? "bg-green-600"
                                                                        : field.match_percentage >=
                                                                          70
                                                                        ? "bg-blue-600"
                                                                        : field.match_percentage >=
                                                                          50
                                                                        ? "bg-yellow-500"
                                                                        : "bg-red-500"
                                                                }`}
                                                                style={{
                                                                    width: `${field.match_percentage}%`,
                                                                }}
                                                            ></div>
                                                        </div>

                                                        {/* Matching skills */}
                                                        {field.matching_skills &&
                                                            field
                                                                .matching_skills
                                                                .length > 0 && (
                                                                <div className="mb-3">
                                                                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                                                                        Matching
                                                                        Skills:
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {field.matching_skills
                                                                            .slice(
                                                                                0,
                                                                                5
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    skill,
                                                                                    skillIndex
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            skillIndex
                                                                                        }
                                                                                        className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center"
                                                                                    >
                                                                                        <FontAwesomeIcon
                                                                                            icon={
                                                                                                faCheckCircle
                                                                                            }
                                                                                            className="mr-1 text-green-600"
                                                                                        />
                                                                                        {
                                                                                            skill
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        {field
                                                                            .matching_skills
                                                                            .length >
                                                                            5 && (
                                                                            <span className="text-gray-500 text-xs">
                                                                                +
                                                                                {field
                                                                                    .matching_skills
                                                                                    .length -
                                                                                    5}{" "}
                                                                                more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Missing skills */}
                                                        {field.missing_skills &&
                                                            field.missing_skills
                                                                .length > 0 && (
                                                                <div>
                                                                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                                                                        Skills
                                                                        to
                                                                        Develop:
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {field.missing_skills
                                                                            .slice(
                                                                                0,
                                                                                5
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    skill,
                                                                                    skillIndex
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            skillIndex
                                                                                        }
                                                                                        className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                                                                                    >
                                                                                        {
                                                                                            skill
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        {field
                                                                            .missing_skills
                                                                            .length >
                                                                            5 && (
                                                                            <span className="text-gray-500 text-xs">
                                                                                +
                                                                                {field
                                                                                    .missing_skills
                                                                                    .length -
                                                                                    5}{" "}
                                                                                more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Specialization Recommendations */}
                            {recommendations.top_specializations &&
                                recommendations.top_specializations.length >
                                    0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                                            Recommended Specializations
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {recommendations.top_specializations.map(
                                                (spec, index) => (
                                                    <div
                                                        key={index}
                                                        className="border border-gray-200 rounded-xl p-4 shadow-sm"
                                                    >
                                                        <div className="flex justify-between mb-2">
                                                            <h4 className="text-lg font-medium">
                                                                {
                                                                    spec.specialization
                                                                }
                                                            </h4>
                                                            <span className="text-green-600 font-bold">
                                                                {
                                                                    spec.match_percentage
                                                                }
                                                                % Match
                                                            </span>
                                                        </div>

                                                        {/* Match progress bar */}
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                                            <div
                                                                className={`h-2.5 rounded-full ${
                                                                    spec.match_percentage >=
                                                                    85
                                                                        ? "bg-green-600"
                                                                        : spec.match_percentage >=
                                                                          70
                                                                        ? "bg-blue-600"
                                                                        : spec.match_percentage >=
                                                                          50
                                                                        ? "bg-yellow-500"
                                                                        : "bg-red-500"
                                                                }`}
                                                                style={{
                                                                    width: `${spec.match_percentage}%`,
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <div className="mb-4">
                                                            {/* Matching skills */}
                                                            {spec.matching_skills &&
                                                                spec
                                                                    .matching_skills
                                                                    .length >
                                                                    0 && (
                                                                    <div className="mb-3">
                                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                                                            Matching
                                                                            Skills:
                                                                        </h5>
                                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                                            {spec.matching_skills
                                                                                .slice(
                                                                                    0,
                                                                                    3
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        skill,
                                                                                        skillIndex
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                skillIndex
                                                                                            }
                                                                                            className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full"
                                                                                        >
                                                                                            {
                                                                                                skill
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            {spec
                                                                                .matching_skills
                                                                                .length >
                                                                                3 && (
                                                                                <span className="text-gray-500 text-xs">
                                                                                    +
                                                                                    {spec
                                                                                        .matching_skills
                                                                                        .length -
                                                                                        3}{" "}
                                                                                    more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            {/* Missing skills */}
                                                            {spec.missing_skills &&
                                                                spec
                                                                    .missing_skills
                                                                    .length >
                                                                    0 && (
                                                                    <div>
                                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                                                            Skills
                                                                            to
                                                                            Develop:
                                                                        </h5>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {spec.missing_skills
                                                                                .slice(
                                                                                    0,
                                                                                    3
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        skill,
                                                                                        skillIndex
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                skillIndex
                                                                                            }
                                                                                            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full"
                                                                                        >
                                                                                            {
                                                                                                skill
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            {spec
                                                                                .missing_skills
                                                                                .length >
                                                                                3 && (
                                                                                <span className="text-gray-500 text-xs">
                                                                                    +
                                                                                    {spec
                                                                                        .missing_skills
                                                                                        .length -
                                                                                        3}{" "}
                                                                                    more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                handleApplyRecommendation(
                                                                    spec.specialization
                                                                )
                                                            }
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                                                        >
                                                            Set as Next Position
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Strengths and Development Areas */}
                            {recommendations.explanation &&
                                recommendations.explanation.skill_analysis && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        {/* Key Strengths */}
                                        {recommendations.explanation
                                            .skill_analysis.key_strengths &&
                                            recommendations.explanation
                                                .skill_analysis.key_strengths
                                                .length > 0 && (
                                                <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                                                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                                                        Your Key Strengths
                                                    </h3>

                                                    <ul className="space-y-2">
                                                        {recommendations.explanation.skill_analysis.key_strengths.map(
                                                            (
                                                                strength,
                                                                index
                                                            ) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex items-center"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faStar
                                                                        }
                                                                        className="text-yellow-500 mr-2"
                                                                    />
                                                                    <span className="text-gray-700">
                                                                        {
                                                                            strength.skill
                                                                        }
                                                                        {strength.relevance && (
                                                                            <span
                                                                                className={`ml-2 text-xs ${
                                                                                    strength.relevance ===
                                                                                    "high"
                                                                                        ? "text-green-600"
                                                                                        : strength.relevance ===
                                                                                          "medium"
                                                                                        ? "text-blue-600"
                                                                                        : "text-gray-600"
                                                                                }`}
                                                                            >
                                                                                {strength.relevance ===
                                                                                "high"
                                                                                    ? "(High Relevance)"
                                                                                    : strength.relevance ===
                                                                                      "medium"
                                                                                    ? "(Medium Relevance)"
                                                                                    : "(Relevant)"}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                        {/* Development Areas */}
                                        {recommendations.explanation
                                            .skill_analysis.development_areas &&
                                            recommendations.explanation
                                                .skill_analysis
                                                .development_areas.length >
                                                0 && (
                                                <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50">
                                                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                                                        Recommended Development
                                                        Areas
                                                    </h3>

                                                    <ul className="space-y-2">
                                                        {recommendations.explanation.skill_analysis.development_areas.map(
                                                            (area, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex items-center"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faLightbulb
                                                                        }
                                                                        className="text-yellow-500 mr-2"
                                                                    />
                                                                    <span className="text-gray-700">
                                                                        {
                                                                            area.skill
                                                                        }
                                                                        {area.importance && (
                                                                            <span
                                                                                className={`ml-2 text-xs ${
                                                                                    area.importance ===
                                                                                    "high"
                                                                                        ? "text-red-600"
                                                                                        : area.importance ===
                                                                                          "medium"
                                                                                        ? "text-orange-600"
                                                                                        : "text-yellow-600"
                                                                                }`}
                                                                            >
                                                                                {area.importance ===
                                                                                "high"
                                                                                    ? "(High Priority)"
                                                                                    : area.importance ===
                                                                                      "medium"
                                                                                    ? "(Medium Priority)"
                                                                                    : "(Priority)"}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </div>
                                )}
                        </>
                    )}

                    {/* Recommendation Action Explanation */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            About these recommendations:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start">
                                <FontAwesomeIcon
                                    icon={faSync}
                                    className="text-blue-600 mt-1 mr-2"
                                />
                                <span>
                                    <strong>Refresh</strong>: Updates the
                                    recommendation display without changing your
                                    saved data.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <FontAwesomeIcon
                                    icon={faRobot}
                                    className="text-green-600 mt-1 mr-2"
                                />
                                <span>
                                    <strong>Redo Analysis</strong>: Deletes your
                                    previous recommendation and generates a
                                    completely new analysis based on your
                                    current skills. Use this when you've made
                                    significant changes to your skills.
                                </span>
                            </li>
                        </ul>
                    </div>

                    {recommendationError && (
                        <div
                            className={`mt-3 p-3 rounded-lg ${
                                recommendationError.includes(
                                    "model is not available"
                                )
                                    ? "bg-red-100 border border-red-300"
                                    : "bg-orange-50 border border-orange-200"
                            }`}
                        >
                            <div className="flex items-start">
                                <FontAwesomeIcon
                                    icon={faRobot}
                                    className={`mt-1 mr-2 ${
                                        recommendationError.includes(
                                            "model is not available"
                                        )
                                            ? "text-red-600"
                                            : "text-orange-500"
                                    }`}
                                />
                                <div>
                                    <p
                                        className={`font-medium ${
                                            recommendationError.includes(
                                                "model is not available"
                                            )
                                                ? "text-red-700"
                                                : "text-orange-700"
                                        }`}
                                    >
                                        {recommendationError.includes(
                                            "model is not available"
                                        )
                                            ? "Model Unavailable"
                                            : "Recommendation Error"}
                                    </p>
                                    <p
                                        className={`text-sm ${
                                            recommendationError.includes(
                                                "model is not available"
                                            )
                                                ? "text-red-600"
                                                : "text-orange-600"
                                        }`}
                                    >
                                        {recommendationError}
                                    </p>
                                    {recommendationError.includes(
                                        "model is not available"
                                    ) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            Please ensure the recommendation
                                            model is properly installed and
                                            configured to get AI
                                            recommendations.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CareerProgress;

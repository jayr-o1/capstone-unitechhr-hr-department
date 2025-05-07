import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import {
    getEmployeeSkills,
    getEmployeeData,
    updateEmployeeProfile,
} from "../../services/employeeService";
import { getTeachingRecommendations } from "../../services/recommendationService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChalkboardTeacher,
    faGraduationCap,
    faCheckCircle,
    faLightbulb,
    faBriefcase,
    faChartLine,
    faArrowRight,
    faBook,
    faLaptopCode,
    faDatabase,
    faMicrochip,
    faCode,
    faRobot,
    faServer,
    faMobile,
    faCloud,
    faNetworkWired,
    faProjectDiagram,
    faUserGraduate,
    faInfoCircle,
    faSync,
} from "@fortawesome/free-solid-svg-icons";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";
import { toast } from "react-hot-toast";

// Mock data for development specializations
const DEVELOPMENT_SPECIALIZATIONS = [
    {
        id: "db_instructor",
        title: "Database Education",
        description:
            "Specialize in teaching database concepts, SQL, and database management systems to college students",
        icon: faDatabase,
        requiredSkills: [
            { name: "SQL", minimumProficiency: 80 },
            { name: "Database Design", minimumProficiency: 75 },
            { name: "Teaching Methods", minimumProficiency: 70 },
            { name: "Student Assessment", minimumProficiency: 65 },
        ],
        color: "blue",
    },
    {
        id: "ml_instructor",
        title: "AI & Machine Learning Education",
        description:
            "Specialize in teaching artificial intelligence and machine learning concepts to college students",
        icon: faRobot,
        requiredSkills: [
            { name: "Python", minimumProficiency: 80 },
            { name: "Machine Learning", minimumProficiency: 85 },
            { name: "Curriculum Development", minimumProficiency: 75 },
            { name: "Student Engagement", minimumProficiency: 70 },
        ],
        color: "purple",
    },
    {
        id: "web_instructor",
        title: "Web Development Education",
        description:
            "Specialize in teaching modern web development technologies and frameworks to college students",
        icon: faCode,
        requiredSkills: [
            { name: "HTML/CSS", minimumProficiency: 85 },
            { name: "JavaScript", minimumProficiency: 80 },
            { name: "Project-Based Learning", minimumProficiency: 75 },
            { name: "Code Review", minimumProficiency: 70 },
        ],
        color: "green",
    },
    {
        id: "mobile_instructor",
        title: "Mobile App Development Education",
        description:
            "Specialize in teaching mobile application development for various platforms to college students",
        icon: faMobile,
        requiredSkills: [
            { name: "Mobile Frameworks", minimumProficiency: 80 },
            { name: "UX Design", minimumProficiency: 75 },
            { name: "Lab Instruction", minimumProficiency: 80 },
            { name: "Student Mentoring", minimumProficiency: 70 },
        ],
        color: "orange",
    },
    {
        id: "research_mentor",
        title: "Research Mentorship",
        description:
            "Mentor students in academic research projects and methodologies",
        icon: faGraduationCap,
        requiredSkills: [
            { name: "Research Methods", minimumProficiency: 85 },
            { name: "Academic Writing", minimumProficiency: 80 },
            { name: "Data Analysis", minimumProficiency: 75 },
            { name: "Graduate Advising", minimumProficiency: 70 },
        ],
        color: "cyan",
    },
    {
        id: "cybersecurity_instructor",
        title: "Cybersecurity Education",
        description:
            "Specialize in teaching cybersecurity concepts, threats, and defenses to college students",
        icon: faServer,
        requiredSkills: [
            { name: "Network Security", minimumProficiency: 85 },
            { name: "Ethical Hacking", minimumProficiency: 80 },
            { name: "Lab Development", minimumProficiency: 75 },
            { name: "Case Studies", minimumProficiency: 70 },
        ],
        color: "yellow",
    },
    {
        id: "online_learning",
        title: "Online Learning Specialist",
        description:
            "Develop and deliver effective online courses and learning materials for college students",
        icon: faLaptopCode,
        requiredSkills: [
            { name: "Learning Management Systems", minimumProficiency: 80 },
            { name: "Instructional Design", minimumProficiency: 85 },
            { name: "Multimedia Production", minimumProficiency: 70 },
            { name: "Student Engagement", minimumProficiency: 75 },
        ],
        color: "red",
    },
    {
        id: "project_based",
        title: "Project-Based Learning",
        description:
            "Implement project-based learning methods in technical education",
        icon: faProjectDiagram,
        requiredSkills: [
            { name: "Project Management", minimumProficiency: 80 },
            { name: "Group Facilitation", minimumProficiency: 85 },
            { name: "Assessment Design", minimumProficiency: 75 },
            { name: "Industry Collaboration", minimumProficiency: 70 },
        ],
        color: "indigo",
    },
];

const DevelopmentGoals = () => {
    const { user, userDetails } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employeeData, setEmployeeData] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState("overview");
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);
    const [skillGaps, setSkillGaps] = useState([]);
    const [recommendations, setRecommendations] = useState(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // Persist current state to localStorage
    const saveStateToLocalStorage = useCallback(() => {
        if (user && userDetails?.universityId) {
            const stateToSave = {
                activeSection,
                selectedSpecializations,
                lastVisited: new Date().toISOString(),
            };
            localStorage.setItem(
                `unitech_devgoals_state_${userDetails.universityId}`,
                JSON.stringify(stateToSave)
            );
        }
    }, [activeSection, selectedSpecializations, user, userDetails]);

    // Load saved state from localStorage
    useEffect(() => {
        if (user && userDetails?.universityId) {
            const savedState = localStorage.getItem(
                `unitech_devgoals_state_${userDetails.universityId}`
            );

            if (savedState) {
                try {
                    const parsedState = JSON.parse(savedState);

                    // Only restore state if it's recent (within 24 hours)
                    const lastVisited = new Date(parsedState.lastVisited);
                    const now = new Date();
                    const hoursSinceLastVisit =
                        (now - lastVisited) / (1000 * 60 * 60);

                    if (hoursSinceLastVisit < 24) {
                        if (parsedState.activeSection) {
                            setActiveSection(parsedState.activeSection);
                        }

                        // We'll load specializations from the database rather than localStorage
                        // as they need to be synced across devices
                    }
                } catch (err) {
                    console.error("Error parsing saved state:", err);
                }
            }
        }
    }, [user, userDetails]);

    // Save state when component unmounts or when state changes
    useEffect(() => {
        saveStateToLocalStorage();

        // Add event listener to save state when user is about to leave
        window.addEventListener("beforeunload", saveStateToLocalStorage);

        return () => {
            window.removeEventListener("beforeunload", saveStateToLocalStorage);
            saveStateToLocalStorage();
        };
    }, [activeSection, selectedSpecializations, saveStateToLocalStorage]);

    // Load employee data and skills
    useEffect(() => {
        const loadData = async () => {
            try {
                if (userDetails && userDetails.universityId) {
                    setLoading(true);

                    // Update page URL in history to ensure it's tracked correctly
                    // This helps when user accesses the page directly (not through navigation)
                    const url = new URL(window.location.href);
                    if (
                        url.pathname === "/employee/development-goals" &&
                        window.history.state === null
                    ) {
                        window.history.replaceState(
                            { key: `employee-devgoals-${Date.now()}` },
                            "Development Goals",
                            url.pathname
                        );
                    }

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

                            // If employee has saved teaching specializations, load them
                            if (empData.data.teachingSpecializations) {
                                setSelectedSpecializations(
                                    empData.data.teachingSpecializations
                                );

                                // Calculate skill gaps based on selected specializations
                                const gaps = calculateSkillGaps(
                                    skillsData.skills,
                                    empData.data.teachingSpecializations
                                );
                                setSkillGaps(gaps);
                            }

                            // Fetch recommendations from API
                            if (skillsData.skills.length > 0) {
                                fetchRecommendations(skillsData.skills);
                            }
                        } else {
                            setError(
                                "Failed to load employee skills: " +
                                    skillsData.message
                            );
                        }
                    } else {
                        setError(
                            "Failed to load employee data: " + empData.message
                        );
                    }
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError("An error occurred while loading data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, userDetails]);

    // Function to fetch recommendations from API
    const fetchRecommendations = useCallback(async (skillsData) => {
        try {
            setLoadingRecommendations(true);

            // Format skills as needed by the API
            const formattedSkills = skillsData.map((skill) => ({
                name: skill.name,
                proficiency: skill.proficiency,
                isCertified: skill.isCertified || false,
            }));

            // Call the recommendation API
            const result = await getTeachingRecommendations(formattedSkills);

            if (result.success && result.recommendations) {
                console.log(
                    "Received teaching recommendations:",
                    result.recommendations
                );

                // Process the API response based on structure
                if (Array.isArray(result.recommendations)) {
                    // Handle array format
                    setRecommendations({
                        recommendations: result.recommendations,
                        user_skills: formattedSkills,
                    });
                } else if (result.recommendations.recommendations) {
                    // Handle the case where API returns {recommendations: [...], user_skills: [...]}
                    setRecommendations(result.recommendations);
                } else {
                    // Fallback for other formats
                    const processedRecs = {
                        recommendations:
                            result.recommendations.specializations ||
                            result.recommendations.specialization_cards ||
                            result.recommendations,
                        user_skills: formattedSkills,
                    };
                    setRecommendations(processedRecs);
                }
            } else {
                console.error("Failed to get recommendations:", result.message);
                toast.error("Failed to load recommendations");
            }
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            toast.error("Error loading recommendations");
        } finally {
            setLoadingRecommendations(false);
        }
    }, []);

    // Manually refresh recommendations
    const handleRefreshRecommendations = async () => {
        if (skills.length > 0) {
            await fetchRecommendations(skills);
            toast.success("Recommendations refreshed");
        } else {
            toast.error("No skills available to generate recommendations");
        }
    };

    // Calculate skill gaps between employee skills and required skills for specializations
    const calculateSkillGaps = (employeeSkills, specializations) => {
        const gaps = [];

        if (!employeeSkills || !specializations || specializations.length === 0)
            return [];

        // For each selected specialization
        specializations.forEach((specializationId) => {
            // Find the specialization data
            const specialization = DEVELOPMENT_SPECIALIZATIONS.find(
                (spec) => spec.id === specializationId
            );

            if (specialization) {
                // For each required skill in the specialization
                specialization.requiredSkills.forEach((requiredSkill) => {
                    // Find the employee's current level for this skill
                    const employeeSkill = employeeSkills.find(
                        (skill) =>
                            skill.name.toLowerCase() ===
                            requiredSkill.name.toLowerCase()
                    );

                    const currentLevel = employeeSkill
                        ? typeof employeeSkill.proficiency === "number"
                            ? employeeSkill.proficiency
                            : parseInt(employeeSkill.proficiency) || 0
                        : 0;

                    // If the employee's level is below the minimum required
                    if (currentLevel < requiredSkill.minimumProficiency) {
                        gaps.push({
                            skill: requiredSkill.name,
                            specialization: specialization.title,
                            currentLevel: currentLevel,
                            requiredLevel: requiredSkill.minimumProficiency,
                            gap:
                                requiredSkill.minimumProficiency - currentLevel,
                        });
                    }
                });
            }
        });

        // Sort gaps by size (largest first)
        return gaps.sort((a, b) => b.gap - a.gap);
    };

    // Toggle a specialization selection
    const toggleSpecialization = async (specializationId) => {
        let updatedSpecializations = [...selectedSpecializations];

        if (updatedSpecializations.includes(specializationId)) {
            // Remove the specialization
            updatedSpecializations = updatedSpecializations.filter(
                (id) => id !== specializationId
            );
        } else {
            // Add the specialization
            updatedSpecializations.push(specializationId);
        }

        setSelectedSpecializations(updatedSpecializations);

        // Calculate new skill gaps
        const newGaps = calculateSkillGaps(skills, updatedSpecializations);
        setSkillGaps(newGaps);

        // Save to employee profile
        if (userDetails?.universityId) {
            try {
                const result = await updateEmployeeProfile(
                    user.uid,
                    userDetails.universityId,
                    { teachingSpecializations: updatedSpecializations }
                );

                if (result.success) {
                    toast.success("Development goals updated successfully");
                } else {
                    toast.error("Failed to update development goals");
                }
            } catch (err) {
                console.error("Error saving development goals:", err);
                toast.error("An error occurred while saving goals");
            }
        }
    };

    // Add this function after the toggleSpecialization function
    const handleAddTrainingNeed = (rec, skill) => {
        // Find the relevant specialization ID based on recommendation data
        let specializationId = rec.id; // First try explicit ID

        if (!specializationId) {
            // If no ID, try to match by specialization name to our predefined specializations
            const specialization = DEVELOPMENT_SPECIALIZATIONS.find(
                (s) =>
                    s.title
                        .toLowerCase()
                        .includes(rec.specialization?.toLowerCase()) ||
                    rec.specialization
                        ?.toLowerCase()
                        .includes(s.title.toLowerCase())
            );

            if (specialization) {
                specializationId = specialization.id;
            } else {
                // Fallback based on recommendation type if no match found
                if (rec.specialization?.toLowerCase().includes("web")) {
                    specializationId = "web_instructor";
                } else if (
                    rec.specialization?.toLowerCase().includes("database")
                ) {
                    specializationId = "db_instructor";
                } else if (
                    rec.specialization?.toLowerCase().includes("machine") ||
                    rec.specialization?.toLowerCase().includes("ai")
                ) {
                    specializationId = "ml_instructor";
                } else if (
                    rec.specialization?.toLowerCase().includes("mobile")
                ) {
                    specializationId = "mobile_instructor";
                } else if (
                    rec.specialization?.toLowerCase().includes("cyber")
                ) {
                    specializationId = "cybersecurity_instructor";
                } else {
                    specializationId = "web_instructor"; // Default fallback
                }
            }
        }

        // If not already selected, add the specialization
        if (!selectedSpecializations.includes(specializationId)) {
            toggleSpecialization(specializationId);
        }

        // Scroll to skill gaps section
        setTimeout(() => {
            const gapSection = document.getElementById(
                "training-needs-section"
            );
            if (gapSection) {
                gapSection.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    // Navigate to skills page
    const handleViewAllSkills = () => {
        navigate("/employee/profile", {
            state: { activeTab: "skills" },
            search: new URLSearchParams({ tab: "skills" }).toString(),
        });
    };

    // Get skill level label
    const getSkillLevel = (proficiency) => {
        if (proficiency >= 90) return "Expert";
        if (proficiency >= 70) return "Advanced";
        if (proficiency >= 50) return "Intermediate";
        if (proficiency >= 30) return "Basic";
        return "Novice";
    };

    if (loading) {
        return (
            <div className="min-h-[400px] border border-gray-200 rounded-lg flex items-center justify-center">
                <EmployeePageLoader
                    isLoading={true}
                    message="Loading development goals..."
                    contentOnly={true}
                    fullscreen={false}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="text-red-500"
                            />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Development Goals</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={handleRefreshRecommendations}
                        className="flex items-center px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
                        disabled={loadingRecommendations}
                    >
                        <FontAwesomeIcon
                            icon={loadingRecommendations ? faSync : faLightbulb}
                            className={`mr-2 ${
                                loadingRecommendations ? "animate-spin" : ""
                            }`}
                        />
                        {loadingRecommendations
                            ? "Refreshing..."
                            : "Refresh Recommendations"}
                    </button>
                    <button
                        onClick={handleViewAllSkills}
                        className="flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FontAwesomeIcon
                            icon={faGraduationCap}
                            className="mr-2"
                        />
                        View My Skills
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
                {/* API Recommendations Section */}
                {recommendations && (
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FontAwesomeIcon
                                icon={faLightbulb}
                                className="text-yellow-500 mr-2"
                            />
                            Recommended Specializations
                        </h2>

                        {loadingRecommendations ? (
                            <div className="flex justify-center items-center p-8">
                                <FontAwesomeIcon
                                    icon={faSync}
                                    className="text-blue-500 text-xl animate-spin mr-3"
                                />
                                <span className="text-gray-600">
                                    Loading recommendations...
                                </span>
                            </div>
                        ) : recommendations.recommendations &&
                          recommendations.recommendations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendations.recommendations
                                    .slice(0, 4)
                                    .map((rec, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50"
                                        >
                                            <div className="flex items-start mb-3">
                                                <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                    <FontAwesomeIcon
                                                        icon={
                                                            rec.icon === "code"
                                                                ? faCode
                                                                : rec.icon ===
                                                                  "database"
                                                                ? faDatabase
                                                                : rec.icon ===
                                                                  "robot"
                                                                ? faRobot
                                                                : rec.icon ===
                                                                  "mobile"
                                                                ? faMobile
                                                                : rec.icon ===
                                                                  "cloud"
                                                                ? faCloud
                                                                : rec.icon ===
                                                                  "megaphone"
                                                                ? faBriefcase
                                                                : faGraduationCap
                                                        }
                                                        className="text-blue-600"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-800">
                                                        {rec.specialization}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {rec.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Match percentage */}
                                            <div className="mt-2 mb-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                        <div
                                                            className="bg-purple-600 h-2.5 rounded-full"
                                                            style={{
                                                                width: `${Math.round(
                                                                    rec.matching_score ||
                                                                        0
                                                                )}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                                                        {Math.round(
                                                            rec.matching_score ||
                                                                0
                                                        )}
                                                        % Match
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Matching skills */}
                                            {rec.matching_skills &&
                                                rec.matching_skills.length >
                                                    0 && (
                                                    <div className="mb-3">
                                                        <div className="text-xs text-gray-500 mb-1 flex items-center">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faCheckCircle
                                                                }
                                                                className="text-green-500 mr-1"
                                                            />
                                                            Your matching
                                                            skills:
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {rec.matching_skills.map(
                                                                (
                                                                    skill,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                    >
                                                                        {typeof skill ===
                                                                        "string"
                                                                            ? skill
                                                                            : skill.name ||
                                                                              skill}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Missing skills */}
                                            {rec.missing_skills &&
                                                rec.missing_skills.length >
                                                    0 && (
                                                    <div className="mb-3">
                                                        <div className="text-xs text-gray-500 mb-1 flex items-center">
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faLightbulb
                                                                }
                                                                className="text-yellow-500 mr-1"
                                                            />
                                                            Skills to develop:
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {rec.missing_skills.map(
                                                                (
                                                                    skill,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        onClick={() =>
                                                                            handleAddTrainingNeed(
                                                                                rec,
                                                                                skill
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors"
                                                                    >
                                                                        {typeof skill ===
                                                                        "string"
                                                                            ? skill
                                                                            : skill.name ||
                                                                              skill}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Recommended Courses - New Section */}
                                            {rec.recommended_courses &&
                                                rec.recommended_courses.length >
                                                    0 && (
                                                    <div className="mt-2">
                                                        <div
                                                            className="text-xs mb-2 font-medium text-gray-500 flex items-center cursor-pointer"
                                                            onClick={() => {
                                                                // Toggle visibility of courses if needed
                                                                const coursesList =
                                                                    document.getElementById(
                                                                        `courses-list-${index}`
                                                                    );
                                                                if (
                                                                    coursesList
                                                                ) {
                                                                    coursesList.classList.toggle(
                                                                        "hidden"
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faBook}
                                                                className="text-blue-500 mr-1"
                                                            />
                                                            Recommended Courses:
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faArrowRight
                                                                }
                                                                className="ml-1 text-gray-400"
                                                                size="xs"
                                                            />
                                                        </div>
                                                        <div
                                                            id={`courses-list-${index}`}
                                                            className="pl-1 text-sm"
                                                        >
                                                            {rec.recommended_courses
                                                                .slice(0, 2)
                                                                .map(
                                                                    (
                                                                        course,
                                                                        courseIdx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                courseIdx
                                                                            }
                                                                            className="mb-1 pb-1 border-b border-gray-100 last:border-b-0"
                                                                        >
                                                                            <div className="font-medium text-gray-700 flex items-center">
                                                                                <span className="mr-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                                                                    {
                                                                                        course.code
                                                                                    }
                                                                                </span>
                                                                                {
                                                                                    course.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-gray-600">
                                                                                {
                                                                                    course.description
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                <span className="capitalize">
                                                                                    {
                                                                                        course.level
                                                                                    }
                                                                                </span>
                                                                                {course.year &&
                                                                                    course.semester && (
                                                                                        <span>
                                                                                            {" "}
                                                                                            •
                                                                                            Year{" "}
                                                                                            {
                                                                                                course.year
                                                                                            }

                                                                                            ,
                                                                                            Sem{" "}
                                                                                            {
                                                                                                course.semester
                                                                                            }
                                                                                        </span>
                                                                                    )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            {rec
                                                                .recommended_courses
                                                                .length > 2 && (
                                                                <div className="text-xs text-blue-600 cursor-pointer hover:underline mt-1">
                                                                    +{" "}
                                                                    {rec
                                                                        .recommended_courses
                                                                        .length -
                                                                        2}{" "}
                                                                    more courses
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <p className="text-gray-600">
                                    No recommendations available. Try refreshing
                                    or add more skills to your profile.
                                </p>
                            </div>
                        )}

                        {recommendations.user_skills && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="font-medium text-gray-800 mb-2">
                                    Your Current Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.user_skills.map(
                                        (skill, index) => (
                                            <span
                                                key={index}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                    skill.isCertified
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                            >
                                                {skill.name}
                                                <span className="ml-1 text-xs opacity-75">
                                                    ({skill.proficiency})
                                                </span>
                                                {skill.isCertified && (
                                                    <FontAwesomeIcon
                                                        icon={faCheckCircle}
                                                        className="ml-1 text-green-600"
                                                    />
                                                )}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Specializations Selection */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon
                            icon={faUserGraduate}
                            className="text-purple-500 mr-2"
                        />
                        Development Specializations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DEVELOPMENT_SPECIALIZATIONS.map((specialization) => (
                            <div
                                key={specialization.id}
                                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                                    selectedSpecializations.includes(
                                        specialization.id
                                    )
                                        ? `bg-${specialization.color}-50 border-${specialization.color}-300`
                                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                    toggleSpecialization(specialization.id)
                                }
                            >
                                <div className="flex items-start">
                                    <div
                                        className={`bg-${specialization.color}-100 p-3 rounded-full mr-3`}
                                    >
                                        <FontAwesomeIcon
                                            icon={specialization.icon}
                                            className={`text-${specialization.color}-600 text-xl`}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <h3 className="font-medium text-gray-800">
                                                {specialization.title}
                                            </h3>
                                            {selectedSpecializations.includes(
                                                specialization.id
                                            ) && (
                                                <FontAwesomeIcon
                                                    icon={faCheckCircle}
                                                    className="ml-2 text-green-500"
                                                />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {specialization.description}
                                        </p>
                                        <div className="mt-3">
                                            <div className="text-xs text-gray-500 mb-1">
                                                Required skills:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {specialization.requiredSkills
                                                    .slice(0, 3)
                                                    .map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${specialization.color}-100 text-${specialization.color}-800`}
                                                        >
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                {specialization.requiredSkills
                                                    .length > 3 && (
                                                    <span className="text-xs text-gray-500">
                                                        +
                                                        {specialization
                                                            .requiredSkills
                                                            .length - 3}{" "}
                                                        more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Training Needs Section - Only show if specializations are selected */}
                {selectedSpecializations.length > 0 && (
                    <div
                        id="training-needs-section"
                        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FontAwesomeIcon
                                icon={faLightbulb}
                                className="text-yellow-500 mr-2"
                            />
                            Training Needs
                        </h2>

                        {skillGaps.length > 0 ? (
                            <div>
                                <p className="mb-4 text-gray-600">
                                    Based on your selected development
                                    specializations, here are the skills you
                                    need to develop to meet the requirements:
                                </p>
                                <div className="space-y-4">
                                    {skillGaps.map((gap, index) => (
                                        <div
                                            key={index}
                                            className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <span className="font-medium text-gray-800">
                                                        {gap.skill}
                                                    </span>
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        for {gap.specialization}
                                                    </span>
                                                </div>
                                                <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                                    Gap: {gap.gap}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                                <div
                                                    className="bg-yellow-400 h-2.5 rounded-full"
                                                    style={{
                                                        width: `${gap.currentLevel}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>
                                                    Current: {gap.currentLevel}%
                                                </span>
                                                <span>
                                                    Required:{" "}
                                                    {gap.requiredLevel}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon
                                            icon={faInfoCircle}
                                            className="text-blue-500 mt-1 mr-3"
                                        />
                                        <div>
                                            <h3 className="font-medium text-blue-700">
                                                Next Steps
                                            </h3>
                                            <p className="text-blue-600 text-sm mt-1">
                                                Consider requesting training or
                                                professional development
                                                opportunities to address these
                                                training needs. Your department
                                                can help arrange appropriate
                                                training sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
                                    <FontAwesomeIcon
                                        icon={faCheckCircle}
                                        className="text-green-600 text-2xl"
                                    />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                    Good news!
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Your current skills already meet all the
                                    requirements for your selected development
                                    specializations. Keep up the good work!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevelopmentGoals;

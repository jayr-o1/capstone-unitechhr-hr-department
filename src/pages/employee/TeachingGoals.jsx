import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import {
    getEmployeeSkills,
    getEmployeeData,
    updateEmployeeProfile,
} from "../../services/employeeService";
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
} from "@fortawesome/free-solid-svg-icons";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";
import { toast } from "react-hot-toast";

// Mock data for teaching specializations
const TEACHING_SPECIALIZATIONS = [
    {
        id: "db_instructor",
        title: "Database Instructor",
        description:
            "Specialize in teaching database concepts, design, and management systems",
        icon: faDatabase,
        requiredSkills: [
            { name: "SQL", minimumProficiency: 80 },
            { name: "Database Design", minimumProficiency: 75 },
            { name: "NoSQL", minimumProficiency: 60 },
            { name: "Data Modeling", minimumProficiency: 70 },
        ],
        color: "blue",
    },
    {
        id: "ml_instructor",
        title: "Machine Learning Instructor",
        description:
            "Specialize in teaching machine learning algorithms, models, and applications",
        icon: faRobot,
        requiredSkills: [
            { name: "Python", minimumProficiency: 80 },
            { name: "Machine Learning", minimumProficiency: 85 },
            { name: "Data Science", minimumProficiency: 75 },
            { name: "Deep Learning", minimumProficiency: 70 },
            { name: "Statistical Analysis", minimumProficiency: 65 },
        ],
        color: "purple",
    },
    {
        id: "web_instructor",
        title: "Web Development Instructor",
        description:
            "Specialize in teaching modern web development technologies and frameworks",
        icon: faCode,
        requiredSkills: [
            { name: "HTML/CSS", minimumProficiency: 85 },
            { name: "JavaScript", minimumProficiency: 80 },
            { name: "React", minimumProficiency: 75 },
            { name: "Node.js", minimumProficiency: 70 },
            { name: "Web Security", minimumProficiency: 65 },
        ],
        color: "green",
    },
    {
        id: "mobile_instructor",
        title: "Mobile Development Instructor",
        description:
            "Specialize in teaching mobile application development for various platforms",
        icon: faMobile,
        requiredSkills: [
            { name: "Java", minimumProficiency: 75 },
            { name: "Swift", minimumProficiency: 75 },
            { name: "React Native", minimumProficiency: 80 },
            { name: "Mobile UI Design", minimumProficiency: 70 },
            { name: "App Deployment", minimumProficiency: 65 },
        ],
        color: "orange",
    },
    {
        id: "cloud_instructor",
        title: "Cloud Computing Instructor",
        description:
            "Specialize in teaching cloud platforms, services, and architecture",
        icon: faCloud,
        requiredSkills: [
            { name: "AWS", minimumProficiency: 80 },
            { name: "Azure", minimumProficiency: 70 },
            { name: "Docker", minimumProficiency: 75 },
            { name: "Kubernetes", minimumProficiency: 70 },
            { name: "Cloud Security", minimumProficiency: 65 },
        ],
        color: "cyan",
    },
    {
        id: "network_instructor",
        title: "Networking Instructor",
        description:
            "Specialize in teaching computer networking concepts and technologies",
        icon: faNetworkWired,
        requiredSkills: [
            { name: "Network Protocols", minimumProficiency: 85 },
            { name: "Network Security", minimumProficiency: 80 },
            { name: "Routing and Switching", minimumProficiency: 75 },
            { name: "Wireless Networks", minimumProficiency: 70 },
        ],
        color: "indigo",
    },
    {
        id: "software_instructor",
        title: "Software Engineering Instructor",
        description:
            "Specialize in teaching software engineering principles and practices",
        icon: faProjectDiagram,
        requiredSkills: [
            { name: "Object-Oriented Programming", minimumProficiency: 85 },
            { name: "Software Design Patterns", minimumProficiency: 80 },
            { name: "Testing Methodologies", minimumProficiency: 75 },
            { name: "Version Control", minimumProficiency: 80 },
            { name: "Agile Development", minimumProficiency: 70 },
        ],
        color: "red",
    },
    {
        id: "cybersecurity_instructor",
        title: "Cybersecurity Instructor",
        description:
            "Specialize in teaching cybersecurity concepts, threats, and defenses",
        icon: faServer,
        requiredSkills: [
            { name: "Network Security", minimumProficiency: 85 },
            { name: "Ethical Hacking", minimumProficiency: 80 },
            { name: "Security Protocols", minimumProficiency: 75 },
            { name: "Cryptography", minimumProficiency: 70 },
            { name: "Security Auditing", minimumProficiency: 65 },
        ],
        color: "yellow",
    },
];

const TeachingGoals = () => {
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

    // Load employee data and skills
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
                        }
                    } else {
                        setError("Failed to load employee data");
                    }

                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading teaching goals data:", err);
                setError("An error occurred while loading data");
                setLoading(false);
            }
        };

        loadData();
    }, [user, userDetails]);

    // Update URL when section changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        if (activeSection) {
            params.set("section", activeSection);
        }

        navigate(`${location.pathname}?${params.toString()}`, {
            replace: true,
        });
    }, [activeSection, location.pathname, navigate]);

    // Calculate skill gaps based on selected specializations and current skills
    const calculateSkillGaps = (employeeSkills, specializations) => {
        if (
            !employeeSkills ||
            !specializations ||
            specializations.length === 0
        ) {
            return [];
        }

        const employeeSkillsMap = new Map();
        employeeSkills.forEach((skill) => {
            // Handle both string and numeric proficiency values
            let proficiencyValue = 0;

            if (typeof skill.proficiency === "string") {
                proficiencyValue =
                    skill.proficiency === "Beginner"
                        ? 25
                        : skill.proficiency === "Intermediate"
                        ? 50
                        : skill.proficiency === "Advanced"
                        ? 75
                        : skill.proficiency === "Expert"
                        ? 100
                        : 25;
            } else if (typeof skill.proficiency === "number") {
                proficiencyValue = skill.proficiency;
            }

            employeeSkillsMap.set(skill.name.toLowerCase(), proficiencyValue);
        });

        const gaps = [];

        // Find the selected specialization objects
        const selectedSpecObjects = specializations
            .map((specId) =>
                TEACHING_SPECIALIZATIONS.find((spec) => spec.id === specId)
            )
            .filter(Boolean);

        // For each selected specialization, check required skills
        selectedSpecObjects.forEach((specialization) => {
            specialization.requiredSkills.forEach((requiredSkill) => {
                const employeeSkillLevel =
                    employeeSkillsMap.get(requiredSkill.name.toLowerCase()) ||
                    0;

                if (employeeSkillLevel < requiredSkill.minimumProficiency) {
                    gaps.push({
                        skill: requiredSkill.name,
                        currentLevel: employeeSkillLevel,
                        requiredLevel: requiredSkill.minimumProficiency,
                        gap:
                            requiredSkill.minimumProficiency -
                            employeeSkillLevel,
                        specialization: specialization.title,
                    });
                }
            });
        });

        // Sort by gap size (largest first)
        return gaps.sort((a, b) => b.gap - a.gap);
    };

    // Toggle specialization selection
    const toggleSpecialization = async (specializationId) => {
        let updatedSpecializations;

        if (selectedSpecializations.includes(specializationId)) {
            updatedSpecializations = selectedSpecializations.filter(
                (id) => id !== specializationId
            );
        } else {
            updatedSpecializations = [
                ...selectedSpecializations,
                specializationId,
            ];
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
                    toast.success("Teaching goals updated successfully");
                } else {
                    toast.error("Failed to update teaching goals");
                }
            } catch (err) {
                console.error("Error saving teaching goals:", err);
                toast.error("An error occurred while saving goals");
            }
        }
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
            <EmployeePageLoader
                isLoading={true}
                message="Loading teaching goals..."
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

    return (
        <div className="pb-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Teaching Goals</h1>
                <button
                    onClick={handleViewAllSkills}
                    className="flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                    <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                    View My Skills
                </button>
            </div>

            {/* Introduction Section */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
                <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <FontAwesomeIcon
                            icon={faChalkboardTeacher}
                            className="text-blue-600 text-xl"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-2">
                            Teaching Specialization Goals
                        </h2>
                        <p className="text-gray-600">
                            Select the teaching specializations you're
                            interested in pursuing. Based on your selections,
                            we'll identify skill gaps that need to be addressed
                            to help you excel in these teaching areas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
                {/* Specializations Selection */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon
                            icon={faUserGraduate}
                            className="text-purple-500 mr-2"
                        />
                        Teaching Specializations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TEACHING_SPECIALIZATIONS.map((specialization) => (
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

                {/* Skill Gaps Section - Only show if specializations are selected */}
                {selectedSpecializations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FontAwesomeIcon
                                icon={faLightbulb}
                                className="text-yellow-500 mr-2"
                            />
                            Skill Gaps Analysis
                        </h2>

                        {skillGaps.length > 0 ? (
                            <div>
                                <p className="mb-4 text-gray-600">
                                    Based on your selected teaching
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
                                                skill gaps. Your department can
                                                help arrange appropriate
                                                training sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                                <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    className="text-green-500 text-4xl mb-2"
                                />
                                <p className="text-green-700 font-medium">
                                    Congratulations! You have all the required
                                    skills for your selected teaching
                                    specializations.
                                </p>
                                <p className="text-green-600 text-sm mt-2">
                                    Continue developing your expertise to become
                                    an even more effective instructor.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Current Skills Overview */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon
                            icon={faGraduationCap}
                            className="text-green-500 mr-2"
                        />
                        Current Skills Overview
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
                                            {typeof skill.proficiency ===
                                            "string"
                                                ? skill.proficiency
                                                : getSkillLevel(
                                                      skill.proficiency
                                                  )}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-green-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    typeof skill.proficiency ===
                                                    "number"
                                                        ? skill.proficiency
                                                        : skill.proficiency ===
                                                          "Beginner"
                                                        ? 25
                                                        : skill.proficiency ===
                                                          "Intermediate"
                                                        ? 50
                                                        : skill.proficiency ===
                                                          "Advanced"
                                                        ? 75
                                                        : skill.proficiency ===
                                                          "Expert"
                                                        ? 100
                                                        : 0
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 flex justify-center">
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
            </div>
        </div>
    );
};

export default TeachingGoals;

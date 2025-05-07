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
                        ? employeeSkill.proficiency
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
                    toast.success(
                        "Teaching development goals updated successfully"
                    );
                } else {
                    toast.error("Failed to update teaching development goals");
                }
            } catch (err) {
                console.error("Error saving teaching development goals:", err);
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
            <div className="min-h-[400px] border border-gray-200 rounded-lg flex items-center justify-center">
                <EmployeePageLoader
                    isLoading={true}
                    message="Loading teaching development goals..."
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Teaching Development Goals
                </h1>
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
                            Professional Teaching Development Goals
                        </h2>
                        <p className="text-gray-600">
                            Select the teaching specializations you're
                            interested in pursuing. Based on your selections,
                            we'll identify skill gaps that need to be addressed
                            to help you excel in educating college students.
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
                        Development Teaching Specializations
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
                                                skill gaps. Your department can
                                                help arrange appropriate
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

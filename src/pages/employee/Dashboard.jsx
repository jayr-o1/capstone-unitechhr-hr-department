import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import {
    getEmployeeData,
    getEmployeeSkills,
    getCareerPaths,
} from "../../services/employeeService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBuilding,
    faIdCard,
    faGraduationCap,
    faClipboardList,
    faChartLine,
    faArrowRight,
    faIdBadge,
    faBriefcase,
    faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";

const EmployeeDashboard = () => {
    const { user, userDetails, university } = useAuth();
    const [employeeData, setEmployeeData] = useState(null);
    const [skills, setSkills] = useState([]);
    const [careerPaths, setCareerPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState("overview");
    const navigate = useNavigate();
    const location = useLocation();

    // Check for section in URL query parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sectionParam = params.get("section");

        if (
            sectionParam &&
            ["overview", "career", "skills", "documents"].includes(sectionParam)
        ) {
            setActiveSection(sectionParam);
        }
    }, [location.search]);

    // Update URL when section changes
    useEffect(() => {
        if (activeSection) {
            const params = new URLSearchParams(location.search);
            params.set("section", activeSection);
            navigate(`${location.pathname}?${params.toString()}`, {
                replace: true,
            });
        }
    }, [activeSection]);

    // Debug log for component mount
    useEffect(() => {
        console.log("EmployeeDashboard mounted with:", {
            user: user ? "exists" : "null",
            userDetails: userDetails ? "exists" : "null",
            university: university ? "exists" : "null",
        });

        if (user) {
            console.log("User properties:", {
                uid: user.uid,
                employeeId: user.employeeId,
                universityId: user.universityId || userDetails?.universityId,
                isEmployee: user.isEmployee,
            });
        }

        if (userDetails) {
            console.log("UserDetails properties:", {
                role: userDetails.role,
                universityId: userDetails.universityId,
                name: userDetails.name,
                position: userDetails.position,
                department: userDetails.department,
            });
        }
    }, [user, userDetails, university]);

    useEffect(() => {
        const loadEmployeeData = async () => {
            try {
                // If we have userDetails directly from the AuthContext (for custom employee login)
                if (userDetails && user?.isEmployee) {
                    console.log(
                        "Using userDetails directly from AuthContext for employee",
                        userDetails.name || user.employeeId
                    );

                    // Use the userDetails directly as our employee data
                    setEmployeeData({
                        ...userDetails,
                        employeeId: user.employeeId,
                        name: userDetails.name || user.displayName,
                        position: userDetails.position || "Employee",
                        department: userDetails.department || "General",
                    });

                    setLoading(false);

                    // Only fetch skills and career paths if we have departmentId
                    if (userDetails.department) {
                        try {
                            // Try fetching skills
                            const skillsData = await getEmployeeSkills(
                                user.uid,
                                userDetails.universityId
                            );
                            if (skillsData.success) {
                                setSkills(skillsData.skills);
                            }

                            // Try fetching career paths
                            const careerPathsData = await getCareerPaths(
                                userDetails.universityId,
                                userDetails.department
                            );
                            if (careerPathsData.success) {
                                setCareerPaths(careerPathsData.careerPaths);
                            }
                        } catch (err) {
                            console.warn(
                                "Error fetching supplementary data:",
                                err
                            );
                            // Don't set error - we still have the basic data
                        }
                    }

                    return; // Exit early, we already have the data
                }

                // Original logic for firebase auth employees
                if (userDetails && userDetails.universityId) {
                    setLoading(true);

                    // Fetch employee data
                    const empData = await getEmployeeData(
                        user.uid,
                        userDetails.universityId
                    );
                    console.log("Employee data fetch result:", empData);

                    if (empData.success) {
                        setEmployeeData(empData.data);
                    } else {
                        console.error(
                            "Failed to load employee data:",
                            empData.message
                        );
                        setError("Failed to load employee data");
                        toast.error(
                            "Could not load your employee data. Please try again later."
                        );
                    }

                    // Fetch employee skills
                    const skillsData = await getEmployeeSkills(
                        user.uid,
                        userDetails.universityId
                    );
                    if (skillsData.success) {
                        setSkills(skillsData.skills);
                    }

                    // Fetch career paths if department is available
                    if (empData.success && empData.data.department) {
                        const careerPathsData = await getCareerPaths(
                            userDetails.universityId,
                            empData.data.department
                        );
                        if (careerPathsData.success) {
                            setCareerPaths(careerPathsData.careerPaths);
                        }
                    }

                    setLoading(false);
                } else {
                    console.error("Missing user details or university ID");
                    setError(
                        "Missing user information. Please try logging in again."
                    );
                    setLoading(false);
                    toast.error(
                        "Missing user information. Please try logging in again."
                    );
                }
            } catch (err) {
                console.error("Error loading employee data:", err);
                setError("An error occurred while loading data");
                setLoading(false);
                toast.error("An error occurred. Please try again later.");
            }
        };

        loadEmployeeData();
    }, [user, userDetails]);

    // Navigation handlers
    const handleViewAllSkills = () => {
        navigate(
            "/employee/profile",
            { state: { activeTab: "skills" } },
            {
                search: new URLSearchParams({ tab: "skills" }).toString(),
            }
        );
    };

    const handleViewPersonalInfo = () => {
        navigate(
            "/employee/profile",
            { state: { activeTab: "personal" } },
            {
                search: new URLSearchParams({ tab: "personal" }).toString(),
            }
        );
    };

    const handleViewCareerDetails = () => {
        navigate("/employee/development-goals");
    };

    const handleViewAllActivities = () => {
        // This could navigate to a dedicated activities page in the future
        toast.info("Activities page coming soon!");
    };

    const handleViewAllDocuments = () => {
        navigate(
            "/employee/profile",
            { state: { activeTab: "documents" } },
            {
                search: new URLSearchParams({ tab: "documents" }).toString(),
            }
        );
    };

    if (loading) {
        // Check if this is a page refresh
        const isPageRefresh =
            sessionStorage.getItem("isPageRefresh") === "true";
        return (
            <EmployeePageLoader
                isLoading={true}
                fullscreen={isPageRefresh}
                message="Loading your dashboard..."
            />
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6 text-gray-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16 text-gray-400 mb-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4.5a9 9 0 1112.765 0M9.75 9h4.5m-2.25-3v6"
                    />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700">
                    Error Loading Dashboard
                </h2>
                <p className="text-gray-500 mt-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    const displayName =
        userDetails?.name ||
        employeeData?.name ||
        user?.displayName ||
        userDetails?.displayName ||
        userDetails?.fullName ||
        "Employee";
    const position = employeeData?.position || userDetails?.position || "Staff";
    const universityName =
        university?.name || userDetails?.universityName || "Your University";
    const department =
        employeeData?.department || userDetails?.department || "Not Assigned";
    const employeeIdDisplay =
        employeeData?.employeeId || user?.employeeId || "N/A";

    return (
        <div className="space-y-6">
            {/* Welcome Header Card - Restored */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 md:p-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                    Welcome, {displayName}
                </h1>
                <p className="opacity-90 text-sm md:text-lg text-white">
                    {universityName} - {position}
                </p>
            </div>

            {/* Employee Info Section - In a single row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Employee ID Card */}
                <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <FontAwesomeIcon
                            icon={faIdCard}
                            className="text-blue-600 text-lg"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Employee ID</p>
                        <p className="font-medium">{employeeIdDisplay}</p>
                    </div>
                </div>

                {/* Department Card */}
                <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                        <FontAwesomeIcon
                            icon={faBuilding}
                            className="text-indigo-600 text-lg"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="font-medium">{department}</p>
                    </div>
                </div>

                {/* Position Card */}
                <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FontAwesomeIcon
                            icon={faBriefcase}
                            className="text-green-600 text-lg"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Position</p>
                        <p className="font-medium">
                            {employeeData?.position || "Employee"}
                        </p>
                    </div>
                </div>

                {/* Skills Card */}
                <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FontAwesomeIcon
                            icon={faGraduationCap}
                            className="text-green-600 text-lg"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Skills Acquired</p>
                        <p className="font-medium">{skills?.length || 0}</p>
                    </div>
                </div>

                {/* Documents Card */}
                <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <FontAwesomeIcon
                            icon={faClipboardList}
                            className="text-purple-600 text-lg"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Documents</p>
                        <p className="font-medium">
                            {employeeData?.documents?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Skills & Career Progression */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Skills Overview */}
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800">
                            My Skills
                        </h2>
                        <button
                            onClick={handleViewAllSkills}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
                        >
                            View All
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="ml-1 text-xs"
                            />
                        </button>
                    </div>

                    {skills.length > 0 ? (
                        <div className="space-y-3">
                            {skills.slice(0, 4).map((skill) => (
                                <div
                                    key={skill.id}
                                    className="flex items-center"
                                >
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    skill.proficiency || 0
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="ml-3 text-gray-600 min-w-[80px] text-sm truncate">
                                        {skill.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-gray-500 text-sm">
                                No skills have been added to your profile yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Career Path */}
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800">
                            Teaching Development Goals
                        </h2>
                        <button
                            onClick={handleViewCareerDetails}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
                        >
                            View Details
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="ml-1 text-xs"
                            />
                        </button>
                    </div>

                    {careerPaths.length > 0 ? (
                        <div className="relative">
                            {/* Development Specializations */}
                            <div className="border-l-2 border-blue-500 ml-3 pl-4 space-y-4">
                                <div className="relative">
                                    <div className="absolute -left-6 top-0 bg-blue-500 w-3 h-3 rounded-full"></div>
                                    <h3 className="text-sm md:text-md font-semibold">
                                        Teaching Specializations
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-500">
                                        Select your teaching specializations and
                                        track your pedagogical skill
                                        development.
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-6 top-0 bg-blue-500 w-3 h-3 rounded-full"></div>
                                    <h3 className="text-sm md:text-md font-semibold">
                                        Skill Gap Analysis
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-500">
                                        Identify skills you need to develop to
                                        excel in educating college students.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="text-gray-500 text-sm">
                                Set your teaching development goals to track
                                your professional growth as an educator.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Activities & Notifications */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        Recent Activities
                    </h2>
                    <button
                        onClick={handleViewAllActivities}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
                    >
                        View All
                        <FontAwesomeIcon
                            icon={faArrowRight}
                            className="ml-1 text-xs"
                        />
                    </button>
                </div>

                {/* Activity List */}
                <div className="space-y-3">
                    <div className="flex items-start p-3 rounded-lg bg-gray-50">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                            <FontAwesomeIcon
                                icon={faChalkboardTeacher}
                                className="text-blue-600 text-sm"
                            />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm">
                                Profile Updated
                            </h3>
                            <p className="text-xs text-gray-500">
                                Your employee profile was last updated on{" "}
                                {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start p-3 rounded-lg bg-gray-50">
                        <div className="bg-green-100 p-2 rounded-lg mr-3 flex-shrink-0">
                            <FontAwesomeIcon
                                icon={faGraduationCap}
                                className="text-green-600 text-sm"
                            />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm">
                                Welcome to Your Employee Portal
                            </h3>
                            <p className="text-xs text-gray-500">
                                You can track your teaching development goals,
                                skills development, and more from this
                                dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;

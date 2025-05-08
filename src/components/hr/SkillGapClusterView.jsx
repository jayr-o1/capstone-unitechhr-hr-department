import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faUserGraduate,
    faLightbulb,
    faFilter,
    faSync,
    faChartPie,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthProvider";

const SkillGapClusterView = () => {
    const { userDetails } = useAuth();
    const [skillClusters, setSkillClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredSkill, setFilteredSkill] = useState("");
    const [availableSkills, setAvailableSkills] = useState([]);
    const [viewMode, setViewMode] = useState("clusters"); // 'clusters' or 'skills'

    useEffect(() => {
        fetchEmployeeTrainingNeeds();
    }, [userDetails]);

    const fetchEmployeeTrainingNeeds = async () => {
        try {
            setLoading(true);

            if (!userDetails || !userDetails.universityId) {
                console.error("No university ID available");
                setLoading(false);
                return;
            }

            // Real Firestore implementation
            const employeesRef = collection(
                db,
                "universities",
                userDetails.universityId,
                "employees"
            );
            const employeesSnapshot = await getDocs(employeesRef);

            const employeeData = [];
            const fetchPromises = [];

            employeesSnapshot.forEach((doc) => {
                const employee = { id: doc.id, ...doc.data() };

                // Get training needs for each employee
                const skillGapsRef = collection(
                    db,
                    "universities",
                    userDetails.universityId,
                    "employees",
                    doc.id,
                    "skillGaps"
                );
                const fetchPromise = getDocs(skillGapsRef).then(
                    (gapsSnapshot) => {
                        const gaps = [];
                        gapsSnapshot.forEach((gapDoc) => {
                            gaps.push({ id: gapDoc.id, ...gapDoc.data() });
                        });
                        employee.skillGaps = gaps;
                        employeeData.push(employee);
                    }
                );

                fetchPromises.push(fetchPromise);
            });

            await Promise.all(fetchPromises);
            processTrainingNeeds(employeeData);
        } catch (error) {
            console.error("Error fetching employee training needs:", error);
            // If an error occurs, process with empty data
            processTrainingNeeds([]);
        } finally {
            setLoading(false);
        }
    };

    const processTrainingNeeds = (employees) => {
        // Group employees by training needs
        const skillMap = new Map();
        const allSkills = new Set();

        employees.forEach((employee) => {
            if (employee.skillGaps && employee.skillGaps.length > 0) {
                employee.skillGaps.forEach((gap) => {
                    const skillName = gap.skill;
                    allSkills.add(skillName);

                    if (!skillMap.has(skillName)) {
                        skillMap.set(skillName, {
                            skill: skillName,
                            employeeCount: 0,
                            employees: [],
                            trainingPriority: 0,
                            totalGap: 0,
                            specializations: new Set(), // Track which specializations need this skill
                        });
                    }

                    const skillData = skillMap.get(skillName);
                    skillData.employeeCount++;
                    skillData.employees.push({
                        id: employee.id,
                        name:
                            gap.employeeName ||
                            (employee.firstName && employee.lastName
                                ? employee.firstName + " " + employee.lastName
                                : "Unknown Employee"),
                        department:
                            employee.department || gap.department || "Unknown",
                        gapPercentage: gap.gap,
                        currentLevel: gap.currentLevel,
                        requiredLevel: gap.requiredLevel,
                        specialization: gap.specialization || "General", // Track which specialization this gap is for
                    });

                    if (gap.specialization) {
                        skillData.specializations.add(gap.specialization);
                    }

                    skillData.totalGap += gap.gap;
                });
            }
        });

        // Calculate training priority for each skill
        const clustersArray = [];
        skillMap.forEach((cluster) => {
            // Calculate training priority based on employee count and gap size
            // Scale from 1-10 instead of using percentages
            cluster.trainingPriority = Math.min(
                10,
                Math.round((cluster.employeeCount * 2 + cluster.totalGap / 100) / 2)
            );
            
            // Sort employees by gap size (largest first)
            cluster.employees.sort((a, b) => b.gapPercentage - a.gapPercentage);
            // Convert specializations Set to Array
            cluster.specializationsArray = Array.from(cluster.specializations);
            clustersArray.push(cluster);
        });

        // Sort clusters by employee count (largest first)
        clustersArray.sort((a, b) => b.employeeCount - a.employeeCount);

        setSkillClusters(clustersArray);
        setAvailableSkills(Array.from(allSkills).sort());
    };

    // Empty function that previously generated mock data
    const generateSampleData = () => {
        return [];
    };

    const filterClusters = () => {
        if (!filteredSkill) {
            return skillClusters;
        }
        return skillClusters.filter((cluster) =>
            cluster.skill.toLowerCase().includes(filteredSkill.toLowerCase())
        );
    };

    const getClusterColorClass = (employeeCount) => {
        if (employeeCount >= 10)
            return "bg-red-100 border-red-300 text-red-800";
        if (employeeCount >= 5)
            return "bg-yellow-100 border-yellow-300 text-yellow-800";
        return "bg-blue-100 border-blue-300 text-blue-800";
    };

    const getTrainingPriorityLabel = (priority) => {
        if (priority >= 8) return "High";
        if (priority >= 5) return "Medium";
        return "Low";
    };

    const getTotalEmployeesWithTrainingNeeds = () => {
        const uniqueEmployees = new Set();
        skillClusters.forEach((cluster) => {
            cluster.employees.forEach((emp) => uniqueEmployees.add(emp.id));
        });
        return uniqueEmployees.size;
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 flex justify-center items-center h-96">
                <div className="text-center">
                    <FontAwesomeIcon
                        icon={faSync}
                        spin
                        className="text-blue-500 text-3xl mb-4"
                    />
                    <p className="text-gray-600">Loading training needs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center">
                        <FontAwesomeIcon
                            icon={faUserGraduate}
                            className="text-indigo-500 mr-2"
                        />
                        Employee Training Needs
                    </h2>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewMode("clusters")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                viewMode === "clusters"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            <FontAwesomeIcon icon={faUsers} className="mr-1" />
                            View Clusters
                        </button>
                        <button
                            onClick={() => setViewMode("skills")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                viewMode === "skills"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={faChartPie}
                                className="mr-1"
                            />
                            View by Skills
                        </button>
                        <button
                            onClick={fetchEmployeeTrainingNeeds}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                            <FontAwesomeIcon icon={faSync} className="mr-1" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex-1 flex items-center space-x-2">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">
                                Employees with training needs
                            </div>
                            <div className="text-xl font-semibold">
                                {getTotalEmployeesWithTrainingNeeds()} employees
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center space-x-2">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <FontAwesomeIcon icon={faLightbulb} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">
                                Identified training areas
                            </div>
                            <div className="text-xl font-semibold">
                                {skillClusters.length} skills
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon
                                    icon={faFilter}
                                    className="text-gray-400"
                                />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Filter by skill name"
                                value={filteredSkill}
                                onChange={(e) =>
                                    setFilteredSkill(e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {skillClusters.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
                            <FontAwesomeIcon
                                icon={faLightbulb}
                                className="text-blue-600 text-2xl"
                            />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                            No training needs identified
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Great news! There are currently no training needs
                            identified among employees. Encourage employees to
                            update their skills and development goals to
                            identify areas for improvement.
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === "clusters" ? (
                            <div className="space-y-6">
                                {filterClusters().map((cluster, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg overflow-hidden"
                                    >
                                        <div
                                            className={`px-4 py-3 ${getClusterColorClass(
                                                cluster.employeeCount
                                            )}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium">
                                                    {cluster.skill}
                                                </h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50">
                                                    {cluster.employeeCount}{" "}
                                                    {cluster.employeeCount === 1
                                                        ? "employee"
                                                        : "employees"}
                                                </span>
                                            </div>
                                            <div className="text-sm mt-1">
                                                Training priority: {getTrainingPriorityLabel(cluster.trainingPriority)}
                                            </div>
                                            {cluster.specializationsArray &&
                                                cluster.specializationsArray
                                                    .length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {cluster.specializationsArray.map(
                                                            (spec, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                                >
                                                                    {spec}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        <div className="divide-y divide-gray-200">
                                            {cluster.employees.map(
                                                (employee, empIndex) => (
                                                    <div
                                                        key={empIndex}
                                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {employee.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {
                                                                    employee.department
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center">
                                                                <span className="text-gray-600 text-sm">
                                                                    Current
                                                                </span>
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faArrowRight
                                                                    }
                                                                    className="mx-2 text-gray-400 text-xs"
                                                                />
                                                                <span className="text-green-600 text-sm">
                                                                    Required
                                                                </span>
                                                            </div>
                                                            <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                                                <div
                                                                    className="bg-indigo-600 h-2 rounded-full"
                                                                    style={{
                                                                        width: `${Math.min(100, Math.max(5, employee.currentLevel))}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterClusters().map((cluster, index) => (
                                    <div
                                        key={index}
                                        className={`border rounded-lg p-4 ${getClusterColorClass(
                                            cluster.employeeCount
                                        )}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-medium">
                                                {cluster.skill}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50">
                                                {cluster.employeeCount}{" "}
                                                {cluster.employeeCount === 1
                                                    ? "employee"
                                                    : "employees"}
                                            </span>
                                        </div>

                                        {cluster.specializationsArray &&
                                            cluster.specializationsArray
                                                .length > 0 && (
                                                <div className="mb-3 flex flex-wrap gap-1">
                                                    {cluster.specializationsArray.map(
                                                        (spec, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                            >
                                                                {spec}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        <div className="w-full bg-white bg-opacity-50 rounded-full h-2.5 mb-3">
                                            <div
                                                className="bg-indigo-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${Math.min(95, Math.max(20, cluster.trainingPriority * 10))}%`,
                                                }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between text-sm mb-4">
                                            <span>
                                                Priority: {getTrainingPriorityLabel(cluster.trainingPriority)}
                                            </span>
                                            <span>
                                                {cluster.employeeCount} need training
                                            </span>
                                        </div>

                                        <div className="space-y-1 mt-2">
                                            {cluster.employees
                                                .slice(0, 3)
                                                .map((employee, empIndex) => (
                                                    <div
                                                        key={empIndex}
                                                        className="text-sm truncate"
                                                    >
                                                        • {employee.name} (
                                                        {employee.department})
                                                    </div>
                                                ))}
                                            {cluster.employees.length > 3 && (
                                                <div className="text-sm text-indigo-700">
                                                    +{" "}
                                                    {cluster.employees.length -
                                                        3}{" "}
                                                    more employees
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SkillGapClusterView;

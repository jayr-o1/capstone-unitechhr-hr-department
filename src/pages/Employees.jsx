import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";
import PageLoader from "../components/PageLoader";
import AddEmployeeModal from "../components/Modals/AddEmployeeModal";
import EditCredentialsModal from "../components/Modals/EditCredentialsModal";
import {
    exportEmployees,
    importEmployees,
    getUniversityEmployees,
} from "../services/employeeService";
import { getUserData } from "../services/userService";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faSearch,
    faEllipsisV,
    faUser,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../utils/dateUtils";

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all"); // "all", "newHires", "active", "inactive"
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditCredentialsModalOpen, setIsEditCredentialsModalOpen] =
        useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [universityId, setUniversityId] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const navigate = useNavigate();

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setError("You must be logged in to access this page");
                    setLoading(false);
                    return;
                }

                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (
                    userDataResult.success &&
                    userDataResult.data.universityId
                ) {
                    setUniversityId(userDataResult.data.universityId);
                    console.log(
                        "User belongs to university:",
                        userDataResult.data.universityId
                    );
                } else {
                    setError("You don't have permission to access this page");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setError("Failed to verify your permissions");
                setLoading(false);
            }
        };

        getCurrentUserUniversity();
    }, []);

    // Fetch employees from Firestore
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            if (!universityId) {
                console.error("University ID not available");
                return;
            }

            console.log("Fetching employees for university:", universityId);

            // Use the getUniversityEmployees service to get employees from both collections
            const result = await getUniversityEmployees(universityId);

            if (result.success) {
                console.log(`Found ${result.employees.length} total employees`);
                setEmployees(result.employees);
            } else {
                console.error("Failed to fetch employees:", result.message);
                showErrorAlert("Failed to fetch employees");
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            showErrorAlert("An error occurred while fetching employees");
        } finally {
            setLoading(false);
        }
    };

    // Fetch employees when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchEmployees();
        }
    }, [universityId]);

    // Get unique departments for filter
    const departments = [
        ...new Set(employees.map((emp) => emp.department).filter(Boolean)),
    ];

    // Updated filter logic
    const filteredEmployees = employees.filter((employee) => {
        const statusMatch =
            filter === "all"
                ? true
                : filter === "newHires"
                ? employee.status === "New Hire"
                : filter === "active"
                ? employee.status === "Active"
                : filter === "inactive"
                ? employee.status === "Inactive"
                : true;

        const departmentMatch =
            departmentFilter === "all"
                ? true
                : employee.department === departmentFilter;

        return statusMatch && departmentMatch;
    });

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Handle file import
    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (file && universityId) {
            try {
                const result = await importEmployees(file, universityId);
                if (result.success) {
                    showSuccessAlert(
                        result.message || "Employees imported successfully!"
                    );
                    fetchEmployees(); // Refresh the employee list
                } else {
                    showErrorAlert("Import failed: " + result.error);
                }
            } catch (error) {
                showErrorAlert("Import failed: " + error.message);
            }
        } else if (!universityId) {
            showErrorAlert("Cannot import employees: University ID not found");
        }
    };

    // Handle export
    const handleExport = async () => {
        if (!universityId) {
            showErrorAlert("Cannot export employees: University ID not found");
            return;
        }

        try {
            const result = await exportEmployees(universityId);
            if (result.success) {
                showSuccessAlert("Employees exported successfully!");
            } else {
                showErrorAlert(
                    "Export failed: " + (result.error || result.message)
                );
            }
        } catch (error) {
            showErrorAlert("Export failed: " + error.message);
        }
    };

    // Handle view employee details
    const handleViewEmployee = (employeeId) => {
        // Navigate to employee details page
        navigate(`/employees/${employeeId}`);
    };

    // Handle edit employee credentials
    const handleEditCredentials = (employee) => {
        setCurrentEmployee(employee);
        setIsEditCredentialsModalOpen(true);
    };

    if (loading) {
        // Check if this is a page refresh
        const isPageRefresh =
            sessionStorage.getItem("isPageRefresh") === "true";
        return (
            <PageLoader
                message="Loading employees..."
                contentOnly={!isPageRefresh}
                fullscreen={isPageRefresh}
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
                    Error Loading Employees
                </h2>
                <p className="text-gray-500 mt-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Employee Management
                </h1>
                <div className="flex flex-wrap gap-3">
                    {/* Import Button */}
                    <label className="cursor-pointer px-4 py-2 border border-[#9AADEA] text-[#9AADEA] rounded-lg hover:bg-gray-50 transition">
                        Import Employees
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 border border-[#9AADEA] text-[#9AADEA] rounded-lg hover:bg-gray-50 transition"
                    >
                        Export Employees
                    </button>

                    {/* Add Employee Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                    >
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex items-center gap-4 mb-6">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="statusFilter"
                        className="text-sm font-medium text-gray-700"
                    >
                        Status:
                    </label>
                    <select
                        id="statusFilter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:border-[#9AADEA] focus:ring focus:ring-[#9AADEA] focus:ring-opacity-50"
                    >
                        <option value="all">All Employees</option>
                        <option value="newHires">New Hires</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Department Filter */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="departmentFilter"
                        className="text-sm font-medium text-gray-700"
                    >
                        Department:
                    </label>
                    <select
                        id="departmentFilter"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="form-select rounded-lg border-gray-300 text-gray-700 text-sm focus:border-[#9AADEA] focus:ring focus:ring-[#9AADEA] focus:ring-opacity-50"
                    >
                        <option value="all">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Employee Count */}
                <div className="ml-auto">
                    <p className="text-sm text-gray-600">
                        Showing {filteredEmployees.length}{" "}
                        {filter !== "all" ? `(${filter})` : ""}
                        {departmentFilter !== "all"
                            ? ` in ${departmentFilter}`
                            : ""}{" "}
                        out of {employees.length} employees
                    </p>
                </div>
            </div>

            {/* Employees Section */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
                {filteredEmployees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hire Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEmployees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
                                                    {employee.name
                                                        ?.split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase() ||
                                                        employee.employeeId
                                                            ?.slice(0, 3)
                                                            .toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {employee.name ||
                                                            employee.employeeId}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID:{" "}
                                                        {employee.employeeId ||
                                                            "Not Assigned"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {employee.department ||
                                                    "Not Assigned"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {employee.position ||
                                                    "Not Assigned"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {employee.email || "No Email"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {employee.phone || "No Phone"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(employee.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${
                                                        employee.status ===
                                                        "New Hire"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : employee.status ===
                                                              "Active"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() =>
                                                        handleViewEmployee(
                                                            employee.id
                                                        )
                                                    }
                                                    className="text-[#9AADEA] hover:text-[#7b8edc] transition border border-[#9AADEA] px-3 py-1 rounded-lg"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleEditCredentials(
                                                            employee
                                                        )
                                                    }
                                                    className="bg-[#9AADEA] text-white hover:bg-[#7b8edc] transition px-3 py-1 rounded-lg"
                                                >
                                                    Edit Credentials
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">
                            No employees found matching the selected filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <AddEmployeeModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onEmployeeAdded={fetchEmployees}
                    universityId={universityId}
                />
            )}

            {/* Edit Credentials Modal */}
            {isEditCredentialsModalOpen && (
                <EditCredentialsModal
                    isOpen={isEditCredentialsModalOpen}
                    onClose={() => setIsEditCredentialsModalOpen(false)}
                    employee={currentEmployee}
                    universityId={universityId}
                    onEmployeeUpdated={fetchEmployees}
                />
            )}
        </div>
    );
};

export default Employees;

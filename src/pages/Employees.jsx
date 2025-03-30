import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import PageLoader from "../components/PageLoader";
import AddEmployeeModal from "../components/Modals/AddEmployeeModal";
import { exportEmployees, importEmployees } from "../services/employeeService";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all"); // "all", "newHires", "active", "inactive"
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch employees from Firestore
    const fetchEmployees = async () => {
        try {
            const q = query(
                collection(db, "employees"),
                orderBy("dateHired", "desc")
            );
            const querySnapshot = await getDocs(q);

            const employeeData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                dateHired: doc.data().dateHired?.toDate?.() || new Date(),
            }));

            setEmployees(employeeData);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError("Failed to load employees. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Filter employees based on selected filter
    const filteredEmployees = employees.filter((employee) => {
        if (filter === "all") return true;
        if (filter === "newHires") return employee.status === "New Hire";
        if (filter === "active") return employee.status === "Active";
        if (filter === "inactive") return employee.status === "Inactive";
        return true;
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
        if (file) {
            try {
                const result = await importEmployees(file);
                if (result.success) {
                    showSuccessAlert(result.message);
                    fetchEmployees(); // Refresh the employee list
                } else {
                    showErrorAlert("Import failed: " + result.error);
                }
            } catch (error) {
                showErrorAlert("Import failed: " + error.message);
            }
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const result = await exportEmployees();
            if (result.success) {
                showSuccessAlert("Employees exported successfully!");
            } else {
                showErrorAlert("Export failed: " + result.error);
            }
        } catch (error) {
            showErrorAlert("Export failed: " + error.message);
        }
    };

    // Handle view employee details
    const handleViewEmployee = (employeeId) => {
        // Navigate to employee details page (to be implemented)
        console.log("View employee:", employeeId);
    };

    // Handle edit employee
    const handleEditEmployee = (employee) => {
        // Open edit employee modal (to be implemented)
        console.log("Edit employee:", employee.id);
    };

    if (loading) {
        return <PageLoader message="Loading employees..." />;
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
        <div className="p-6">
            {/* Main Container */}
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

                {/* Horizontal Divider */}
                <hr className="border-t border-gray-300 mb-6" />

                {/* Filter Section */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-lg transition ${
                            filter === "all"
                                ? "bg-[#9AADEA] text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                    >
                        All Employees
                    </button>
                    <button
                        onClick={() => setFilter("newHires")}
                        className={`px-4 py-2 rounded-lg transition ${
                            filter === "newHires"
                                ? "bg-[#9AADEA] text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                    >
                        New Hires
                    </button>
                    <button
                        onClick={() => setFilter("active")}
                        className={`px-4 py-2 rounded-lg transition ${
                            filter === "active"
                                ? "bg-[#9AADEA] text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter("inactive")}
                        className={`px-4 py-2 rounded-lg transition ${
                            filter === "inactive"
                                ? "bg-[#9AADEA] text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                    >
                        Inactive
                    </button>
                </div>

                {/* Employee Count */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing {filteredEmployees.length}{" "}
                        {filter !== "all" ? `(${filter})` : ""} out of{" "}
                        {employees.length} employees
                    </p>
                </div>

                {/* Employees Section */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {filteredEmployees.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Department
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
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {employee.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {employee.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.position}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.department}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(
                                                    employee.dateHired
                                                )}
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
                                                            handleEditEmployee(
                                                                employee
                                                            )
                                                        }
                                                        className="bg-[#9AADEA] text-white hover:bg-[#7b8edc] transition px-3 py-1 rounded-lg"
                                                    >
                                                        Edit
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
                                No employees found matching the selected filter.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <AddEmployeeModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onEmployeeAdded={() => {
                        fetchEmployees(); // Refresh employees list after adding a new one
                        setIsAddModalOpen(false); // Close the modal
                    }}
                />
            )}
        </div>
    );
};

export default Employees;

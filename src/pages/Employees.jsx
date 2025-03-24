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

    if (loading) {
        return <PageLoader message="Loading employees..." />;
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-red-500 text-xl font-bold mb-4">{error}</h2>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Employee Management
                </h1>
                <div className="flex gap-4">
                    {/* Import Button */}
                    <label className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
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
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
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
            <div className="flex flex-wrap gap-4 mb-6">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg ${
                        filter === "all"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } transition`}
                >
                    All Employees
                </button>
                <button
                    onClick={() => setFilter("newHires")}
                    className={`px-4 py-2 rounded-lg ${
                        filter === "newHires"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } transition`}
                >
                    New Hires
                </button>
                <button
                    onClick={() => setFilter("active")}
                    className={`px-4 py-2 rounded-lg ${
                        filter === "active"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } transition`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter("inactive")}
                    className={`px-4 py-2 rounded-lg ${
                        filter === "inactive"
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } transition`}
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

            {/* Employees Table */}
            {filteredEmployees.length > 0 ? (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {employee.position}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {employee.department}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(employee.dateHired)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${
                                                employee.status === "New Hire"
                                                    ? "bg-green-100 text-green-800"
                                                    : employee.status ===
                                                      "Active"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                                            View
                                        </button>
                                        <button className="text-green-600 hover:text-green-900">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-gray-500">
                        No employees found with the selected filter.
                    </p>
                </div>
            )}

            {/* Add Employee Modal */}
            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onEmployeeAdded={fetchEmployees}
            />
        </div>
    );
};

export default Employees;

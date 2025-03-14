import React from "react";
import departments from "../../data/departments"; // Import departments data

const Filters = ({
    selectedDepartments,
    setSelectedDepartments,
    selectedStatus,
    setSelectedStatus,
    showNewApplicants,
    setShowNewApplicants,
}) => {
    const handleDepartmentChange = (dept) => {
        setSelectedDepartments((prev) =>
            prev.includes(dept)
                ? prev.filter((d) => d !== dept)
                : [...prev, dept]
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {/* New Applicants Filter */}
                <div>
                    <h3 className="font-semibold text-lg">New Applicants</h3>
                    <label className="flex items-center mt-2 text-gray-600">
                        <input
                            type="checkbox"
                            checked={showNewApplicants}
                            onChange={() =>
                                setShowNewApplicants((prev) => !prev)
                            }
                            className="mr-2 focus:ring-2 focus:ring-[#9AADEA] hover:bg-gray-100"
                        />
                        Show jobs with new applicants
                    </label>
                </div>

                {/* Departments Filter */}
                <div className="mt-4">
                    <h3 className="font-semibold text-lg">Departments</h3>
                    <div className="flex flex-col gap-2 mt-2 text-gray-600">
                        {departments.map((dept, index) => (
                            <label key={index} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedDepartments.includes(dept)}
                                    onChange={() =>
                                        handleDepartmentChange(dept)
                                    }
                                    className="mr-2 focus:ring-2 focus:ring-[#9AADEA] hover:bg-gray-100"
                                />
                                {dept}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status Filter */}
                <div className="mt-4">
                    <h3 className="font-semibold text-lg">Status</h3>
                    <div className="flex flex-col gap-2 mt-2 text-gray-600">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="status"
                                value="All"
                                checked={selectedStatus === "All"}
                                onChange={() => setSelectedStatus("All")}
                                className="mr-2 focus:ring-2 focus:ring-[#9AADEA] hover:bg-gray-100"
                            />
                            Show All
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="status"
                                value="Open"
                                checked={selectedStatus === "Open"}
                                onChange={() => setSelectedStatus("Open")}
                                className="mr-2 focus:ring-2 focus:ring-[#9AADEA] hover:bg-gray-100"
                            />
                            Show Open
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="status"
                                value="Closed"
                                checked={selectedStatus === "Closed"}
                                onChange={() => setSelectedStatus("Closed")}
                                className="mr-2 focus:ring-2 focus:ring-[#9AADEA] hover:bg-gray-100"
                            />
                            Show Closed
                        </label>
                    </div>
                </div>

                {/* Clear Filters Button */}
                <button
                    onClick={() => {
                        setSelectedDepartments([]);
                        setSelectedStatus("All");
                        setShowNewApplicants(false);
                    }}
                    className="w-full px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition duration-200"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default Filters;
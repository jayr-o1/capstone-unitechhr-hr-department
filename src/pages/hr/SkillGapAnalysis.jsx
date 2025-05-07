import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLightbulb,
    faChalkboardTeacher,
    faFileExport,
    faFilter,
} from "@fortawesome/free-solid-svg-icons";
import SkillGapClusterView from "../../components/hr/SkillGapClusterView";
import { CSVLink } from "react-csv";

const SkillGapAnalysis = () => {
    const [exportData, setExportData] = useState([]);
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterSpecialization, setFilterSpecialization] = useState("");

    // Departments for filter dropdown
    const departments = ["All Departments"];

    // Specializations for filter dropdown
    const specializations = ["All Specializations"];

    // Prepare CSV data for export
    const prepareExportData = () => {
        setExportData([]);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Training Needs</h1>

                <div className="flex space-x-2">
                    <div className="relative">
                        <select
                            className="appearance-none pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filterDepartment}
                            onChange={(e) =>
                                setFilterDepartment(e.target.value)
                            }
                        >
                            {departments.map((dept, index) => (
                                <option
                                    key={index}
                                    value={index === 0 ? "" : dept}
                                >
                                    {dept}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon
                                icon={faFilter}
                                className="text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filterSpecialization}
                            onChange={(e) =>
                                setFilterSpecialization(e.target.value)
                            }
                        >
                            {specializations.map((spec, index) => (
                                <option
                                    key={index}
                                    value={index === 0 ? "" : spec}
                                >
                                    {spec}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon
                                icon={faChalkboardTeacher}
                                className="text-gray-500"
                            />
                        </div>
                    </div>

                    <CSVLink
                        data={exportData}
                        filename="skill_gap_analysis.csv"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={prepareExportData}
                    >
                        <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                        Export Data
                    </CSVLink>
                </div>
            </div>

            {/* Skill Clusters Content */}
            <div className="mb-6">
                <SkillGapClusterView />
            </div>
        </div>
    );
};

export default SkillGapAnalysis;

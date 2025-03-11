import React from "react";
import AddJobButton from "./AddJobButton";

const Filters = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Add Job Button */}
            <AddJobButton />

            {/* Scrollable Filters Container */}
            <div className="flex-1 overflow-y-auto">
                {/* Departments Filter */}
                <div>
                    <h3 className="font-semibold text-lg">Departments</h3>
                    <div className="flex flex-col gap-2 mt-2 text-gray-600">
                        {[
                            "College of Business Accountancy",
                            "College of Computer Science",
                            "College of Criminology",
                            "College of Education",
                            "College of Tourism",
                            "College of Nursing",
                            "College of Psychology",
                            "College of Engineering",
                        ].map((dept, index) => (
                            <label key={index} className="flex items-center">
                                <input type="checkbox" className="mr-2" />
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
                                className="mr-2"
                            />
                            Open
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="status"
                                className="mr-2"
                            />
                            Closed
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Filters;

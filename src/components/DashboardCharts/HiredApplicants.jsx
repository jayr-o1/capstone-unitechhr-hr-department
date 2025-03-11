import React from "react";

const hiredApplicants = [
    {
        name: "John Doe",
        position: "Computer Science Instructor",
        hiredAt: "March 11, 2025 10:08 PM",
    },
    {
        name: "Jane Smith",
        position: "Software Engineer",
        hiredAt: "March 10, 2025 3:45 PM",
    },
    {
        name: "Alice Johnson",
        position: "Data Analyst",
        hiredAt: "March 9, 2025 1:30 PM",
    },
];

const HiredApplicants = () => {
    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            <div className="space-y-3">
                {hiredApplicants.map((applicant, index) => (
                    <div
                        key={index}
                        className="p-3 rounded-lg bg-blue-100 text-blue-900 shadow-sm"
                    >
                        <p>
                            <span className="font-medium">
                                {applicant.name}
                            </span>{" "}
                            hired for the position of{" "}
                            <span className="font-medium">
                                {applicant.position}
                            </span>
                        </p>
                        <p className="text-xs text-blue-700">
                            {applicant.hiredAt}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HiredApplicants;

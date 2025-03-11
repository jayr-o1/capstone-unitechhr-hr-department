import React from "react";
import DonutChart from "../components/Charts/DonutChart";

const Dashboard = () => {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Dashboard Grid - Full Height & Responsive Shrinking */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 h-full">
                {[
                    "Total Number of Applicants",
                    "Total Number of Employees",
                    "Hired Applicants",
                    "Job Post Views",
                    "Employees per Clustered Recommendation",
                ].map((text, index) => (
                    <div
                        key={index}
                        className={`bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-start h-full min-h-0 
                            ${index === 1 ? "md:col-span-2" : ""}`} // Make 2nd item span 2 columns
                    >
                        <h1 className="text-[clamp(1rem, 2vw, 1.5rem)] font-semibold mb-4 text-center">
                            {text}
                        </h1>

                        {/* Insert DonutChart inside the "Total Number of Employees" container */}
                        {index === 1 && (
                            <div className="w-full h-full flex justify-center items-center">
                                <DonutChart />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;

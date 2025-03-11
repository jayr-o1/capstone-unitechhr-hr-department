import React from "react";
import NumberOfEmployeesChart from "../components/DashboardCharts/NumberOfEmployeesChart";
import NewHiresThisMonthChart from "../components/DashboardCharts/NewHiresThisMonthChart";

const Dashboard = () => {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Dashboard Grid - Structured Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                {/* KEY METRICS SECTION (TOP) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-3">
                    {/* New Hires */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
                        <NewHiresThisMonthChart
                            count={25}
                            percentageChange={10}
                        />
                    </div>

                    {/* Application Status Breakdown */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
                        <h1 className="text-[clamp(1rem, 2vw, 1.5rem)] font-semibold text-center">
                            Application Status Breakdown
                        </h1>
                    </div>

                    {/* Top Skills Gaps */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
                        <h1 className="text-[clamp(1rem, 2vw, 1.5rem)] font-semibold text-center">
                            Top Skills Gaps
                        </h1>
                    </div>
                </div>

                {/* MAIN VISUALS SECTION (BOTTOM) */}

                {/* Total Number of Employees - Takes 2 Columns */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center md:col-span-2">
                    <h1 className="text-[clamp(1rem, 2vw, 1.5rem)] font-semibold text-center">
                        Total Number of Employees
                    </h1>
                    <div className="w-full max-h-[400px] aspect-square flex justify-center items-center">
                        <NumberOfEmployeesChart />
                    </div>
                </div>

                {/* Hired Applicants */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <h1 className="text-[clamp(1rem, 2vw, 1.5rem)] font-semibold text-center">
                        Hired Applicants
                    </h1>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

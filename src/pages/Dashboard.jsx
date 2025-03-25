import React from "react";
import NumberOfEmployeesChart from "../components/DashboardCharts/NumberOfEmployeesChart";
import TopSkillGapsChart from "../components/DashboardCharts/TopSkillGapsChart";
import HiredApplicants from "../components/DashboardCharts/HiredApplicants";
import RecruitmentMetrics from "../components/DashboardCharts/RecruitmentMetrics";

const Dashboard = () => {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                {/* Key Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-3">
                    {/* Recruitment Metrics */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        <h1 className="text-lg font-semibold text-center">
                            Recruitment Metrics
                        </h1>
                        <RecruitmentMetrics />
                    </div>

                    {/* Hired Applicants */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h1 className="text-lg font-semibold text-center">
                            Recent Hires
                        </h1>
                        <HiredApplicants />
                    </div>
                </div>

                {/* Main Visuals Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center md:col-span-2">
                    <h1 className="text-lg font-semibold text-center">
                        Total Number of Employees
                    </h1>
                    <div className="w-full max-h-[400px] aspect-square flex justify-center items-center">
                        <NumberOfEmployeesChart />
                    </div>
                </div>

                {/* Top Skills Gaps */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                    <h1 className="text-lg font-semibold text-center">
                        Top Skills Gaps
                    </h1>
                    <div className="w-full max-h-[400px] aspect-square flex justify-center items-center">
                        <TopSkillGapsChart />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

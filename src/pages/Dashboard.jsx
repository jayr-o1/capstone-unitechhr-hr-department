import React from "react";
import NumberOfEmployeesChart from "../components/DashboardCharts/NumberOfEmployeesChart";
import TopSkillGapsChart from "../components/DashboardCharts/TopSkillGapsChart";
import HiredApplicants from "../components/DashboardCharts/HiredApplicants";

const Dashboard = () => {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                {/* Key Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-3">
                    {/* Recruitment Metrics */}
                    <div className="bg-white p-6 rounded-xl shadow-lg md:col-span-2">
                        <h1 className="text-lg font-semibold text-center">
                            Recruitment Metrics
                        </h1>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <MetricCard
                                title="Open Job Positions"
                                value="12 Openings"
                            />
                            <MetricCard title="Applicants" value="5" />
                            <MetricCard
                                title="Offer Acceptance Rate"
                                value="85%"
                            />
                            <MetricCard title="Cost per Hire" value="$3,200" />
                        </div>
                    </div>

                    {/* Hired Applicants */}
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h1 className="text-lg font-semibold text-center">
                            Hired Applicants
                        </h1>
                        <HiredApplicants />
                    </div>
                </div>

                {/* Main Visuals Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center md:col-span-2">
                    <h1 className="text-lg font-semibold text-center">
                        Total Number of Employees
                    </h1>
                    <div className="w-full max-h-[400px] aspect-square mt-10 flex justify-center items-center">
                        <NumberOfEmployeesChart />
                    </div>
                </div>

                {/* Top Skills Gaps */}
                <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                    <h1 className="text-lg font-semibold text-center">
                        Top Skills Gaps
                    </h1>
                    <div className="w-full max-h-[400px] aspect-square mt-10 flex justify-center items-center">
                        <TopSkillGapsChart />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable MetricCard Component
const MetricCard = ({ title, value }) => (
    <div className="bg-gray-100 p-4 rounded-lg text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-gray-700">{value}</p>
    </div>
);

export default Dashboard;

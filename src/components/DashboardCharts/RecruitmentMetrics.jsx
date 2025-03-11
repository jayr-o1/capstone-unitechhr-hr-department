import React from "react";
import { Briefcase, Users, CalendarCheck } from "lucide-react";

const metricsData = [
    {
        title: "Open Job Positions",
        value: "12",
        icon: <Briefcase size={48} className="text-blue-500" />,
    },
    {
        title: "Pending Applicants",
        value: "5",
        icon: <Users size={48} className="text-yellow-500" />,
    },
    {
        title: "Scheduled Applicants",
        value: "3",
        icon: <CalendarCheck size={48} className="text-green-500" />,
    },
];

const RecruitmentMetrics = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {metricsData.map((metric, index) => (
                <div
                    key={index}
                    className="bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center"
                >
                    {metric.icon}
                    <h2 className="text-lg font-semibold mt-2">
                        {metric.title}
                    </h2>
                    <p className="text-[#9AADEA] text-3xl font-semibold">
                        {metric.value}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default RecruitmentMetrics;

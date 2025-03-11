import React from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// Sample data with exactly 5 skills
const initialData = [
    { skill: "Leadership", employees: 45 },
    { skill: "Data Analysis", employees: 30 },
    { skill: "Project Management", employees: 25 },
    { skill: "Communication", employees: 50 },
    { skill: "Technical Skills", employees: 40 },
];

// Ensure exactly 5 valid skills
const enforceFiveSkills = (data) => {
    return data
        .slice(0, 5) // Trim to exactly 5 points
        .map((d) => ({
            ...d,
            employees: Math.max(d.employees, 1), // Avoid 0 values
        }));
};

// Custom Legend
const renderLegend = (props) => {
    const { payload } = props;
    return (
        <div className="flex gap-4 justify-center mt-2">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color || "#A0C4FF" }}
                    ></div>
                    <span className="text-sm">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const TopSkillGapsChart = () => {
    const data = enforceFiveSkills(initialData);

    return (
        <div className="w-full h-100">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#ddd" />
                    <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fontSize: 12, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis domain={[0, 50]} tick={false} />
                    <Tooltip />
                    <Legend content={renderLegend} />
                    <Radar
                        name="Employees"
                        dataKey="employees"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="#93C5FD"
                        fillOpacity={0.6}
                        connectNulls={true} // 🔥 FIX: Ensures smooth shape
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopSkillGapsChart;

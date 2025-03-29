import React, { useState, useEffect } from "react";
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
import { db, auth } from "../../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getUserData } from "../../services/userService";

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
    const [loading, setLoading] = useState(true);
    const [universityId, setUniversityId] = useState(null);
    const [skillGapData, setSkillGapData] = useState([]);
    
    // Default data in case the fetch fails
    const defaultData = [
        { skill: "Leadership", employees: 45 },
        { skill: "Data Analysis", employees: 30 },
        { skill: "Project Management", employees: 25 },
        { skill: "Communication", employees: 50 },
        { skill: "Technical Skills", employees: 40 },
    ];

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    setLoading(false);
                    setSkillGapData(enforceFiveSkills(defaultData));
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setLoading(false);
                    setSkillGapData(enforceFiveSkills(defaultData));
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
                setSkillGapData(enforceFiveSkills(defaultData));
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Fetch skill gap data when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchSkillGapData();
        }
    }, [universityId]);

    const fetchSkillGapData = async () => {
        try {
            console.log("Fetching skill gap data with universityId:", universityId);
            
            // For now, always use sample data since the skillGaps collection likely doesn't exist yet
            console.log("Using sample skill gap data as this is a new feature");
            const sampleData = [
                { skill: "Leadership", employees: 45 },
                { skill: "Data Analysis", employees: 30 },
                { skill: "Project Management", employees: 25 },
                { skill: "Communication", employees: 50 },
                { skill: "Technical Skills", employees: 40 },
            ];
            
            setSkillGapData(enforceFiveSkills(sampleData));
            setLoading(false);
            
            // The below code is commented out but kept for future implementation
            /* 
            // Get skills data from university's skills gap collection or similar
            // This is a placeholder implementation - adjust according to your actual data structure
            const skillsRef = collection(db, "universities", universityId, "skillGaps");
            const skillsSnapshot = await getDocs(skillsRef);
            
            if (!skillsSnapshot.empty) {
                // If you have a dedicated skillGaps collection
                const gapData = skillsSnapshot.docs.map(doc => ({
                    skill: doc.id,
                    employees: doc.data().count || 0
                }));
                
                // Sort by the highest skill gap count
                gapData.sort((a, b) => b.employees - a.employees);
                
                setSkillGapData(enforceFiveSkills(gapData));
            } else {
                // If you don't have skillGaps collection, analyze employee skills
                // This is just an example - implement according to your data structure
                const employeesRef = collection(db, "universities", universityId, "employees");
                const employeesSnapshot = await getDocs(employeesRef);
                
                // Map of skill gaps 
                const skillGaps = {
                    "Leadership": 0,
                    "Data Analysis": 0, 
                    "Project Management": 0,
                    "Communication": 0,
                    "Technical Skills": 0,
                    "Teamwork": 0,
                    "Problem Solving": 0,
                    "Critical Thinking": 0,
                };
                
                // Process employee skills
                employeesSnapshot.forEach(doc => {
                    const employeeData = doc.data();
                    const skills = employeeData.skills || [];
                    
                    // Update skill gap counts based on missing skills
                    Object.keys(skillGaps).forEach(skill => {
                        if (!skills.includes(skill)) {
                            skillGaps[skill]++;
                        }
                    });
                });
                
                // Convert to array format for the chart
                const gapData = Object.entries(skillGaps).map(([skill, count]) => ({
                    skill,
                    employees: count
                }));
                
                // Sort by the highest skill gap count
                gapData.sort((a, b) => b.employees - a.employees);
                
                setSkillGapData(enforceFiveSkills(gapData));
            }
            */
        } catch (error) {
            console.error("Error fetching skill gap data:", error);
            // Fallback to default data
            setSkillGapData(enforceFiveSkills(defaultData));
            setLoading(false);
        }
    };

    const data = skillGapData;

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading skill data...</div>
            </div>
        );
    }

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

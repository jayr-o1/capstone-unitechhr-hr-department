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
    if (data.length === 0) {
        return [{ skill: "No Data", employees: 0 }];
    }
    
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
    
    // Empty data for when no data is available
    const emptyData = [{ skill: "No Data", employees: 0 }];

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    setLoading(false);
                    setSkillGapData(emptyData);
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setLoading(false);
                    setSkillGapData(emptyData);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
                setSkillGapData(emptyData);
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
            
            // Initialize skill gap tracking
            const skillGaps = {};
            
            // Get employees from the university's employees subcollection
            const employeesRef = collection(db, "universities", universityId, "employees");
            const employeesSnapshot = await getDocs(employeesRef);
            
            // Process each employee
            const fetchPromises = [];
            
            employeesSnapshot.forEach((doc) => {
                const employee = { id: doc.id, ...doc.data() };
                
                // Get skill gaps for this employee
                const skillGapsRef = collection(
                    db, 
                    "universities", 
                    universityId, 
                    "employees", 
                    doc.id, 
                    "skillGaps"
                );
                
                const fetchPromise = getDocs(skillGapsRef).then((gapsSnapshot) => {
                    if (!gapsSnapshot.empty) {
                        gapsSnapshot.forEach((gapDoc) => {
                            const gapData = gapDoc.data();
                            const skillName = gapData.skill || "Unknown Skill";
                            
                            // Track this skill gap
                            if (!skillGaps[skillName]) {
                                skillGaps[skillName] = {
                                    skill: skillName,
                                    employees: 0
                                };
                            }
                            
                            // Increment the employee count for this skill
                            skillGaps[skillName].employees++;
                        });
                    }
                });
                
                fetchPromises.push(fetchPromise);
            });
            
            // Wait for all skill gap queries to complete
            await Promise.all(fetchPromises);
            
            // Convert to array and sort by number of employees (highest first)
            const gapArray = Object.values(skillGaps);
            gapArray.sort((a, b) => b.employees - a.employees);
            
            console.log("Skill gaps found:", gapArray);
            
            if (gapArray.length > 0) {
                setSkillGapData(enforceFiveSkills(gapArray));
            } else {
                console.log("No skill gaps found, using empty data");
                setSkillGapData(emptyData);
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching skill gap data:", error);
            // Fallback to empty data
            setSkillGapData(emptyData);
            setLoading(false);
        }
    };

    const data = skillGapData;
    const hasData = data.length > 0 && data[0].skill !== "No Data";

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading skill data...</div>
            </div>
        );
    }

    return (
        <div className="w-full h-100">
            {!hasData ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <p className="mb-2">No training needs data available</p>
                        <p className="text-sm">Add skill gaps in the Training Needs section</p>
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#ddd" />
                        <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fontSize: 12, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis domain={[0, 'auto']} tick={false} />
                        <Tooltip />
                        <Legend content={renderLegend} />
                        <Radar
                            name="Employees"
                            dataKey="employees"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fill="#93C5FD"
                            fillOpacity={0.6}
                            connectNulls={true}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default TopSkillGapsChart;

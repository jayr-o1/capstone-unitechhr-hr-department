import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { db, auth } from "../../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getUserData } from "../../services/userService";

// Default colors for departments
const departmentColors = {
    "College of Criminology": "#00B4D8",
    "College of Education": "#8B5CF6",
    "College of Computer Studies": "#60A5FA",
    "College of Business Accountancy": "#EC4899",
    "College of Nursing": "#FBBF24",
    "Administration": "#10B981",
    "Human Resources": "#F59E0B",
    "Other": "#6B7280"
};

const NumberOfEmployeesChart = () => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [loading, setLoading] = useState(true);
    const [universityId, setUniversityId] = useState(null);
    const [employeeData, setEmployeeData] = useState([]);
    const [total, setTotal] = useState(0);

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    setLoading(false);
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Fetch employee data when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchEmployeeData();
        }
    }, [universityId]);

    const fetchEmployeeData = async () => {
        try {
            console.log("Fetching employee data with universityId:", universityId);
            
            // Get all employees from the university's employees subcollection
            const employeesRef = collection(db, "universities", universityId, "employees");
            console.log("Executing employees query...");
            const employeesSnapshot = await getDocs(employeesRef);
            console.log(`Found ${employeesSnapshot.size} total employees`);
            
            if (employeesSnapshot.size === 0) {
                console.log("No employees found, using sample data");
                // Use sample data if no employees found
                const sampleData = [
                    { name: "College of Criminology", value: 40, color: "#00B4D8" },
                    { name: "College of Education", value: 80, color: "#8B5CF6" },
                    { name: "College of Computer Studies", value: 70, color: "#60A5FA" },
                    { name: "College of Business Accountancy", value: 60, color: "#EC4899" },
                    { name: "College of Nursing", value: 30, color: "#FBBF24" },
                ];
                setEmployeeData(sampleData);
                setTotal(sampleData.reduce((acc, item) => acc + item.value, 0));
                setLoading(false);
                return;
            }
            
            // Group employees by department
            const departmentCounts = {};
            
            employeesSnapshot.forEach(doc => {
                const employeeData = doc.data();
                console.log("Employee data:", employeeData);
                
                const department = employeeData.department || "Other";
                if (departmentCounts[department]) {
                    departmentCounts[department]++;
                } else {
                    departmentCounts[department] = 1;
                }
            });
            
            console.log("Department counts:", departmentCounts);
            
            // Convert to array format for the chart
            const chartData = Object.entries(departmentCounts).map(([name, value]) => ({
                name,
                value,
                color: departmentColors[name] || "#6B7280" // Use predefined color or default gray
            }));
            
            // Sort by count (highest first)
            chartData.sort((a, b) => b.value - a.value);
            
            console.log("Chart data:", chartData);
            
            // Calculate total
            const employeeTotal = chartData.reduce((acc, item) => acc + item.value, 0);
            
            setEmployeeData(chartData);
            setTotal(employeeTotal);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching employee data:", error);
            // Use sample data as fallback
            const sampleData = [
                { name: "College of Criminology", value: 40, color: "#00B4D8" },
                { name: "College of Education", value: 80, color: "#8B5CF6" },
                { name: "College of Computer Studies", value: 70, color: "#60A5FA" },
                { name: "College of Business Accountancy", value: 60, color: "#EC4899" },
                { name: "College of Nursing", value: 30, color: "#FBBF24" },
            ];
            setEmployeeData(sampleData);
            setTotal(sampleData.reduce((acc, item) => acc + item.value, 0));
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        const updateDimensions = (entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        };

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading employee data...</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ overflow: "visible" }} // Allow labels to overflow
        >
            {dimensions.width > 0 && dimensions.height > 0 && employeeData.length > 0 ? (
                <PieChart width={dimensions.width} height={dimensions.height}>
                    <Pie
                        data={employeeData}
                        cx={dimensions.width / 2}
                        cy={dimensions.height / 2}
                        innerRadius={dimensions.height * 0.2} // Adjusted to be based on height
                        outerRadius={dimensions.height * 0.35} // Adjusted to be based on height
                        paddingAngle={3}
                        dataKey="value"
                        label={({ cx, cy, midAngle, outerRadius, index }) => {
                            const RADIAN = Math.PI / 180;
                            const x =
                                cx +
                                (outerRadius + 30) * // Reduced label distance
                                    Math.cos(-midAngle * RADIAN);
                            const y =
                                cy +
                                (outerRadius + 30) *
                                    Math.sin(-midAngle * RADIAN);
                            return (
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="middle"
                                    fill="#000"
                                    fontSize={dimensions.width > 400 ? 12 : 10} // Adjusted font size
                                    fontWeight="bold"
                                    pointerEvents="none"
                                >
                                    {employeeData[index].name}
                                </text>
                            );
                        }}
                    >
                        {employeeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}

                        <Label
                            content={({ viewBox }) => {
                                const { cx, cy } = viewBox;
                                return (
                                    <text
                                        x={cx}
                                        y={cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={30}
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {total}
                                    </text>
                                );
                            }}
                        />
                    </Pie>
                </PieChart>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-400">No employee data available</div>
                </div>
            )}
        </div>
    );
};

export default NumberOfEmployeesChart;

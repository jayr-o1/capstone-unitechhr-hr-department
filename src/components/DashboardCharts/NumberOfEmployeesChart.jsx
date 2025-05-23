import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { db, auth } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { getUserData } from "../../services/userService";

// Default colors for departments
const departmentColors = {
    "College of Criminology": "#00B4D8",
    "College of Education": "#8B5CF6",
    "College of Computer Studies": "#60A5FA",
    "College of Business Accountancy": "#EC4899",
    "College of Nursing": "#FBBF24",
    Administration: "#10B981",
    "Human Resources": "#F59E0B",
    Other: "#6B7280",
};

// Empty data structure for when no data is available
const EMPTY_DATA = [
    { name: "No Data", value: 1, color: "#6B7280" },
];

const NumberOfEmployeesChart = () => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 }); // Default dimensions
    const [loading, setLoading] = useState(true);
    const [universityId, setUniversityId] = useState(null);
    const [employeeData, setEmployeeData] = useState([]);
    const [total, setTotal] = useState(0);

    // Set up dimensions detection immediately
    useLayoutEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                // Ensure we have valid dimensions
                if (offsetWidth > 0 && offsetHeight > 0) {
                    console.log(
                        "Container dimensions:",
                        offsetWidth,
                        offsetHeight
                    );
                    setDimensions({
                        width: offsetWidth,
                        height: offsetHeight,
                    });
                } else {
                    // Use parent dimensions or fallback to defaults
                    const parentElement = containerRef.current.parentElement;
                    if (parentElement) {
                        const { offsetWidth, offsetHeight } = parentElement;
                        if (offsetWidth > 0 && offsetHeight > 0) {
                            console.log(
                                "Parent dimensions:",
                                offsetWidth,
                                offsetHeight
                            );
                            setDimensions({
                                width: offsetWidth,
                                height: offsetHeight,
                            });
                            return;
                        }
                    }

                    // Last resort - use fixed dimensions if all else fails
                    console.log("Using fixed dimensions");
                    setDimensions({ width: 300, height: 300 });
                }
            }
        };

        // Initial update
        updateDimensions();

        // Set up resize observer
        const resizeObserver = new ResizeObserver((entries) => {
            updateDimensions();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Also use window resize as backup
        window.addEventListener("resize", updateDimensions);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;

                if (!user) {
                    console.error("No authenticated user found");
                    setEmployeeData(EMPTY_DATA);
                    setTotal(0);
                    setLoading(false);
                    return;
                }

                console.log("Getting university ID for user:", user.uid);

                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);

                if (
                    userDataResult.success &&
                    userDataResult.data.universityId
                ) {
                    console.log(
                        "Found university ID:",
                        userDataResult.data.universityId
                    );
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setEmployeeData(EMPTY_DATA);
                    setTotal(0);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setEmployeeData(EMPTY_DATA);
                setTotal(0);
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
        console.log("Fetching employee data with universityId:", universityId);

        try {
            if (!universityId) {
                console.error(
                    "Cannot fetch employee data: universityId is null"
                );
                setEmployeeData(EMPTY_DATA);
                setTotal(0);
                setLoading(false);
                return;
            }

            const departmentCounts = {};
            
            // ONLY query the university's employees subcollection
            try {
                const universityEmployeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const universityEmployeesSnapshot = await getDocs(universityEmployeesRef);
                console.log(
                    `University subcollection found ${universityEmployeesSnapshot.size} employees`
                );

                // Process employees
                universityEmployeesSnapshot.forEach((doc) => {
                    const employeeData = doc.data();
                    if (employeeData) {
                        const department = employeeData.department || "Other";
                        departmentCounts[department] = 
                            (departmentCounts[department] || 0) + 1;
                    }
                });
                
                // Log the actual counts by department
                console.log("Department counts:", departmentCounts);
                
            } catch (universityQueryError) {
                console.error(
                    "Error querying university employees subcollection:",
                    universityQueryError
                );
            }

            // Convert to array format for the chart
            if (Object.keys(departmentCounts).length > 0) {
                const chartData = Object.entries(departmentCounts).map(
                    ([name, value]) => ({
                        name,
                        value,
                        color: departmentColors[name] || "#6B7280",
                    })
                );

                // Sort by count (highest first)
                chartData.sort((a, b) => b.value - a.value);

                // Calculate total
                const employeeTotal = chartData.reduce(
                    (acc, item) => acc + item.value,
                    0
                );

                console.log("Final chart data:", chartData);
                console.log("Total employee count:", employeeTotal);
                
                setEmployeeData(chartData);
                setTotal(employeeTotal);
            } else {
                console.log("No department data found, using empty data");
                setEmployeeData(EMPTY_DATA);
                setTotal(0);
            }
        } catch (error) {
            console.error("Error in fetchEmployeeData:", error);
            setEmployeeData(EMPTY_DATA);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-gray-200 mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <p className="text-gray-400 mt-4">
                        Loading employee data...
                    </p>
                </div>
            </div>
        );
    }

    // Use the full container width and height
    const chartWidth = dimensions.width;
    const chartHeight = dimensions.height;

    // Calculate chart sizes relative to container for a larger appearance
    const innerRadius = Math.min(chartHeight * 0.25, 80); // Increased inner radius
    const outerRadius = Math.min(chartHeight * 0.45, 140); // Increased outer radius

    // Reduced padding to allow chart to take more space
    const containerPadding = 30;

    // Determine if we have actual data or empty state
    const hasData = employeeData.length > 0 && employeeData[0].name !== "No Data";

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center"
            style={{
                minHeight: "400px",
                padding: `${containerPadding}px`,
                overflow: "visible", // Ensure labels outside container are visible
            }}
        >
            <PieChart
                width={chartWidth - containerPadding * 2}
                height={chartHeight - containerPadding * 2}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }} // Reduced margins
            >
                <Pie
                    data={employeeData}
                    cx="50%" // Center horizontally
                    cy="50%" // Center vertically
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={hasData ? 3 : 0}
                    dataKey="value"
                    label={hasData ? ({
                        cx,
                        cy,
                        midAngle,
                        outerRadius,
                        index,
                        payload,
                        value,
                    }) => {
                        const RADIAN = Math.PI / 180;
                        // Increase label distance from chart
                        const labelDistanceMultiplier = 1.5; // Adjusted for better spacing
                        const x =
                            cx +
                            outerRadius *
                                labelDistanceMultiplier *
                                Math.cos(-midAngle * RADIAN);
                        const y =
                            cy +
                            outerRadius *
                                labelDistanceMultiplier *
                                Math.sin(-midAngle * RADIAN);

                        // Get the name safely
                        const name = payload?.name || "Department";

                        // Determine if this slice is significant enough to show a label
                        const totalVal = employeeData.reduce(
                            (sum, entry) => sum + entry.value,
                            0
                        );

                        const percentage = (value / totalVal) * 100;

                        // Only show label if percentage is large enough (prevents overcrowding)
                        if (percentage < 5) return null;

                        // For department names, we'll create a shorter version if needed
                        let displayName = name;
                        if (name.includes("College of")) {
                            displayName = name.replace("College of ", "CoL ");
                        }

                        return (
                            <text
                                x={x}
                                y={y}
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="middle"
                                fill="#000"
                                fontSize={12} // Increased font size
                                fontWeight="medium"
                                pointerEvents="none"
                            >
                                {displayName}
                            </text>
                        );
                    } : null}
                >
                    {employeeData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2} // Increased stroke width
                        />
                    ))}

                    <Label
                        content={({ viewBox }) => {
                            const { cx, cy } = viewBox;

                            return (
                                <>
                                    <text
                                        x={cx}
                                        y={cy - 10} // Adjusted position
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={42} // Much larger font size
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {total}
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy + 30} // Adjusted position
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={16} // Larger font size
                                        fontWeight="medium" // Added medium weight
                                        fill="#666"
                                    >
                                        {hasData ? "Total Employees" : "No Employees"}
                                    </text>
                                </>
                            );
                        }}
                    />
                </Pie>
            </PieChart>
        </div>
    );
};

export default NumberOfEmployeesChart;

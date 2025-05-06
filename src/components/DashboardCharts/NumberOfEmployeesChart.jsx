import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { db, auth } from "../../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getUserData } from "../../services/userService";
import { getUniversityEmployees } from "../../services/employeeService";

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

// Sample data to use as fallback
const SAMPLE_DATA = [
    { name: "College of Criminology", value: 12, color: "#00B4D8" },
    { name: "College of Education", value: 18, color: "#8B5CF6" },
    { name: "College of Computer Studies", value: 15, color: "#60A5FA" },
    { name: "College of Business Accountancy", value: 10, color: "#EC4899" },
    { name: "College of Nursing", value: 8, color: "#FBBF24" },
    { name: "Administration", value: 5, color: "#10B981" },
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
                    setEmployeeData(SAMPLE_DATA);
                    setTotal(
                        SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0)
                    );
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
                    setEmployeeData(SAMPLE_DATA);
                    setTotal(
                        SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0)
                    );
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setEmployeeData(SAMPLE_DATA);
                setTotal(
                    SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0)
                );
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
                setEmployeeData(SAMPLE_DATA);
                setTotal(
                    SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0)
                );
                setLoading(false);
                return;
            }

            const departmentCounts = {};
            let totalEmployeesFound = 0;

            // 1. Try to get employees using the service function first
            try {
                const result = await getUniversityEmployees(universityId);
                if (
                    result.success &&
                    result.employees &&
                    result.employees.length > 0
                ) {
                    console.log(
                        `Service function found ${result.employees.length} employees`
                    );
                    totalEmployeesFound += result.employees.length;

                    // Process employees from service function
                    result.employees.forEach((employee) => {
                        if (employee) {
                            const department = employee.department || "Other";
                            departmentCounts[department] =
                                (departmentCounts[department] || 0) + 1;
                        }
                    });
                }
            } catch (serviceError) {
                console.error("Error using employee service:", serviceError);
            }

            // 2. Try direct Firestore query to university employees subcollection
            try {
                const universityEmployeesRef = collection(
                    db,
                    "universities",
                    universityId,
                    "employees"
                );
                const universityEmployeesSnapshot = await getDocs(
                    universityEmployeesRef
                );
                console.log(
                    `University subcollection found ${universityEmployeesSnapshot.size} employees`
                );

                totalEmployeesFound += universityEmployeesSnapshot.size;

                universityEmployeesSnapshot.forEach((doc) => {
                    const employeeData = doc.data();
                    if (employeeData) {
                        const department = employeeData.department || "Other";
                        departmentCounts[department] =
                            (departmentCounts[department] || 0) + 1;
                    }
                });
            } catch (universityQueryError) {
                console.error(
                    "Error querying university employees subcollection:",
                    universityQueryError
                );
            }

            // 3. Try root employees collection (filter by universityId)
            try {
                const rootEmployeesRef = collection(db, "employees");
                const rootEmployeesQuery = query(
                    rootEmployeesRef,
                    where("universityId", "==", universityId)
                );
                const rootEmployeesSnapshot = await getDocs(rootEmployeesQuery);
                console.log(
                    `Root collection found ${rootEmployeesSnapshot.size} employees`
                );

                totalEmployeesFound += rootEmployeesSnapshot.size;

                rootEmployeesSnapshot.forEach((doc) => {
                    const employeeData = doc.data();
                    if (employeeData) {
                        const department = employeeData.department || "Other";
                        departmentCounts[department] =
                            (departmentCounts[department] || 0) + 1;
                    }
                });
            } catch (rootQueryError) {
                console.error(
                    "Error querying root employees collection:",
                    rootQueryError
                );
            }

            console.log(
                `Total employees found across all queries: ${totalEmployeesFound}`
            );
            console.log("Department counts:", departmentCounts);

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
                setEmployeeData(chartData);
                setTotal(employeeTotal);
            } else {
                console.log("No department data found, using sample data");
                setEmployeeData(SAMPLE_DATA);
                setTotal(
                    SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0)
                );
            }
        } catch (error) {
            console.error("Error in fetchEmployeeData:", error);
            setEmployeeData(SAMPLE_DATA);
            setTotal(SAMPLE_DATA.reduce((acc, item) => acc + item.value, 0));
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

    // Always use meaningful dimensions
    const chartWidth = Math.max(dimensions.width, 400); // Much wider minimum width
    const chartHeight = Math.max(dimensions.height, 300); // Taller minimum height

    // Calculate chart sizes relative to container but with reasonable limits
    const innerRadius = Math.min(chartHeight * 0.18, 45);
    const outerRadius = Math.min(chartHeight * 0.32, 80);

    // Add padding to ensure labels have space
    const containerPadding = 60; // More padding on each side

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
                margin={{ top: 20, right: 40, bottom: 20, left: 40 }} // Additional chart margin
            >
                <Pie
                    data={employeeData.length > 0 ? employeeData : SAMPLE_DATA}
                    cx={(chartWidth - containerPadding * 2) / 2}
                    cy={(chartHeight - containerPadding * 2) / 2}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={3}
                    dataKey="value"
                    label={({
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
                        const labelDistanceMultiplier = 1.8; // Much greater distance
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
                        const data =
                            employeeData.length > 0
                                ? employeeData
                                : SAMPLE_DATA;
                        const name =
                            payload?.name || data[index]?.name || "Department";

                        // Determine if this slice is significant enough to show a label
                        const totalVal =
                            employeeData.length > 0
                                ? employeeData.reduce(
                                      (sum, entry) => sum + entry.value,
                                      0
                                  )
                                : SAMPLE_DATA.reduce(
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
                                fontSize={10}
                                fontWeight="medium"
                                pointerEvents="none"
                            >
                                {displayName}
                            </text>
                        );
                    }}
                >
                    {(employeeData.length > 0 ? employeeData : SAMPLE_DATA).map(
                        (entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="#fff"
                                strokeWidth={1}
                            />
                        )
                    )}

                    <Label
                        content={({ viewBox }) => {
                            const { cx, cy } = viewBox;
                            const displayTotal =
                                employeeData.length > 0 ? total : 68;

                            return (
                                <>
                                    <text
                                        x={cx}
                                        y={cy - 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={28}
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {displayTotal}
                                    </text>
                                    <text
                                        x={cx}
                                        y={cy + 22}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={11}
                                        fill="#666"
                                    >
                                        {employeeData.length > 0
                                            ? "Total Employees"
                                            : "Sample Data"}
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

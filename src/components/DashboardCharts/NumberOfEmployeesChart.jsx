import React, { useRef, useLayoutEffect, useState } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";

const data = [
    { name: "College of Criminology", value: 40, color: "#00B4D8" },
    { name: "College of Education", value: 80, color: "#8B5CF6" },
    { name: "College of Computer Studies", value: 70, color: "#60A5FA" },
    { name: "College of Business Accountancy", value: 60, color: "#EC4899" },
    { name: "College of Nursing", value: 30, color: "#FBBF24" },
];

const total = data.reduce((acc, item) => acc + item.value, 0);

const NumberOfEmployeesChart = () => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ overflow: "visible" }} // Allow labels to overflow
        >
            {dimensions.width > 0 && dimensions.height > 0 && (
                <PieChart width={dimensions.width} height={dimensions.height}>
                    <Pie
                        data={data}
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
                                    {data[index].name}
                                </text>
                            );
                        }}
                    >
                        {data.map((entry, index) => (
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
            )}
        </div>
    );
};

export default NumberOfEmployeesChart;

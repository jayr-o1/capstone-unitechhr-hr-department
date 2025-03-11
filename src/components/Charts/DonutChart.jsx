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

const DonutChart = () => {
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
        <div ref={containerRef} className="w-full h-full">
            {dimensions.width > 0 && dimensions.height > 0 && (
                <PieChart width={dimensions.width} height={dimensions.height}>
                    {/* Main Donut Chart */}
                    <Pie
                        data={data}
                        cx={dimensions.width / 2} // Center X
                        cy={dimensions.height / 2} // Center Y
                        innerRadius={dimensions.width * 0.14} // Reduced inner radius (14% of container width)
                        outerRadius={dimensions.width * 0.2} // Reduced outer radius (20% of container width)
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false} // Disable default label lines
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}

                        {/* Center Label (Total Count) */}
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

                    {/* Custom Labels Outside with Angled Connecting Lines */}
                    {data.map((entry, index) => {
                        const angle = (360 / data.length) * index; // Calculate angle for each segment
                        const midAngle = angle + 180 / data.length; // Mid-angle of the segment
                        const radius = dimensions.width * 0.2; // Outer radius of the donut (matches outerRadius)
                        const labelRadius = radius + 30; // Distance from the center for the label

                        // Calculate label position
                        const x =
                            dimensions.width / 2 +
                            labelRadius * Math.cos((-midAngle * Math.PI) / 180);
                        const y =
                            dimensions.height / 2 +
                            labelRadius * Math.sin((-midAngle * Math.PI) / 180);

                        // Calculate line start position (outer edge of the donut)
                        const lineX1 =
                            dimensions.width / 2 +
                            radius * Math.cos((-midAngle * Math.PI) / 180);
                        const lineY1 =
                            dimensions.height / 2 +
                            radius * Math.sin((-midAngle * Math.PI) / 180);

                        // Calculate intermediate point for the angled line
                        const lineX2 = lineX1 + (x - lineX1) * 0.5; // Midpoint X
                        const lineY2 = lineY1 + (y - lineY1) * 0.5; // Midpoint Y

                        // Adjust label position to avoid overlapping with the line
                        const labelOffset = 10; // Offset to prevent overlap
                        const labelX =
                            x +
                            (x > dimensions.width / 2
                                ? labelOffset
                                : -labelOffset);
                        const labelY =
                            y +
                            (y > dimensions.height / 2
                                ? labelOffset
                                : -labelOffset);

                        return (
                            <g key={`label-${index}`}>
                                {/* Angled Connecting Line */}
                                <path
                                    d={`M${lineX1},${lineY1} Q${lineX2},${lineY2} ${x},${y}`} // Quadratic Bézier curve
                                    stroke={entry.color} // Line color matches the segment color
                                    strokeWidth={2}
                                    fill="none"
                                />

                                {/* Label */}
                                <text
                                    x={labelX}
                                    y={labelY}
                                    textAnchor={
                                        x > dimensions.width / 2
                                            ? "start"
                                            : "end"
                                    } // Align text based on position
                                    dominantBaseline="middle"
                                    fill={entry.color} // Label color matches the segment color
                                    fontSize={12}
                                    fontWeight="bold"
                                >
                                    {entry.name}
                                </text>
                            </g>
                        );
                    })}
                </PieChart>
            )}
        </div>
    );
};

export default DonutChart;

import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

const NewHiresThisMonthChart = ({ count, percentageChange }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-gray-900">{count}</span>
            <div
                className={`flex items-center mt-2 ${
                    percentageChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
            >
                {percentageChange >= 0 ? (
                    <ArrowUp size={20} />
                ) : (
                    <ArrowDown size={20} />
                )}
                <span className="ml-1 text-sm font-semibold">
                    {Math.abs(percentageChange)}% from last month
                </span>
            </div>
        </div>
    );
};

export default NewHiresThisMonthChart;
